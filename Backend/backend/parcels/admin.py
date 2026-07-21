from django.contrib import admin

# Register your models here.




from django.contrib.gis.admin import GISModelAdmin
from .models import Parcelle


@admin.register(Parcelle)
class ParcelleAdmin(GISModelAdmin):
    list_display = ["nom", "statut", "superficie_ha", "proprietaire"]
    list_filter = ["statut"]
    search_fields = ["nom", "proprietaire"]