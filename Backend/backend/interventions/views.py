from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend

from .models import Intervention, PieceJointe, TypeIntervention
from .serializers import (
    InterventionSerializer,
    PieceJointeSerializer,
    TypeInterventionSerializer,
)


class TypeInterventionViewSet(viewsets.ModelViewSet):
    queryset = TypeIntervention.objects.all()
    serializer_class = TypeInterventionSerializer
    # permission_classes non redéclaré : IsManagerOrReadOnly est déjà en
    # DEFAULT_PERMISSION_CLASSES (managers = écriture, viewers = lecture).
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["actif"]


class InterventionViewSet(viewsets.ModelViewSet):
    queryset = Intervention.objects.select_related(
        "type_intervention", "parcelle", "palm", "operateur"
    )
    serializer_class = InterventionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "type_intervention": ["exact"],
        "parcelle": ["exact"],
        "palm": ["exact"],
        "date_intervention": ["gte", "lte"],
    }

    def perform_create(self, serializer):
        operateur = serializer.validated_data.get("operateur") or self.request.user
        serializer.save(created_by=self.request.user, operateur=operateur)


class PieceJointeViewSet(viewsets.ModelViewSet):
    queryset = PieceJointe.objects.select_related("intervention")
    serializer_class = PieceJointeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["intervention"]
