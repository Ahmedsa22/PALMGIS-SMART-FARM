import os
import io
import math
import numpy as np
import requests
from datetime import datetime, timedelta
from django.conf import settings


def get_copernicus_token():
    """Obtient un token OAuth2 depuis Copernicus Data Space."""
    url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    data = {
        "client_id":  "cdse-public",
        "username":   settings.COPERNICUS_USER,
        "password":   settings.COPERNICUS_PASSWORD,
        "grant_type": "password",
    }
    response = requests.post(url, data=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    raise Exception(f"Erreur token Copernicus: {response.text}")


def rechercher_images(bbox, date_debut, date_fin, nuage_max=30):
    """
    Recherche les images Sentinel-2 disponibles sur une zone et période.

    bbox        : (xmin, ymin, xmax, ymax) en WGS84
    date_debut  : "2024-01-01"
    date_fin    : "2024-12-31"
    nuage_max   : % de couverture nuageuse maximale
    """
    token = get_copernicus_token()

    # Construit le filtre OData
    xmin, ymin, xmax, ymax = bbox
    footprint = f"POLYGON(({xmin} {ymin},{xmax} {ymin},{xmax} {ymax},{xmin} {ymax},{xmin} {ymin}))"

    url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    params = {
        "$filter": (
            f"Collection/Name eq 'SENTINEL-2' and "
            f"contains(Name, 'MSIL2A') and "                    # ← ajoute cette ligne
            f"Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' "
            f"and att/OData.CSC.DoubleAttribute/Value le {nuage_max}) and "
            f"ContentDate/Start gt {date_debut}T00:00:00.000Z and "
            f"ContentDate/Start lt {date_fin}T23:59:59.000Z and "
            f"OData.CSC.Intersects(area=geography'SRID=4326;{footprint}')"
        ),
        "$orderby": "ContentDate/Start desc",
        "$top":     10,
        "$expand":  "Attributes",
    }

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, params=params, headers=headers)

    if response.status_code == 200:
        results = response.json().get("value", [])
        return [
            {
                "id":      r["Id"],
                "nom":     r["Name"],
                "date":    r["ContentDate"]["Start"][:10],
                "nuage":   next(
                    (a["Value"] for a in r.get("Attributes", [])
                     if a["Name"] == "cloudCover"), 0
                ),
                "taille":  r.get("ContentLength", 0),
            }
            for r in results
        ]
    raise Exception(f"Erreur recherche: {response.text}")


def telecharger_bandes_api(parcelle, date_acquisition, image_sentinel):
    """
    Utilise l'API Sentinel Hub Process pour télécharger
    directement les bandes en GeoTIFF découpées sur la parcelle.
    Plus fiable que l'API Nodes (pas de problème JP2).
    """
    token = get_copernicus_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    bbox = parcelle.geom.extent  # (xmin, ymin, xmax, ymax)
    date_str = date_acquisition  # "2024-06-15"

    dossier = os.path.join(
        settings.SENTINEL_DATA_DIR,
        f"parcelle_{parcelle.id}",
        date_str,
    )
    os.makedirs(dossier, exist_ok=True)

    chemins = {}

    for bande in ["B04", "B08", "B11"]:
        print(f"📥 Téléchargement {bande} via Process API...")

        # Requête Process API — retourne directement un GeoTIFF
        body = {
            "input": {
                "bounds": {
                    "bbox": list(bbox),
                    "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"},
                },
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{date_str}T00:00:00Z",
                            "to":   f"{date_str}T23:59:59Z",
                        },
                        "maxCloudCoverage": 50,
                    },
                }],
            },
            "output": {
                "width":  512,
                "height": 512,
                "responses": [{
                    "identifier": "default",
                    "format": {"type": "image/tiff"},
                }],
            },
            "evalscript": f"""
                //VERSION=3
                function setup() {{
                    return {{
                        input: ["{bande}"],
                        output: {{ bands: 1, sampleType: "FLOAT32" }}
                    }};
                }}
                function evaluatePixel(sample) {{
                    return [sample.{bande}];
                }}
            """,
        }

        response = requests.post(
            "https://sh.dataspace.copernicus.eu/api/v1/process",
            json=body,
            headers=headers,
            timeout=60,
        )

        if response.status_code == 200:
            chemin = os.path.join(dossier, f"{bande}.tif")
            with open(chemin, "wb") as f:
                f.write(response.content)
            chemins[bande] = chemin
            print(f"✅ {bande} téléchargé en GeoTIFF ({len(response.content)//1024} Ko)")
        else:
            print(f"❌ Erreur {bande}: {response.status_code} — {response.text[:200]}")

    image_sentinel.chemin_b04 = chemins.get("B04", "")
    image_sentinel.chemin_b08 = chemins.get("B08", "")
    image_sentinel.chemin_b11 = chemins.get("B11", "")
    image_sentinel.save()

    return chemins



def calculer_indices(image_sentinel):
    """
    Calcule NDVI, NDWI et SAVI depuis les bandes téléchargées.
    Génère des images colorées PNG pour chaque indice.
    """
    import rasterio
    import numpy as np
    from matplotlib import cm
    from matplotlib.colors import Normalize
    import matplotlib.pyplot as plt
    from PIL import Image as PILImage

    chemins = {
        "B04": image_sentinel.chemin_b04,
        "B08": image_sentinel.chemin_b08,
        "B11": image_sentinel.chemin_b11,
    }

    # Lit les bandes
    def lire_bande(chemin):
        with rasterio.open(chemin) as src:
            data = src.read(1).astype(float)
            data[data == src.nodata] = np.nan
            return data, src.profile

    b04, profile = lire_bande(chemins["B04"])  # Rouge
    b08, _       = lire_bande(chemins["B08"])  # PIR
    b11, _       = lire_bande(chemins["B11"])  # SWIR

    # Normalise les valeurs Sentinel-2 (0-10000 → 0-1)
    b04 = b04 / 10000.0
    b08 = b08 / 10000.0
    b11 = b11 / 10000.0

    # ── NDVI = (PIR - Rouge) / (PIR + Rouge) ──
    with np.errstate(divide="ignore", invalid="ignore"):
        ndvi = np.where(
            (b08 + b04) > 0,
            (b08 - b04) / (b08 + b04),
            np.nan
        )

    # ── NDWI = (PIR - SWIR) / (PIR + SWIR) ──
    with np.errstate(divide="ignore", invalid="ignore"):
        ndwi = np.where(
            (b08 + b11) > 0,
            (b08 - b11) / (b08 + b11),
            np.nan
        )

    # ── SAVI = ((PIR - Rouge) / (PIR + Rouge + L)) * (1 + L) ──
    # L = 0.5 pour les zones semi-arides (Zagora)
    L = 0.5
    with np.errstate(divide="ignore", invalid="ignore"):
        savi = np.where(
            (b08 + b04 + L) > 0,
            ((b08 - b04) / (b08 + b04 + L)) * (1 + L),
            np.nan
        )

    # ── Statistiques ──
    def stats(arr):
        valides = arr[~np.isnan(arr)]
        if len(valides) == 0:
            return 0, 0, 0, 0
        return (
            float(np.min(valides)),
            float(np.max(valides)),
            float(np.mean(valides)),
            float(np.std(valides)),
        )

    ndvi_min, ndvi_max, ndvi_mean, ndvi_std = stats(ndvi)
    ndwi_min, ndwi_max, ndwi_mean, _       = stats(ndwi)
    savi_min, savi_max, savi_mean, _       = stats(savi)

    # ── Génère les images colorées ──
    dossier = os.path.dirname(image_sentinel.chemin_b04)

    def sauvegarder_image_coloree(arr, chemin, colormap, vmin, vmax):
        """Génère une image PNG colorée depuis un array numpy."""
        import matplotlib
        from matplotlib.colors import Normalize
        from PIL import Image as PILImage


        norm = Normalize(vmin=vmin, vmax=vmax)
        cmap  = matplotlib.colormaps[colormap] 
        colored = cmap(norm(arr))
        # Gère les NaN (transparent)
        colored[np.isnan(arr)] = [0, 0, 0, 0]
        img = PILImage.fromarray((colored * 255).astype(np.uint8))
        img.save(chemin)
        return chemin

    chemin_ndvi = sauvegarder_image_coloree(
        ndvi,
        os.path.join(dossier, "ndvi.png"),
        "RdYlGn",    # Rouge → Jaune → Vert
        -0.2, 0.8
    )

    chemin_ndwi = sauvegarder_image_coloree(
        ndwi,
        os.path.join(dossier, "ndwi.png"),
        "Blues",     # Blanc → Bleu
        -0.5, 0.5
    )

    chemin_savi = sauvegarder_image_coloree(
        savi,
        os.path.join(dossier, "savi.png"),
        "YlGn",      # Jaune → Vert
        -0.2, 0.8
    )

    # ── Interprétation automatique ──
    interpretation = []

    if ndvi_mean > 0.5:
        interpretation.append("Végétation dense et saine (NDVI > 0.5)")
    elif ndvi_mean > 0.3:
        interpretation.append("Végétation modérée (NDVI 0.3-0.5)")
    elif ndvi_mean > 0.1:
        interpretation.append("Végétation faible ou stressée (NDVI 0.1-0.3)")
    else:
        interpretation.append("Sol nu ou végétation très faible (NDVI < 0.1)")

    if ndwi_mean > 0.2:
        interpretation.append("Bonne disponibilité en eau")
    elif ndwi_mean > 0:
        interpretation.append("Disponibilité en eau modérée")
    else:
        interpretation.append("Stress hydrique possible")

    if savi_mean > 0.4:
        interpretation.append("SAVI élevé — végétation bien développée malgré le sol aride")
    else:
        interpretation.append("SAVI faible — impact du sol nu important")

    # ── Sauvegarde les résultats ──
    from .models import IndiceSpectral
    indice, _ = IndiceSpectral.objects.get_or_create(image=image_sentinel)
    indice.ndvi_min  = ndvi_min
    indice.ndvi_max  = ndvi_max
    indice.ndvi_mean = ndvi_mean
    indice.ndvi_std  = ndvi_std
    indice.ndwi_min  = ndwi_min
    indice.ndwi_max  = ndwi_max
    indice.ndwi_mean = ndwi_mean
    indice.savi_min  = savi_min
    indice.savi_max  = savi_max
    indice.savi_mean = savi_mean
    indice.chemin_ndvi_png = chemin_ndvi
    indice.chemin_ndwi_png = chemin_ndwi
    indice.chemin_savi_png = chemin_savi
    indice.interpretation  = "\n".join(interpretation)
    indice.save()

    print(f"✅ Indices calculés — NDVI: {ndvi_mean:.3f}, NDWI: {ndwi_mean:.3f}, SAVI: {savi_mean:.3f}")
    return indice