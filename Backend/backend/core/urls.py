from django.urls import path

from .views import health_check, me, UserViewSet
from rest_framework.routers import DefaultRouter


app_name = "core"

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")


urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("users/me/", me, name="me"),

]