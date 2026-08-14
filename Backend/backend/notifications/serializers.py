from rest_framework import serializers
from .models import Notification, RegleNotification


class RegleNotificationSerializer(serializers.ModelSerializer):
    type_intervention_nom = serializers.CharField(
        source="type_intervention.nom", read_only=True
    )
    parcelle_nom = serializers.CharField(
        source="parcelle.nom", read_only=True
    )

    class Meta:
        model  = RegleNotification
        fields = [
            "id", "nom", "type_intervention", "type_intervention_nom",
            "parcelle", "parcelle_nom", "delai_jours", "actif",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    regle_nom    = serializers.CharField(source="regle.nom",     read_only=True)
    parcelle_nom = serializers.CharField(source="parcelle.nom",  read_only=True)
    type_nom     = serializers.CharField(
        source="regle.type_intervention.nom", read_only=True
    )
    est_en_retard = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Notification
        fields = [
            "id",
            "regle", "regle_nom", "type_nom",
            "parcelle", "parcelle_nom",
            "palm",
            "statut", "priorite",
            "date_echeance",
            "date_debut", "date_fin",      # ← nouveaux
            "date_traitement",
            "message",
            "intervention_creee",
            "est_en_retard",
            "created_at",
        ]
        extra_kwargs = {
            "date_debut": {"required": False, "allow_null": True},
            "date_fin":   {"required": False, "allow_null": True},
        }