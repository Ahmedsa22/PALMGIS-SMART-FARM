import os
import threading

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse

from core.permissions import IsManagerOrReadOnly


class ImageSentinelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsManagerOrReadOnly]

    def get_queryset(self):
        from .models import ImageSentinel
        return ImageSentinel.objects.all().select_related(
            "parcelle", "indices"
        )

    def get_serializer_class(self):
        from .serializers import ImageSentinelSerializer
        return ImageSentinelSerializer


class RechercherImagesView(APIView):
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        from parcels.models import Parcelle
        from .services import rechercher_images

        parcelle_id = request.data.get("parcelle_id")
        date_debut  = request.data.get("date_debut")
        date_fin    = request.data.get("date_fin")
        nuage_max   = float(request.data.get("nuage_max", 30))

        if not all([parcelle_id, date_debut, date_fin]):
            return Response(
                {"error": "parcelle_id, date_debut et date_fin sont requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            parcelle = Parcelle.objects.get(id=parcelle_id)
            bbox     = parcelle.geom.extent
            images   = rechercher_images(bbox, date_debut, date_fin, nuage_max)
            return Response({
                "parcelle": parcelle.nom,
                "images":   images,
                "count":    len(images),
            })
        except Parcelle.DoesNotExist:
            return Response(
                {"error": "Parcelle introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TelechargerEtCalculerView(APIView):
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        from parcels.models import Parcelle
        from .services import telecharger_bandes_api, calculer_indices
        from .models import ImageSentinel

        parcelle_id      = request.data.get("parcelle_id")
        produit_id       = request.data.get("produit_id")
        date_acquisition = request.data.get("date_acquisition")
        nuage_pct        = float(request.data.get("nuage_pct", 0))

        if not all([parcelle_id, produit_id, date_acquisition]):
            return Response(
                {"error": "parcelle_id, produit_id et date_acquisition sont requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            parcelle = Parcelle.objects.get(id=parcelle_id)
        except Parcelle.DoesNotExist:
            return Response(
                {"error": "Parcelle introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        image = ImageSentinel.objects.create(
            parcelle=parcelle,
            produit_id=produit_id,
            date_acquisition=date_acquisition,
            nuage_pct=nuage_pct,
            statut=ImageSentinel.Statut.TELECHARGEMENT,
            created_by=request.user,
        )

        def traiter():
            try:
                image.statut = ImageSentinel.Statut.TELECHARGEMENT
                image.save()
                telecharger_bandes_api(parcelle, date_acquisition, image)

                image.statut = ImageSentinel.Statut.TRAITEMENT
                image.save()
                calculer_indices(image)

                image.statut = ImageSentinel.Statut.TERMINE
                image.save()
                print(f"✅ Traitement terminé pour {parcelle.nom}")

            except Exception as e:
                import traceback
                print(traceback.format_exc())
                image.statut = ImageSentinel.Statut.ERREUR
                image.message_erreur = str(e)
                image.save()

        thread = threading.Thread(target=traiter, daemon=True)
        thread.start()

        return Response({
            "message":  "Téléchargement lancé en arrière-plan",
            "image_id": image.id,
            "statut":   image.statut,
        }, status=status.HTTP_202_ACCEPTED)


class StatutImageView(APIView):
    permission_classes = [IsManagerOrReadOnly]

    def get(self, request, image_id):
        from .models import ImageSentinel
        try:
            image = ImageSentinel.objects.get(id=image_id)
            data = {
                "id":      image.id,
                "statut":  image.statut,
                "message": image.message_erreur,
            }
            if image.statut == "termine" and hasattr(image, "indices"):
                data["indices"] = {
                    "ndvi_mean":      image.indices.ndvi_mean,
                    "ndvi_min":       image.indices.ndvi_min,
                    "ndvi_max":       image.indices.ndvi_max,
                    "ndwi_mean":      image.indices.ndwi_mean,
                    "ndwi_min":       image.indices.ndwi_min,
                    "ndwi_max":       image.indices.ndwi_max,
                    "savi_mean":      image.indices.savi_mean,
                    "savi_min":       image.indices.savi_min,
                    "savi_max":       image.indices.savi_max,
                    "interpretation": image.indices.interpretation,
                }
            return Response(data)
        except ImageSentinel.DoesNotExist:
            return Response(
                {"error": "Image introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )


class ImagePNGView(APIView):

    def get(self, request, image_id, indice):
        from .models import ImageSentinel
        try:
            image   = ImageSentinel.objects.get(id=image_id)
            indices = image.indices
            chemins = {
                "ndvi": indices.chemin_ndvi_png,
                "ndwi": indices.chemin_ndwi_png,
                "savi": indices.chemin_savi_png,
            }
            chemin = chemins.get(indice)
            if not chemin or not os.path.exists(chemin):
                return Response(
                    {"error": "Image non disponible"},
                    status=status.HTTP_404_NOT_FOUND
                )
            return FileResponse(open(chemin, "rb"), content_type="image/png")
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )


class ComparerIndicesView(APIView):
    """
    POST /api/remote-sensing/comparer/
    {
        "parcelle_id": 2,
        "image_id_1": 3,
        "image_id_2": 5,
        "indice": "ndvi"
    }
    """
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        from .models import ImageSentinel

        parcelle_id = request.data.get("parcelle_id")
        image_id_1  = request.data.get("image_id_1")
        image_id_2  = request.data.get("image_id_2")
        indice      = request.data.get("indice", "ndvi")

        if not all([image_id_1, image_id_2]):
            return Response(
                {"error": "image_id_1 et image_id_2 sont requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            img1 = ImageSentinel.objects.get(id=image_id_1)
            img2 = ImageSentinel.objects.get(id=image_id_2)
        except ImageSentinel.DoesNotExist:
            return Response(
                {"error": "Image introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Vérifie que les indices sont calculés
        if not hasattr(img1, "indices") or not hasattr(img2, "indices"):
            return Response(
                {"error": "Les indices ne sont pas encore calculés pour une des images"},
                status=status.HTTP_400_BAD_REQUEST
            )

        ind1 = img1.indices
        ind2 = img2.indices

        # ── Récupère les valeurs selon l'indice choisi ──
        def get_vals(ind, prefix):
            return {
                "mean": getattr(ind, f"{prefix}_mean"),
                "min":  getattr(ind, f"{prefix}_min"),
                "max":  getattr(ind, f"{prefix}_max"),
            }

        vals1 = get_vals(ind1, indice)
        vals2 = get_vals(ind2, indice)

        # ── Calcule les évolutions ──
        def evolution(v1, v2):
            if v1 and v1 != 0:
                return round(((v2 - v1) / abs(v1)) * 100, 1)
            return None

        evol_mean = evolution(vals1["mean"], vals2["mean"])
        evol_min  = evolution(vals1["min"],  vals2["min"])
        evol_max  = evolution(vals1["max"],  vals2["max"])

        # ── Interprétation de la tendance ──
        interpretation = ""
        if evol_mean is not None:
            if indice == "ndvi":
                if evol_mean > 10:
                    interpretation = f"✅ Amélioration significative de la végétation (+{evol_mean}%) — conditions favorables"
                elif evol_mean > 0:
                    interpretation = f"📈 Légère amélioration de la végétation (+{evol_mean}%)"
                elif evol_mean > -10:
                    interpretation = f"📉 Légère dégradation de la végétation ({evol_mean}%) — surveiller"
                else:
                    interpretation = f"⚠️ Dégradation importante de la végétation ({evol_mean}%) — intervention recommandée"
            elif indice == "ndwi":
                if evol_mean > 10:
                    interpretation = f"✅ Amélioration du contenu en eau (+{evol_mean}%)"
                elif evol_mean < -10:
                    interpretation = f"⚠️ Stress hydrique accru ({evol_mean}%) — vérifier l'irrigation"
                else:
                    interpretation = f"➡️ Contenu en eau stable ({evol_mean}%)"
            elif indice == "savi":
                if evol_mean > 10:
                    interpretation = f"✅ Amélioration de la vigueur végétative (+{evol_mean}%)"
                elif evol_mean < -10:
                    interpretation = f"⚠️ Dégradation de la vigueur végétative ({evol_mean}%)"
                else:
                    interpretation = f"➡️ Vigueur végétative stable ({evol_mean}%)"

        return Response({
            "indice": indice.upper(),
            "image_1": {
                "id":              img1.id,
                "date":            str(img1.date_acquisition),
                "nuage_pct":       img1.nuage_pct,
                "mean":            vals1["mean"],
                "min":             vals1["min"],
                "max":             vals1["max"],
                "chemin_png":      f"/api/remote-sensing/image/{img1.id}/{indice}/",
            },
            "image_2": {
                "id":              img2.id,
                "date":            str(img2.date_acquisition),
                "nuage_pct":       img2.nuage_pct,
                "mean":            vals2["mean"],
                "min":             vals2["min"],
                "max":             vals2["max"],
                "chemin_png":      f"/api/remote-sensing/image/{img2.id}/{indice}/",
            },
            "evolution": {
                "mean": evol_mean,
                "min":  evol_min,
                "max":  evol_max,
            },
            "interpretation": interpretation,
        })

class HistoriqueParcelleView(APIView):
    """
    GET /api/remote-sensing/historique/{parcelle_id}/
    Retourne toutes les images calculées d'une parcelle.
    """
    def get(self, request, parcelle_id):
        from .models import ImageSentinel
        images = ImageSentinel.objects.filter(
            parcelle_id=parcelle_id,
            statut="termine"
        ).select_related("indices").order_by("-date_acquisition")

        data = []
        for img in images:
            item = {
                "id":              img.id,
                "date":            str(img.date_acquisition),
                "nuage_pct":       img.nuage_pct,
                "statut":          img.statut,
            }
            if hasattr(img, "indices"):
                item["ndvi_mean"] = img.indices.ndvi_mean
                item["ndwi_mean"] = img.indices.ndwi_mean
                item["savi_mean"] = img.indices.savi_mean
            data.append(item)

        return Response({"images": data, "count": len(data)})