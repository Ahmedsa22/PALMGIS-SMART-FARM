from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Palm


@admin.register(Palm)
class PalmAdmin(GISModelAdmin):
    # GISModelAdmin fournit la carte interactive pour éditer le PointField geom.
    list_display = ["code_uni", "parcelle", "etat_sante", "variete"]
    list_filter = ["etat_sante", "variete", "parcelle"]
    search_fields = ["code_uni", "code_local", "ligne", "numero"]
