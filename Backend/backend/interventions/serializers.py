from rest_framework import serializers

from .models import Intervention, PieceJointe, TypeIntervention


class TypeInterventionSerializer(serializers.ModelSerializer):

    class Meta:
        model = TypeIntervention
        fields = [
            "id", "nom", "code", "description", "mois_debut", "mois_fin",
            "cible_defaut", "unite_mesure", "actif",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class PieceJointeSerializer(serializers.ModelSerializer):

    class Meta:
        model = PieceJointe
        fields = ["id", "intervention", "fichier", "created_at"]
        read_only_fields = ["created_at"]


class InterventionSerializer(serializers.ModelSerializer):
    type_intervention_nom = serializers.CharField(
        source="type_intervention.nom", read_only=True
    )
    parcelle_nom = serializers.CharField(source="parcelle.nom", read_only=True)
    palm_code = serializers.CharField(source="palm.code_uni", read_only=True)
    operateur_username = serializers.CharField(
        source="operateur.username", read_only=True
    )
    est_dans_periode_recommandee = serializers.BooleanField(read_only=True)

    class Meta:
        model = Intervention
        fields = [
            "id", "type_intervention", "type_intervention_nom",
            "parcelle", "parcelle_nom", "palm", "palm_code",
            "date_intervention", "quantite", "operateur", "operateur_username",
            "description", "est_dans_periode_recommandee",
            "created_at", "updated_at",
        ]
        # parcelle reste modifiable : contrairement à Palm.parcelle (toujours
        # déduite de la géométrie), Intervention.parcelle n'est auto-remplie
        # dans save() que si un palm est fourni sans parcelle explicite. Pour
        # une intervention qui cible une parcelle entière (sans palm précis),
        # l'utilisateur doit pouvoir la renseigner directement.
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        # Intervention.clean() porte la même règle côté modèle/admin, mais
        # DRF n'appelle pas clean() automatiquement : on la duplique ici
        # pour que l'API renvoie une erreur 400 propre plutôt qu'une
        # IntegrityError ou un objet incohérent en base.
        parcelle = attrs.get("parcelle", getattr(self.instance, "parcelle", None))
        palm = attrs.get("palm", getattr(self.instance, "palm", None))
        if not parcelle and not palm:
            raise serializers.ValidationError(
                "Une intervention doit cibler au moins une parcelle ou un palmier."
            )
        return attrs
