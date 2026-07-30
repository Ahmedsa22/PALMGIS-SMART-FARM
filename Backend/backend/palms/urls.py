from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PalmViewSet, PalmImportView

app_name = "palms"

router = DefaultRouter()
router.register("palms", PalmViewSet, basename="palm")

urlpatterns = [
    path("palms/import/", PalmImportView.as_view(), name="palm-import"),  
    path("", include(router.urls)),
]