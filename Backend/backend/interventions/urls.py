from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import InterventionViewSet, PieceJointeViewSet, TypeInterventionViewSet

app_name = "interventions"

router = DefaultRouter()
router.register("types-intervention", TypeInterventionViewSet, basename="type-intervention")
router.register("interventions", InterventionViewSet, basename="intervention")
router.register("pieces-jointes", PieceJointeViewSet, basename="piece-jointe")

urlpatterns = [
    path("", include(router.urls)),
]
