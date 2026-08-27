from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from interventions.models import Intervention
from interventions.serializers import InterventionSerializer
from parcels.models import Parcelle

from .models import Notification, RegleNotification
from .serializers import NotificationSerializer, RegleNotificationSerializer
from .services import generer_notifications


class RegleNotificationViewSet(viewsets.ModelViewSet):
    queryset = RegleNotification.objects.select_related(
        "type_intervention", "parcelle"
    )
    serializer_class = RegleNotificationSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ["actif", "parcelle"]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related(
        "regle__type_intervention", "parcelle", "palm"
    )
    serializer_class = NotificationSerializer
    filter_backends  = [DjangoFilterBackend]
    filterset_fields = ["statut", "priorite", "parcelle", "date_echeance"]

    def list(self, request, *args, **kwargs):
        """
        Génère automatiquement les notifications avant de les retourner.
        Appelé à chaque GET /api/notifications/
        """
        try:
            parcelle_id = request.query_params.get("parcelle")
            if parcelle_id:
                parcelle = Parcelle.objects.get(id=parcelle_id)
                generer_notifications(parcelle=parcelle)
            else:
                generer_notifications(parcelle=None)
        except Exception as e:
            print(f"⚠️ Génération auto notifications: {e}")

        return super().list(request, *args, **kwargs)

    def perform_update(self, serializer):
        nouveau_statut = serializer.validated_data.get(
            "statut", serializer.instance.statut
        )
        if (
            nouveau_statut == Notification.Statut.TRAITEE and
            not serializer.instance.date_traitement
        ):
            serializer.save(date_traitement=timezone.now())
        else:
            serializer.save()

    @action(detail=True, methods=["post"], url_path="traiter")
    def traiter(self, request, pk=None):
        notification = self.get_object()
        if notification.intervention_creee_id:
            return Response(
                {"detail": "Cette notification a déjà une intervention associée."},
                status=400,
            )

        intervention = Intervention.objects.create(
            type_intervention=notification.regle.type_intervention,
            parcelle=notification.parcelle,
            palm=notification.palm,
            date_intervention=timezone.now(),
            operateur=request.user,
            created_by=request.user,
        )

        notification.statut             = Notification.Statut.TRAITEE
        notification.date_traitement    = timezone.now()
        notification.intervention_creee = intervention
        notification.save()

        return Response({
            "notification": NotificationSerializer(notification).data,
            "intervention": InterventionSerializer(intervention).data,
        })

    @action(detail=False, methods=["post"], url_path="generer")
    def generer(self, request):
        """Endpoint manuel pour forcer la régénération (managers)."""
        parcelle_id = request.data.get("parcelle")
        parcelle    = get_object_or_404(Parcelle, pk=parcelle_id) if parcelle_id else None
        resultat    = generer_notifications(parcelle=parcelle)
        return Response(resultat)