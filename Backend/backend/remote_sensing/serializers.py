from rest_framework import serializers
from .models import ImageSentinel, IndiceSpectral


class IndiceSpectralSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndiceSpectral
        fields = [
            "id",
            "ndvi_min", "ndvi_max", "ndvi_mean", "ndvi_std",
            "ndwi_min", "ndwi_max", "ndwi_mean",
            "savi_min", "savi_max", "savi_mean",
            "interpretation",
            "chemin_ndvi_png", "chemin_ndwi_png", "chemin_savi_png",
        ]


class ImageSentinelSerializer(serializers.ModelSerializer):
    indices      = IndiceSpectralSerializer(read_only=True)
    parcelle_nom = serializers.CharField(
        source="parcelle.nom", read_only=True
    )

    class Meta:
        model = ImageSentinel
        fields = [
            "id", "parcelle", "parcelle_nom",
            "date_acquisition", "produit_id",
            "nuage_pct", "statut", "message_erreur",
            "indices", "created_at",
        ]