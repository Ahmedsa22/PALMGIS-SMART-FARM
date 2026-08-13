from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ImageSentinelViewSet,
    RechercherImagesView,
    TelechargerEtCalculerView,
    StatutImageView,
    ImagePNGView,
    ComparerIndicesView,       
    HistoriqueParcelleView,
)

app_name = "remote_sensing"

router = DefaultRouter()
router.register("images", ImageSentinelViewSet, basename="image")

urlpatterns = [
    path("", include(router.urls)),
    path("rechercher/",              RechercherImagesView.as_view(),      name="rechercher"),
    path("telecharger/",             TelechargerEtCalculerView.as_view(), name="telecharger"),
    path("statut/<int:image_id>/",   StatutImageView.as_view(),           name="statut"),
    path("image/<int:image_id>/<str:indice>/", ImagePNGView.as_view(),    name="image-png"),
     path("comparer/",                      ComparerIndicesView.as_view()),     
    path("historique/<int:parcelle_id>/",  HistoriqueParcelleView.as_view()), 
]