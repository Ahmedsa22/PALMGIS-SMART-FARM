import io
import base64
import requests
from datetime import datetime

from django.conf import settings
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from reportlab.lib.pagesizes import A4, A3, landscape, portrait
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

from parcels.models import Parcelle
from palms.models import Palm
from core.permissions import IsManagerOrReadOnly


# ── Couleurs PalmGIS ──
VERT       = HexColor("#2E5E3E")
VERT_CLAIR = HexColor("#22c55e")
ORANGE     = HexColor("#f97316")
ROUGE      = HexColor("#ef4444")
NOIR_PALM  = HexColor("#1f2937")
GRIS       = HexColor("#6b7280")
GRIS_CLAIR = HexColor("#f3f4f6")
DORE       = HexColor("#B08D57")


def get_wms_image(layers, bbox, width=800, height=600):
    """Récupère une image PNG depuis GeoServer WMS."""
    params = {
        "SERVICE":     "WMS",
        "VERSION":     "1.1.1",
        "REQUEST":     "GetMap",
        "LAYERS":      layers,
        "BBOX":        f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",  # ← bbox pas bbox_buffered
        "WIDTH":       width,
        "HEIGHT":      height,
        "SRS":         "EPSG:4326",
        "FORMAT":      "image/png",
        "TRANSPARENT": "true",
    }
    url = f"{settings.GEOSERVER_URL}/{settings.GEOSERVER_WORKSPACE}/wms"
    try:
        response = requests.get(
            url, params=params,
            auth=(settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD),
            timeout=30,
        )
        if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
            return io.BytesIO(response.content)
    except Exception as e:
        print(f"Erreur WMS: {e}")
    return None


def calculer_stats(parcelle):
    """Calcule les statistiques d'une parcelle."""
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


def dessiner_barre(c, x, y, largeur, hauteur, pct, couleur):
    """Dessine une barre de progression."""
    # Fond gris
    c.setFillColor(GRIS_CLAIR)
    c.rect(x, y, largeur, hauteur, fill=1, stroke=0)
    # Barre colorée
    if pct > 0:
        c.setFillColor(couleur)
        c.rect(x, y, largeur * pct / 100, hauteur, fill=1, stroke=0)


def generer_pdf(parcelle, stats, carte_img, type_carte,
                titre, orientation):
    """Génère le PDF avec ReportLab."""

    buffer = io.BytesIO()

    # ── Format de page ──
    if orientation == "landscape":
        pagesize = landscape(A4)
    else:
        pagesize = portrait(A4)

    page_w, page_h = pagesize
    margin = 15 * mm

    c = canvas.Canvas(buffer, pagesize=pagesize)
    c.setTitle(titre)

    # ────────────────────────────────
    # EN-TÊTE
    # ────────────────────────────────
    header_h = 22 * mm
    header_y = page_h - margin - header_h

    # Bande verte
    c.setFillColor(VERT)
    c.rect(margin, header_y, page_w - 2*margin, header_h, fill=1, stroke=0)

    # Titre
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin + 5*mm, header_y + 13*mm, titre)

    # Sous-titre
    c.setFont("Helvetica", 9)
    superficie_ha = round((parcelle.superficie_m2 or 0) / 10000, 2)
    c.drawString(
        margin + 5*mm, header_y + 6*mm,
        f"Parcelle : {parcelle.nom}  |  "
        f"Superficie : {superficie_ha} ha  |  "
        f"Statut : {parcelle.statut}"
    )

    # Date à droite
    c.setFont("Helvetica", 8)
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    c.drawRightString(page_w - margin - 5*mm, header_y + 13*mm, "PalmGIS Smart Farm")
    c.drawRightString(page_w - margin - 5*mm, header_y + 7*mm, f"Zagora, Maroc")
    c.drawRightString(page_w - margin - 5*mm, header_y + 1*mm, date_str)

    # ────────────────────────────────
    # ZONE PRINCIPALE
    # ────────────────────────────────
    content_y_top = header_y - 5*mm
    content_h     = content_y_top - margin - 15*mm  # espace pour le footer

    # Largeur sidebar
    sidebar_w = 65*mm if orientation == "landscape" else 60*mm
    carte_w   = page_w - 2*margin - sidebar_w - 5*mm

    # ────────────────────────────────
    # IMAGE CARTE (GeoServer WMS)
    # ────────────────────────────────
    carte_x = margin
    carte_y = margin + 15*mm  # au-dessus du footer
    carte_h = content_h

    if carte_img:
        try:
            img_reader = ImageReader(carte_img)
            c.drawImage(
                img_reader,
                carte_x, carte_y,
                width=carte_w, height=carte_h,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception as e:
            print(f"Erreur image: {e}")
            c.setFillColor(GRIS_CLAIR)
            c.rect(carte_x, carte_y, carte_w, carte_h, fill=1, stroke=1)
            c.setFillColor(GRIS)
            c.setFont("Helvetica", 9)
            c.drawCentredString(
                carte_x + carte_w/2,
                carte_y + carte_h/2,
                "Carte non disponible"
            )
    else:
        c.setFillColor(GRIS_CLAIR)
        c.rect(carte_x, carte_y, carte_w, carte_h, fill=1, stroke=1)
        c.setFillColor(GRIS)
        c.setFont("Helvetica", 9)
        c.drawCentredString(
            carte_x + carte_w/2,
            carte_y + carte_h/2,
            "GeoServer non disponible"
        )

    # Bordure carte
    c.setStrokeColor(GRIS)
    c.setLineWidth(0.5)
    c.rect(carte_x, carte_y, carte_w, carte_h, fill=0, stroke=1)

    # Flèche Nord
    c.setFillColor(VERT)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(carte_x + carte_w - 12*mm, carte_y + 4*mm, "N")
    c.setLineWidth(1.5)
    c.setStrokeColor(VERT)
    nord_x = carte_x + carte_w - 9*mm
    c.line(nord_x, carte_y + 3*mm, nord_x, carte_y + 9*mm)
    c.line(nord_x - 2*mm, carte_y + 6*mm, nord_x, carte_y + 9*mm)
    c.line(nord_x + 2*mm, carte_y + 6*mm, nord_x, carte_y + 9*mm)

    # ────────────────────────────────
    # SIDEBAR DROITE
    # ────────────────────────────────
    sb_x = margin + carte_w + 5*mm
    sb_y = content_y_top  # commence en haut

    def section(titre_sec, hauteur):
        nonlocal sb_y
        sb_y -= hauteur
        # Fond section
        c.setFillColor(GRIS_CLAIR)
        c.rect(sb_x, sb_y, sidebar_w, hauteur - 1*mm, fill=1, stroke=0)
        # Barre titre
        c.setFillColor(VERT)
        c.rect(sb_x, sb_y + hauteur - 6*mm, sidebar_w, 5.5*mm, fill=1, stroke=0)
        # Titre section
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(sb_x + 2*mm, sb_y + hauteur - 4.5*mm, titre_sec)
        return sb_y + hauteur - 11*mm   # ← était -7*mm, maintenant -11*mm


    def ligne_info(label, valeur, y_pos):
        c.setFont("Helvetica", 7.5)
        c.setFillColor(GRIS)
        c.drawString(sb_x + 2*mm, y_pos, label)
        c.setFillColor(NOIR_PALM)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawRightString(sb_x + sidebar_w - 2*mm, y_pos, str(valeur))
        # Ligne séparatrice
        c.setStrokeColor(HexColor("#e5e7eb"))
        c.setLineWidth(0.3)
        c.line(sb_x + 2*mm, y_pos - 1*mm, sb_x + sidebar_w - 2*mm, y_pos - 1*mm)
        return y_pos - 4.5*mm

    # ── Section Parcelle ──
    y = section("PARCELLE", 40*mm)
    y = ligne_info("Nom", parcelle.nom, y)
    y = ligne_info("Superficie", f"{superficie_ha} ha", y)
    y = ligne_info("Perimetre", f"{parcelle.perimetre_m:.0f} m", y)
    y = ligne_info("Total palmiers", stats["total"], y)
    y = ligne_info("Males / Femelles", f"{stats['males']} / {stats['femelles']}", y)

    sb_y -= 3*mm

    # ── Section Légende ──
    y = section("LEGENDE - ETAT SANITAIRE", 32*mm)
    legende_items = [
        ("Bon etat",  VERT_CLAIR, stats["bon"]),
        ("Moyen",     ORANGE,     stats["moyen"]),
        ("Mauvais",   ROUGE,      stats["mauvais"]),
        ("Mort",      NOIR_PALM,  stats["mort"]),
    ]
    for label, couleur, nb in legende_items:
        # Point coloré
        c.setFillColor(couleur)
        c.circle(sb_x + 4*mm, y + 1*mm, 2*mm, fill=1, stroke=0)
        # Label
        c.setFillColor(NOIR_PALM)
        c.setFont("Helvetica", 7.5)
        c.drawString(sb_x + 8*mm, y, f"{label} ({nb})")
        y -= 5*mm

    sb_y -= 3*mm

    # ── Section Stats ──
    y = section("ETAT SANITAIRE (%)", 40*mm)
    barre_items = [
        ("Bon",     stats["pct_bon"],     VERT_CLAIR),
        ("Moyen",   stats["pct_moyen"],   ORANGE),
        ("Mauvais", stats["pct_mauvais"], ROUGE),
        ("Mort",    stats["pct_mort"],    NOIR_PALM),
    ]
    for label, pct, couleur in barre_items:
        c.setFont("Helvetica", 7)
        c.setFillColor(GRIS)
        c.drawString(sb_x + 2*mm, y, label)
        c.setFillColor(NOIR_PALM)
        c.drawRightString(sb_x + sidebar_w - 2*mm, y, f"{pct}%")
        dessiner_barre(c, sb_x + 2*mm, y - 3*mm, sidebar_w - 4*mm, 2.5*mm, pct, couleur)
        y -= 7.5*mm

    sb_y -= 3*mm

    # ── Section Age ──
    y = section("AGE DES PALMIERS", 26*mm)
    y = ligne_info("Jeunes", stats["jeunes"], y)
    y = ligne_info("Adultes", stats["adultes"], y)
    y = ligne_info("Vieux", stats["vieux"], y)

    # ────────────────────────────────
    # FOOTER
    # ────────────────────────────────
    footer_y = margin + 2*mm
    c.setStrokeColor(VERT)
    c.setLineWidth(1)
    c.line(margin, footer_y + 8*mm, page_w - margin, footer_y + 8*mm)

    c.setFont("Helvetica", 7)
    c.setFillColor(GRIS)
    c.drawString(margin, footer_y + 3*mm, "PalmGIS Smart Farm — Zagora, Maroc")
    c.drawCentredString(page_w/2, footer_y + 3*mm, f"Type : {type_carte.replace('_', ' ').upper()}")
    c.drawRightString(page_w - margin, footer_y + 3*mm, "Projection : WGS84 (EPSG:4326)")

    c.save()
    buffer.seek(0)
    return buffer


class CarteView(APIView):
    """
    POST /api/reports/carte/
    {
        "parcelle_id": 2,
        "type_carte": "etat_sanitaire",
        "orientation": "portrait",
        "titre": "Carte de la palmeraie 10C"
    }
    """
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        parcelle_id = request.data.get("parcelle_id")
        type_carte  = request.data.get("type_carte", "etat_sanitaire")
        orientation = request.data.get("orientation", "portrait")
        titre       = request.data.get("titre", "Carte de la palmeraie")

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

        # ── BBOX avec buffer ──
        geom = parcelle.geom
        bbox = geom.extent
        dx = (bbox[2] - bbox[0]) * 0.15
        dy = (bbox[3] - bbox[1]) * 0.15
        bbox_buffered = (
            bbox[0] - dx, bbox[1] - dy,
            bbox[2] + dx, bbox[3] + dy,
        )

        # ── Image WMS ──
        if orientation == "landscape":
            img_w, img_h = 1200, 600
        else:
            img_w, img_h = 800, 900

                # ── BBOX élargie à toutes les parcelles ──
        from django.contrib.gis.db.models import Extent
        toutes_bbox = Parcelle.objects.aggregate(bbox=Extent("geom"))["bbox"]

        if toutes_bbox:
            bbox_carte = (
                min(bbox[0], toutes_bbox[0]) - 0.002,
                min(bbox[1], toutes_bbox[1]) - 0.002,
                max(bbox[2], toutes_bbox[2]) + 0.002,
                max(bbox[3], toutes_bbox[3]) + 0.002,
            )
        else:
            dx = (bbox[2] - bbox[0]) * 0.3
            dy = (bbox[3] - bbox[1]) * 0.3
            bbox_carte = (
                bbox[0] - dx, bbox[1] - dy,
                bbox[2] + dx, bbox[3] + dy,
            )

        # ── Image WMS avec CQL_FILTER ──
        layers = (
            f"{settings.GEOSERVER_WORKSPACE}:parcelles,"
            f"{settings.GEOSERVER_WORKSPACE}:palmiers"
        )

        wms_params = {
            "SERVICE":     "WMS",
            "VERSION":     "1.1.1",
            "REQUEST":     "GetMap",
            "LAYERS":      layers,
            "BBOX":        f"{bbox_carte[0]},{bbox_carte[1]},{bbox_carte[2]},{bbox_carte[3]}",
            "WIDTH":       img_w,
            "HEIGHT":      img_h,
            "SRS":         "EPSG:4326",
            "FORMAT":      "image/png",
            "TRANSPARENT": "true",
            "CQL_FILTER":  f"INCLUDE;parcelle_id={parcelle.id}",
        }

        wms_url = f"{settings.GEOSERVER_URL}/{settings.GEOSERVER_WORKSPACE}/wms"
        try:
            wms_response = requests.get(
                wms_url, params=wms_params,
                auth=(settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD),
                timeout=30,
            )
            if wms_response.status_code == 200 and "image" in wms_response.headers.get("Content-Type", ""):
                carte_img = io.BytesIO(wms_response.content)
                print("✅ Image WMS reçue")
            else:
                carte_img = None
                print("❌ Erreur WMS:", wms_response.status_code, wms_response.text[:300])
        except Exception as e:
            carte_img = None
            print(f"❌ Erreur WMS: {e}")
        # ── Stats ──
        stats = calculer_stats(parcelle)

        # ── Génère le PDF ──
        try:
            pdf_buffer = generer_pdf(
                parcelle, stats, carte_img,
                type_carte, titre, orientation
            )
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": f"Erreur PDF: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ── Retourne le PDF ──
        nom = f"carte_{parcelle.nom}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response = HttpResponse(pdf_buffer.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{nom}"'
        return response