from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParcelleViewSet

app_name = "parcels"

router = DefaultRouter()
router.register("parcelles", ParcelleViewSet, basename="parcelle")

urlpatterns = [
    path("", include(router.urls)),
]