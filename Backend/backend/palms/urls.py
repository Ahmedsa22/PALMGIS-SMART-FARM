from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PalmViewSet

app_name = "palms"

router = DefaultRouter()
router.register("palms", PalmViewSet, basename="palm")

urlpatterns = [
    path("", include(router.urls)),
]
