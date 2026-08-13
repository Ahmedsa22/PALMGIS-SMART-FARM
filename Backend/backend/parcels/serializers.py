from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from .models import Parcelle


class ParcelleSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Parcelle
        geo_field = "geom"
        fields = [
            "id", "nom", "statut", "proprietaire", "description", "type_parcelle",
            "superficie_m2", "superficie_ha", "perimetre_m",
            "created_at", "updated_at",
        ]
        read_only_fields = ["superficie_m2", "perimetre_m", "created_at", "updated_at"]