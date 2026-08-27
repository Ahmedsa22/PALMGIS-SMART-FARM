from django.urls import path
from .views import (
    PredictionRendementView,
    RecommandationVarieteView,
    StatsVarietesView,
)

urlpatterns = [
    path("predire/rendement/",   PredictionRendementView.as_view()),
    path("recommander/variete/", RecommandationVarieteView.as_view()),
    path("stats/varietes/",      StatsVarietesView.as_view()),
]