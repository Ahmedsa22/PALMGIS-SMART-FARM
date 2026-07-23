from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet, RegleNotificationViewSet

app_name = "notifications"

router = DefaultRouter()
router.register("regles-notification", RegleNotificationViewSet, basename="regle-notification")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
]
