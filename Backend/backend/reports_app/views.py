import io
import requests
from datetime import datetime

from django.conf import settings
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from parcels.models import Parcelle
from palms.models import Palm
from core.permissions import IsManagerOrReadOnly


# ── Couleurs ──
VERT       = HexColor("#2E5E3E")
VERT_CLAIR = HexColor("#22c55e")
ORANGE     = HexColor("#f97316")
ROUGE      = HexColor("#ef4444")
NOIR_PALM  = HexColor("#1f2937")
GRIS       = HexColor("#6b7280")
GRIS_CLAIR = HexColor("#f3f4f6")
GRIS_MOYEN = HexColor("#e5e7eb")
SABLE      = HexColor("#F5F0E8")


def get_wms_image(layers, bbox, width=1400, height=900,
                  transparent=True, bgcolor="0xF5F0E8",
                  cql_filter=None):
    """Récupère une image PNG depuis GeoServer WMS."""
    params = {
        "SERVICE":     "WMS",
        "VERSION":     "1.1.1",
        "REQUEST":     "GetMap",
        "LAYERS":      layers,
        "BBOX":        f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
        "WIDTH":       width,
        "HEIGHT":      height,
        "SRS":         "EPSG:4326",
        "FORMAT":      "image/png",
        "TRANSPARENT": "true" if transparent else "false",
        "BGCOLOR":     bgcolor,
    }
    if cql_filter:
        params["CQL_FILTER"] = cql_filter

    url = f"{settings.GEOSERVER_URL}/{settings.GEOSERVER_WORKSPACE}/wms"
    print(f"🗺️ WMS URL: {url}")
    print(f"🗺️ WMS params: {params}")

    try:
        response = requests.get(
            url, params=params,
            auth=(settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD),
            timeout=30,
        )
        print(f"🗺️ WMS status: {response.status_code}")
        print(f"🗺️ WMS Content-Type: {response.headers.get('Content-Type')}")
        print(f"🗺️ WMS content size: {len(response.content)} octets")

        if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
            buf = io.BytesIO(response.content)
            buf.seek(0)  # ← curseur au début
            return buf
        else:
            print(f"❌ WMS erreur contenu: {response.text[:300]}")
    except Exception as e:
        print(f"❌ WMS exception: {e}")
    return None


def calculer_stats(parcelle):
    palms = Palm.objects.filter(parcelle=parcelle)
    total = palms.count()
    stats = {
        "total":    total,
        "bon":      palms.filter(etat_sante="B").count(),
        "moyen":    palms.filter(etat_sante="MO").count(),
        "mauvais":  palms.filter(etat_sante="MA").count(),
        "mort":     palms.filter(etat_sante="MR").count(),
        "males":    palms.filter(sexe="M").count(),
        "femelles": palms.filter(sexe="F").count(),
        "jeunes":   palms.filter(age="JP").count(),
        "adultes":  palms.filter(age="A").count(),
        "vieux":    palms.filter(age="V").count(),
    }
    if total > 0:
        stats["pct_bon"]     = round(stats["bon"]     / total * 100, 1)
        stats["pct_moyen"]   = round(stats["moyen"]   / total * 100, 1)
        stats["pct_mauvais"] = round(stats["mauvais"] / total * 100, 1)
        stats["pct_mort"]    = round(stats["mort"]    / total * 100, 1)
    else:
        stats["pct_bon"] = stats["pct_moyen"] = \
        stats["pct_mauvais"] = stats["pct_mort"] = 0
    return stats


def generer_pdf(parcelle, stats, wms_img, type_carte, titre):
    buffer   = io.BytesIO()
    pagesize = landscape(A4)
    page_w, page_h = pagesize
    margin   = 12 * mm

    c = canvas.Canvas(buffer, pagesize=pagesize)
    c.setTitle(titre)

    # ── EN-TÊTE ──
    header_h = 18 * mm
    header_y  = page_h - margin - header_h

    c.setFillColor(VERT)
    c.roundRect(margin, header_y, page_w - 2*margin, header_h,
                3, fill=1, stroke=0)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(margin + 6*mm, header_y + 11*mm, titre)

    superficie_ha = round((parcelle.superficie_m2 or 0) / 10000, 2)
    c.setFont("Helvetica", 9)
    c.drawString(
        margin + 6*mm, header_y + 4*mm,
        f"Parcelle : {parcelle.nom}   |   "
        f"Superficie : {superficie_ha} ha   |   "
        f"Statut : {parcelle.statut}   |   "
        f"Palmiers : {stats['total']}"
    )

    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(page_w - margin - 6*mm, header_y + 11*mm,
                      "PalmGIS Smart Farm")
    c.setFont("Helvetica", 8)
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    c.drawRightString(page_w - margin - 6*mm, header_y + 5*mm,
                      f"Zagora, Maroc — {date_str}")

    # ── ZONES ──
    content_y_top = header_y - 4*mm
    content_h     = content_y_top - margin - 10*mm
    sidebar_w     = 70 * mm
    carte_w       = page_w - 2*margin - sidebar_w - 5*mm
    carte_x       = margin
    carte_y       = margin + 10*mm

    # ── CARTE ──
    # Fond sable
    c.setFillColor(SABLE)
    c.roundRect(carte_x, carte_y, carte_w, content_h, 3, fill=1, stroke=0)

    # Image WMS
    if wms_img:
        try:
            wms_img.seek(0)  # ← remet le curseur au début
            img_reader = ImageReader(wms_img)
            print("✅ ImageReader créé, dessin de l'image...")
            c.drawImage(
                img_reader,
                carte_x, carte_y,
                width=carte_w, height=content_h,
                preserveAspectRatio=False,
                mask="auto",
            )
            print("✅ Image WMS dessinée sur le PDF")
        except Exception as e:
            print(f"❌ Erreur dessin WMS: {e}")
            import traceback
            print(traceback.format_exc())
    else:
        print("⚠️ Pas d'image WMS — fond sable uniquement")
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 10)
        c.drawCentredString(
            carte_x + carte_w/2,
            carte_y + content_h/2,
            "Carte non disponible"
        )

    # Bordure carte
    c.setStrokeColor(VERT)
    c.setLineWidth(1.5)
    c.roundRect(carte_x, carte_y, carte_w, content_h, 3, fill=0, stroke=1)

    # Badge type
    badge_w = 30*mm
    badge_x = carte_x + 3*mm
    badge_y = carte_y + content_h - 8*mm
    c.setFillColor(VERT)
    c.roundRect(badge_x, badge_y, badge_w, 5.5*mm, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(badge_x + badge_w/2, badge_y + 1.8*mm,
                        type_carte.replace("_", " ").upper())

    # Flèche Nord
    nord_x = carte_x + carte_w - 8*mm
    nord_y  = carte_y + 4*mm
    c.setFillColor(white)
    c.circle(nord_x, nord_y + 4*mm, 5*mm, fill=1, stroke=0)
    c.setStrokeColor(GRIS_MOYEN)
    c.setLineWidth(0.5)
    c.circle(nord_x, nord_y + 4*mm, 5*mm, fill=0, stroke=1)
    c.setFillColor(VERT)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(nord_x, nord_y + 5.5*mm, "N")
    c.setLineWidth(1.5)
    c.setStrokeColor(VERT)
    c.line(nord_x, nord_y + 2*mm, nord_x, nord_y + 7*mm)
    c.line(nord_x - 1.5*mm, nord_y + 5*mm, nord_x, nord_y + 7*mm)
    c.line(nord_x + 1.5*mm, nord_y + 5*mm, nord_x, nord_y + 7*mm)

    # ── SIDEBAR ──
    sb_x = margin + carte_w + 5*mm
    sb_y = content_y_top

    def section_titre(titre_sec, hauteur):
        nonlocal sb_y
        sb_y -= hauteur
        c.setFillColor(white)
        c.roundRect(sb_x, sb_y, sidebar_w, hauteur - 1.5*mm,
                    3, fill=1, stroke=0)
        c.setStrokeColor(GRIS_MOYEN)
        c.setLineWidth(0.5)
        c.roundRect(sb_x, sb_y, sidebar_w, hauteur - 1.5*mm,
                    3, fill=0, stroke=1)
        c.setFillColor(VERT)
        c.roundRect(sb_x, sb_y + hauteur - 7.5*mm, sidebar_w, 7*mm,
                    3, fill=1, stroke=0)
        c.rect(sb_x, sb_y + hauteur - 10*mm, sidebar_w, 4*mm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(sb_x + 3*mm, sb_y + hauteur - 5.5*mm, titre_sec)
        return sb_y + hauteur - 10*mm

    def info_ligne(label, valeur, y_pos, couleur_val=None):
        c.setFont("Helvetica", 7.5)
        c.setFillColor(GRIS)
        c.drawString(sb_x + 3*mm, y_pos, label)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(couleur_val or NOIR_PALM)
        c.drawRightString(sb_x + sidebar_w - 3*mm, y_pos, str(valeur))
        c.setStrokeColor(GRIS_CLAIR)
        c.setLineWidth(0.3)
        c.line(sb_x + 3*mm, y_pos - 1.5*mm,
               sb_x + sidebar_w - 3*mm, y_pos - 1.5*mm)
        return y_pos - 5.5*mm

    def barre_progress(label, pct, couleur, y_pos):
        c.setFont("Helvetica", 7.5)
        c.setFillColor(GRIS)
        c.drawString(sb_x + 3*mm, y_pos, label)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(NOIR_PALM)
        c.drawRightString(sb_x + sidebar_w - 3*mm, y_pos, f"{pct}%")
        barre_y = y_pos - 4*mm
        barre_w = sidebar_w - 6*mm
        barre_h = 4*mm
        c.setFillColor(GRIS_CLAIR)
        c.roundRect(sb_x + 3*mm, barre_y, barre_w, barre_h, 2, fill=1, stroke=0)
        if pct > 0:
            c.setFillColor(couleur)
            fill_w = max(barre_w * pct / 100, 2*mm)
            c.roundRect(sb_x + 3*mm, barre_y, fill_w, barre_h, 2, fill=1, stroke=0)
        return y_pos - 9.5*mm

    def legende_point(label, couleur, nb, y_pos):
        c.setFillColor(couleur)
        c.circle(sb_x + 5*mm, y_pos + 1.5*mm, 2.5*mm, fill=1, stroke=0)
        c.setStrokeColor(white)
        c.setLineWidth(0.5)
        c.circle(sb_x + 5*mm, y_pos + 1.5*mm, 2.5*mm, fill=0, stroke=1)
        c.setFillColor(NOIR_PALM)
        c.setFont("Helvetica", 7.5)
        c.drawString(sb_x + 9*mm, y_pos, label)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawRightString(sb_x + sidebar_w - 3*mm, y_pos, f"({nb})")
        return y_pos - 6*mm

    y = section_titre("PARCELLE", 42*mm)
    y = info_ligne("Nom",            parcelle.nom,                    y)
    y = info_ligne("Superficie",     f"{superficie_ha} ha",           y)
    y = info_ligne("Perimetre",      f"{parcelle.perimetre_m:.0f} m", y)
    y = info_ligne("Total palmiers", stats["total"],                   y)
    y = info_ligne("Males / Femelles",
                   f"{stats['males']} / {stats['femelles']}",         y)

    sb_y -= 3*mm

    y = section_titre("LEGENDE - ETAT SANITAIRE", 36*mm)
    y = legende_point("Bon etat",  VERT_CLAIR, stats["bon"],     y)
    y = legende_point("Moyen",     ORANGE,     stats["moyen"],   y)
    y = legende_point("Mauvais",   ROUGE,      stats["mauvais"], y)
    y = legende_point("Mort",      NOIR_PALM,  stats["mort"],    y)

    sb_y -= 3*mm

    y = section_titre("ETAT SANITAIRE (%)", 48*mm)
    y = barre_progress("Bon",     stats["pct_bon"],     VERT_CLAIR, y)
    y = barre_progress("Moyen",   stats["pct_moyen"],   ORANGE,     y)
    y = barre_progress("Mauvais", stats["pct_mauvais"], ROUGE,      y)
    y = barre_progress("Mort",    stats["pct_mort"],    NOIR_PALM,  y)

    sb_y -= 3*mm

    y = section_titre("AGE DES PALMIERS", 30*mm)
    y = info_ligne("Jeunes",  stats["jeunes"],  y, VERT_CLAIR)
    y = info_ligne("Adultes", stats["adultes"], y, VERT)
    y = info_ligne("Vieux",   stats["vieux"],   y, HexColor("#92400e"))

    # ── FOOTER ──
    footer_y = margin + 2*mm
    c.setFillColor(VERT)
    c.roundRect(margin, footer_y, page_w - 2*margin, 6.5*mm, 2, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica", 7)
    c.drawString(margin + 4*mm, footer_y + 2*mm,
                 "PalmGIS Smart Farm — Zagora, Maroc")
    c.drawCentredString(page_w/2, footer_y + 2*mm,
                        f"Type : {type_carte.replace('_', ' ').upper()}")
    c.drawRightString(page_w - margin - 4*mm, footer_y + 2*mm,
                      "Projection : WGS84 (EPSG:4326)")

    c.save()
    buffer.seek(0)
    return buffer


class CarteView(APIView):
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        print("=== CARTE REQUEST DATA ===", request.data)

        parcelle_id = request.data.get("parcelle_id")
        type_carte  = request.data.get("type_carte", "etat_sanitaire")
        orientation = request.data.get("orientation", "landscape")
        titre       = request.data.get("titre", "Carte de la palmeraie")

        print("=== parcelle_id ===", parcelle_id)

        if not parcelle_id:
            return Response(
                {"error": "parcelle_id est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            parcelle = Parcelle.objects.get(id=parcelle_id)
        except Parcelle.DoesNotExist:
            return Response(
                {"error": "Parcelle introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ── BBOX ──
        bbox = parcelle.geom.extent

        dx = (bbox[2] - bbox[0]) * 0.1
        dy = (bbox[3] - bbox[1]) * 0.1
        bbox_carte = (
            bbox[0] - dx,
            bbox[1] - dy,
            bbox[2] + dx,
            bbox[3] + dy,
        )

        img_w, img_h = 1400, 900

        # ── Image WMS ──
        layers = (
            f"{settings.GEOSERVER_WORKSPACE}:parcelles,"
            f"{settings.GEOSERVER_WORKSPACE}:palmiers"
        )

        wms_img = get_wms_image(
            layers=layers,
            bbox=bbox_carte,
            width=img_w,
            height=img_h,
            transparent=False,
            bgcolor="0xF5F0E8",
            cql_filter= None,
        )

        if wms_img:
            print(f"✅ WMS reçu : {len(wms_img.getvalue())} octets")
            wms_img.seek(0)
        else:
            print("❌ Pas d'image WMS")

        # ── Stats ──
        stats = calculer_stats(parcelle)

        # ── PDF ──
        try:
            pdf_buffer = generer_pdf(
                parcelle, stats, wms_img,
                type_carte, titre,
            )
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": f"Erreur PDF: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        nom = f"carte_{parcelle.nom}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response = HttpResponse(pdf_buffer.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{nom}"'
        return response