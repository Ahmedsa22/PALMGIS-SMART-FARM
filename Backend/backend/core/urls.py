from django.urls import path

from .views import UtilisateursView, health_check, me, UserViewSet, PromouvoirUtilisateurView
from rest_framework.routers import DefaultRouter


app_name = "core"

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")


urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("users/me/", me, name="me"),
    path("users/",                   UtilisateursView.as_view(),   name="users-list"),
    path("users/<int:user_id>/role/", PromouvoirUtilisateurView.as_view(), name="user-role"),

]