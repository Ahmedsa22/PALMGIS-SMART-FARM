from django.contrib import admin

from .models import Notification, RegleNotification


@admin.register(RegleNotification)
class RegleNotificationAdmin(admin.ModelAdmin):
    list_display = ["nom", "type_intervention", "parcelle", "delai_jours", "actif"]
    list_filter = ["actif", "type_intervention"]
    search_fields = ["nom"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "parcelle", "regle", "date_echeance", "statut", "priorite", "est_en_retard",
    ]
    list_filter = ["statut", "priorite"]
    date_hierarchy = "date_echeance"
    readonly_fields = ["date_traitement", "intervention_creee"]
