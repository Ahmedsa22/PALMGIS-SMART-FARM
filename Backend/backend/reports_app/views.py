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
            buf.seek(0)
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


def generer_pdf(parcelle, stats, wms_img, type_carte, titre,
                orientation="landscape"):

    buffer   = io.BytesIO()
    pagesize = landscape(A4) if orientation == "landscape" else A4
    page_w, page_h = pagesize
    margin   = 12 * mm

    c = canvas.Canvas(buffer, pagesize=pagesize)
    c.setTitle(titre)

    superficie_ha = round((parcelle.superficie_m2 or 0) / 10000, 2)

    # ════════════════════════════════════════
    # 1. CALCUL DES DIMENSIONS EN PREMIER
    # ════════════════════════════════════════
    header_h      = 16 * mm
    header_y      = page_h - margin - header_h
    stats_h       = 20 * mm
    stats_y       = margin + 2*mm
    content_y_top = header_y - 3*mm
    content_y_bot = stats_y + stats_h + 3*mm
    content_h     = content_y_top - content_y_bot
    sidebar_w     = 68 * mm
    carte_w       = page_w - 2*margin - sidebar_w - 4*mm
    carte_x       = margin
    carte_y       = content_y_bot
    sb_x          = margin + carte_w + 4*mm

    # ════════════════════════════════════════
    # 2. EN-TÊTE
    # ════════════════════════════════════════
    c.setFillColor(VERT)
    c.roundRect(margin, header_y, page_w - 2*margin, header_h,
                3, fill=1, stroke=0)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin + 6*mm, header_y + 10*mm, titre)

    c.setFont("Helvetica", 8.5)
    c.drawString(
        margin + 6*mm, header_y + 4*mm,
        f"Parcelle : {parcelle.nom}   |   "
        f"Superficie : {superficie_ha} ha   |   "
        f"Statut : {parcelle.statut}   |   "
        f"Palmiers : {stats['total']}"
    )

    c.setFont("Helvetica-Bold", 8.5)
    c.drawRightString(page_w - margin - 6*mm, header_y + 10*mm,
                      "PalmGIS Smart Farm")
    c.setFont("Helvetica", 7.5)
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    c.drawRightString(page_w - margin - 6*mm, header_y + 4*mm,
                      f"Zagora, Maroc — {date_str}")

    # ════════════════════════════════════════
    # 3. BANDE STATS EN BAS (sous la carte)
    # ════════════════════════════════════════
    stats_w = carte_w  # largeur = largeur de la carte uniquement

    c.setFillColor(HexColor("#F8FAF9"))
    c.roundRect(carte_x, stats_y, stats_w, stats_h, 3, fill=1, stroke=0)
    c.setStrokeColor(GRIS_MOYEN)
    c.setLineWidth(0.5)
    c.roundRect(carte_x, stats_y, stats_w, stats_h, 3, fill=0, stroke=1)

    col_w = stats_w / 4
    items_stats = [
        ("BON ETAT",  stats["bon"],     stats["pct_bon"],     VERT_CLAIR),
        ("MOYEN",     stats["moyen"],   stats["pct_moyen"],   ORANGE),
        ("MAUVAIS",   stats["mauvais"], stats["pct_mauvais"], ROUGE),
        ("MORT",      stats["mort"],    stats["pct_mort"],    NOIR_PALM),
    ]

    for i, (label, nb, pct, couleur) in enumerate(items_stats):
        col_x    = carte_x + i * col_w
        centre_x = col_x + col_w / 2

        if i > 0:
            c.setStrokeColor(GRIS_MOYEN)
            c.setLineWidth(0.5)
            c.line(col_x, stats_y + 2*mm, col_x, stats_y + stats_h - 2*mm)

        # Point coloré
        c.setFillColor(couleur)
        c.circle(centre_x - 8*mm, stats_y + stats_h - 5*mm,
                 2*mm, fill=1, stroke=0)

        # Label
        c.setFillColor(GRIS)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawString(centre_x - 5*mm, stats_y + stats_h - 5.8*mm, label)

        # Nombre
        c.setFillColor(HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(centre_x, stats_y + 8*mm, str(nb))

        # Pourcentage
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 7)
        c.drawCentredString(centre_x, stats_y + 3*mm, f"{pct}%")

    # ════════════════════════════════════════
    # 4. CARTE
    # ════════════════════════════════════════
    c.setFillColor(SABLE)
    c.roundRect(carte_x, carte_y, carte_w, content_h, 3, fill=1, stroke=0)

    if wms_img:
        try:
            wms_img.seek(0)
            c.drawImage(
                ImageReader(wms_img),
                carte_x, carte_y,
                width=carte_w, height=content_h,
                preserveAspectRatio=False,
                mask="auto",
            )
        except Exception as e:
            print(f"Erreur dessin WMS: {e}")

    # Bordure carte
    c.setStrokeColor(VERT)
    c.setLineWidth(1.5)
    c.roundRect(carte_x, carte_y, carte_w, content_h, 3, fill=0, stroke=1)

    # Badge type
    badge_w = 32*mm
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
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(nord_x, nord_y + 5.5*mm, "N")
    c.setLineWidth(1.5)
    c.setStrokeColor(VERT)
    c.line(nord_x, nord_y + 2*mm, nord_x, nord_y + 7.5*mm)
    c.line(nord_x - 1.5*mm, nord_y + 5.5*mm, nord_x, nord_y + 7.5*mm)
    c.line(nord_x + 1.5*mm, nord_y + 5.5*mm, nord_x, nord_y + 7.5*mm)

    # ════════════════════════════════════════
    # 5. SIDEBAR DROITE
    # ════════════════════════════════════════
    sb_y = content_y_top

    def bloc(titre_sec, hauteur):
        nonlocal sb_y
        sb_y -= hauteur
        c.setFillColor(white)
        c.roundRect(sb_x, sb_y, sidebar_w, hauteur - 2*mm,
                    3, fill=1, stroke=0)
        c.setStrokeColor(GRIS_MOYEN)
        c.setLineWidth(0.5)
        c.roundRect(sb_x, sb_y, sidebar_w, hauteur - 2*mm,
                    3, fill=0, stroke=1)
        c.setFillColor(GRIS)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(sb_x + 3*mm, sb_y + hauteur - 6*mm, titre_sec)
        c.setStrokeColor(GRIS_MOYEN)
        c.setLineWidth(0.3)
        c.line(sb_x + 3*mm, sb_y + hauteur - 8*mm,
               sb_x + sidebar_w - 3*mm, sb_y + hauteur - 8*mm)
        return sb_y + hauteur - 12*mm

    def ligne(label, valeur, y_pos, couleur_val=None):
        c.setFont("Helvetica", 7.5)
        c.setFillColor(GRIS)
        c.drawString(sb_x + 3*mm, y_pos, label)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(couleur_val or NOIR_PALM)
        c.drawRightString(sb_x + sidebar_w - 3*mm, y_pos, str(valeur))
        c.setStrokeColor(HexColor("#F1F5F9"))
        c.setLineWidth(0.3)
        c.line(sb_x + 3*mm, y_pos - 1.5*mm,
               sb_x + sidebar_w - 3*mm, y_pos - 1.5*mm)
        return y_pos - 5.5*mm

    def barre(label, pct, couleur, y_pos):
        c.setFont("Helvetica", 7)
        c.setFillColor(GRIS)
        c.drawString(sb_x + 3*mm, y_pos, label)
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(NOIR_PALM)
        c.drawRightString(sb_x + sidebar_w - 3*mm, y_pos, f"{pct}%")
        by = y_pos - 3.5*mm
        bw = sidebar_w - 6*mm
        bh = 3*mm
        c.setFillColor(GRIS_CLAIR)
        c.roundRect(sb_x + 3*mm, by, bw, bh, 1.5, fill=1, stroke=0)
        if pct > 0:
            c.setFillColor(couleur)
            c.roundRect(sb_x + 3*mm, by,
                        max(bw * pct / 100, 2*mm), bh,
                        1.5, fill=1, stroke=0)
        return y_pos - 8*mm

    def legende(label, couleur, nb, y_pos):
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
        return y_pos - 5.5*mm

    y = bloc("PARCELLE", 38*mm)
    y = ligne("Nom",             parcelle.nom,                    y)
    y = ligne("Superficie",      f"{superficie_ha} ha",           y)
    y = ligne("Perimetre",       f"{parcelle.perimetre_m:.0f} m", y)
    y = ligne("Total palmiers",  stats["total"],                   y)
    y = ligne("Males / Femelles",
              f"{stats['males']} / {stats['femelles']}",          y)

    sb_y -= 3*mm

    y = bloc("LEGENDE - ETAT SANITAIRE", 34*mm)
    y = legende("Bon etat",  VERT_CLAIR, stats["bon"],     y)
    y = legende("Moyen",     ORANGE,     stats["moyen"],   y)
    y = legende("Mauvais",   ROUGE,      stats["mauvais"], y)
    y = legende("Mort",      NOIR_PALM,  stats["mort"],    y)

    sb_y -= 3*mm

    y = bloc("REPARTITION (%)", 44*mm)
    y = barre("Bon",     stats["pct_bon"],     VERT_CLAIR, y)
    y = barre("Moyen",   stats["pct_moyen"],   ORANGE,     y)
    y = barre("Mauvais", stats["pct_mauvais"], ROUGE,      y)
    y = barre("Mort",    stats["pct_mort"],    NOIR_PALM,  y)

    sb_y -= 3*mm

    y = bloc("AGE DES PALMIERS", 28*mm)
    y = ligne("Jeunes",  stats["jeunes"],  y, VERT_CLAIR)
    y = ligne("Adultes", stats["adultes"], y, VERT)
    y = ligne("Vieux",   stats["vieux"],   y, HexColor("#92400e"))

    # ════════════════════════════════════════
    # 6. FOOTER
    # ════════════════════════════════════════
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 6)
    c.drawString(
        margin, margin - 1*mm,
        f"Projection : WGS84 (EPSG:4326)   |   "
        f"Type : {type_carte.replace('_', ' ').upper()}   |   "
        f"PalmGIS Smart Farm — Zagora, Maroc"
    )

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

        if orientation == "landscape":
            img_w, img_h = 1400, 900
        else:
            img_w, img_h = 900, 1200

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
            cql_filter=None,
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
                orientation=orientation,
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