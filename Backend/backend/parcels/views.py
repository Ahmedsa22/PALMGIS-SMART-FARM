from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsManagerOrReadOnly
from .models import Parcelle
from .serializers import ParcelleSerializer


class ParcelleViewSet(viewsets.ModelViewSet):
    queryset = Parcelle.objects.all()
    serializer_class = ParcelleSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["statut"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)