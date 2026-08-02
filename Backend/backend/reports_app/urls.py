from django.urls import path
from .views import CarteView

app_name = "reports_app"

urlpatterns = [
    path("carte/", CarteView.as_view(), name="carte"),
]