from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Palm


class PalmSerializer(GeoFeatureModelSerializer):

    # ← Champs explicitement déclarés pour accepter null
    age  = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    sexe = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )

    class Meta:
        model  = Palm
        geo_field = "geom"
        fields = [
            "id",
            "code_uni",
            "code_local",
            "ligne",
            "numero",
            "age",
            "sexe",
            "etat_sante",
            "etat_site",
            "variete",
            "description",
            "nombre_rejets",
            "parcelle",
            "geom",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "age":  {"allow_null": True, "required": False},
            "sexe": {"allow_null": True, "required": False},
        }