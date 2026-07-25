from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParcelleViewSet, ParcelleImportView

app_name = "parcels"

router = DefaultRouter()
router.register("parcelles", ParcelleViewSet, basename="parcelle")

urlpatterns = [
    path("parcelles/import/", ParcelleImportView.as_view(), name="parcelle-import"),
    path("", include(router.urls)),
]