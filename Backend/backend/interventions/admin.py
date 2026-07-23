from django.contrib import admin

from .models import Intervention, PieceJointe, TypeIntervention


@admin.register(TypeIntervention)
class TypeInterventionAdmin(admin.ModelAdmin):
    list_display = ["nom", "mois_debut", "mois_fin", "cible_defaut", "actif"]
    list_filter = ["cible_defaut", "actif"]
    search_fields = ["nom", "code"]
    prepopulated_fields = {"code": ("nom",)}


class PieceJointeInline(admin.TabularInline):
    model = PieceJointe
    extra = 0


@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = [
        "type_intervention", "parcelle", "palm", "date_intervention", "operateur",
    ]
    list_filter = ["type_intervention", "parcelle"]
    date_hierarchy = "date_intervention"
    search_fields = ["description"]
    inlines = [PieceJointeInline]
