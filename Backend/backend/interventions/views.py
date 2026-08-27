from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend

from .models import Intervention, PieceJointe, TypeIntervention
from .serializers import (
    InterventionSerializer,
    PieceJointeSerializer,
    TypeInterventionSerializer,
)


class TypeInterventionViewSet(viewsets.ModelViewSet):
    queryset         = TypeIntervention.objects.all()
    serializer_class = TypeInterventionSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ["actif"]


class InterventionViewSet(viewsets.ModelViewSet):
    queryset = Intervention.objects.select_related(
        "type_intervention", "parcelle", "palm", "operateur"
    )
    serializer_class = InterventionSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = {
        "type_intervention": ["exact"],
        "parcelle":          ["exact"],
        "palm":              ["exact"],
        "date_intervention": ["gte", "lte"],
    }

    def perform_create(self, serializer):
        operateur = (
            serializer.validated_data.get("operateur") or
            self.request.user
        )
        intervention = serializer.save(
            created_by=self.request.user,
            operateur=operateur,
        )

        # ── Génère les notifications si période définie ──
        self._generer_notifications(intervention)

    def _generer_notifications(self, intervention):
        """
        Si l'intervention a une période de notification définie,
        crée une notification pour chaque parcelle concernée.
        """
        if not intervention.notification_debut or not intervention.notification_fin:
            return

        try:
            from notifications.models import Notification
            from parcels.models import Parcelle

            message = intervention.notification_message or (
                f"Intervention '{intervention.type_intervention.nom}' "
                f"prévue du {intervention.notification_debut} "
                f"au {intervention.notification_fin}"
            )

            # Parcelles concernées
            if intervention.parcelle:
                # Notification pour cette parcelle uniquement
                parcelles = [intervention.parcelle]
            else:
                # Notification pour toutes les parcelles
                parcelles = list(Parcelle.objects.all())

            for parcelle in parcelles:
                Notification.objects.create(
                    titre=f"{intervention.type_intervention.nom} — {parcelle.nom}",
                    message=message,
                    type_notification="intervention",
                    parcelle=parcelle,
                    date_debut=intervention.notification_debut,
                    date_fin=intervention.notification_fin,
                    created_by=intervention.created_by,
                )

            print(f"✅ {len(parcelles)} notification(s) créée(s) pour l'intervention {intervention.id}")

        except Exception as e:
            import traceback
            print(f"❌ Erreur génération notifications: {e}")
            print(traceback.format_exc())

    def perform_update(self, serializer):
        intervention = serializer.save()
        self._generer_notifications(intervention)


class PieceJointeViewSet(viewsets.ModelViewSet):
    queryset         = PieceJointe.objects.select_related("intervention")
    serializer_class = PieceJointeSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ["intervention"]