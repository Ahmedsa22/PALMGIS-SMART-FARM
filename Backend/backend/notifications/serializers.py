from rest_framework import serializers

from .models import Notification, RegleNotification


class RegleNotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = RegleNotification
        fields = [
            "id", "nom", "type_intervention", "parcelle", "delai_jours",
            "actif", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class NotificationSerializer(serializers.ModelSerializer):
    parcelle_nom = serializers.CharField(source="parcelle.nom", read_only=True)
    type_intervention_nom = serializers.CharField(
        source="regle.type_intervention.nom", read_only=True
    )
    priorite_display = serializers.CharField(
        source="get_priorite_display", read_only=True
    )
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    est_en_retard = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "regle", "parcelle", "parcelle_nom", "palm",
            "type_intervention_nom", "statut", "statut_display",
            "priorite", "priorite_display", "date_echeance", "date_traitement",
            "intervention_creee", "message", "est_en_retard",
            "created_at", "updated_at",
        ]
        # date_traitement et intervention_creee sont renseignés
        # automatiquement (voir NotificationViewSet.perform_update et
        # l'action "traiter"), jamais saisis directement par l'utilisateur.
        read_only_fields = [
            "date_traitement", "intervention_creee", "created_at", "updated_at",
        ]
