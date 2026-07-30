from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import Palm


class PalmSerializer(GeoFeatureModelSerializer):

    class Meta:
        model = Palm
        geo_field = "geom"
        fields = [
            "id", "parcelle", "age", "etat_site", "etat_sante", "sexe",
            "variete", "ligne", "numero", "code_uni", "code_local",
            "description", "created_at", "updated_at","nombre_rejets",
        ]
        # parcelle est rattachée automatiquement dans Palm.save() via
        # geom__contains (la parcelle qui contient le point) : jamais saisie
        # par l'utilisateur, donc en lecture seule.
        read_only_fields = ["parcelle", "created_at", "updated_at"]
