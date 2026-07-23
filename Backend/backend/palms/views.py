from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend

from .models import Palm
from .serializers import PalmSerializer


class PalmViewSet(viewsets.ModelViewSet):
    queryset = Palm.objects.all()
    serializer_class = PalmSerializer
    pagination_class = None
    # permission_classes non redéclaré : IsManagerOrReadOnly est déjà appliqué
    # globalement via REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES (settings.py).
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["etat_sante", "variete", "parcelle"]

    def perform_create(self, serializer):
        # Renseigne created_by (hérité de core.BaseModel), comme dans parcels.
        serializer.save(created_by=self.request.user)
