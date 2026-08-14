from django.db import models
from django.utils import timezone
from core.models import BaseModel


class RegleNotification(BaseModel):
    nom = models.CharField(max_length=150)
    type_intervention = models.ForeignKey(
        "interventions.TypeIntervention",
        on_delete=models.CASCADE,
        related_name="regles",
    )
    parcelle = models.ForeignKey(
        "parcels.Parcelle",
        on_delete=models.CASCADE,
        related_name="regles_notification",
        null=True, blank=True,
    )
    delai_jours = models.PositiveIntegerField()
    actif       = models.BooleanField(default=True)

    class Meta:
        ordering = ["type_intervention", "parcelle"]

    def __str__(self):
        return self.nom


class Notification(BaseModel):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        TRAITEE    = "traitee",    "Traitée"
        REPORTEE   = "reportee",   "Reportée"
        IGNOREE    = "ignoree",    "Ignorée"

    class Priorite(models.TextChoices):
        HAUTE   = "haute",   "Haute"
        NORMALE = "normale", "Normale"
        BASSE   = "basse",   "Basse"

    regle = models.ForeignKey(
        RegleNotification,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    parcelle = models.ForeignKey(
        "parcels.Parcelle",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    palm = models.ForeignKey(
        "palms.Palm",
        on_delete=models.SET_NULL,
        related_name="notifications",
        null=True, blank=True,
    )
    statut    = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE
    )
    priorite  = models.CharField(
        max_length=10, choices=Priorite.choices, default=Priorite.NORMALE
    )
    date_echeance   = models.DateField()
    date_traitement = models.DateTimeField(null=True, blank=True)
    intervention_creee = models.ForeignKey(
        "interventions.Intervention",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="notification_origine",
    )
    message = models.TextField(blank=True)

    # ← Nouveaux champs pour la période de notification manuelle
    date_debut = models.DateField(null=True, blank=True)
    date_fin   = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-date_echeance", "priorite"]

    def __str__(self):
        return self.message or f"{self.regle} - {self.parcelle} ({self.date_echeance})"

    def save(self, *args, **kwargs):
        if not self.message:
            self.message = self._generer_message()
        super().save(*args, **kwargs)

    def _generer_message(self):
        from interventions.models import Intervention
        type_nom = self.regle.type_intervention.nom
        derniere = (
            Intervention.objects.filter(
                type_intervention=self.regle.type_intervention,
                parcelle=self.parcelle,
            )
            .order_by("-date_intervention")
            .first()
        )
        if derniere:
            return (
                f"{type_nom} recommandée sur {self.parcelle.nom} — délai de "
                f"{self.regle.delai_jours} jours dépassé depuis la dernière "
                f"intervention du {derniere.date_intervention:%d/%m/%Y}."
            )
        return (
            f"{type_nom} recommandée sur {self.parcelle.nom} — aucune "
            "intervention de ce type enregistrée."
        )

    @property
    def est_en_retard(self):
        return (
            self.statut == self.Statut.EN_ATTENTE and
            self.date_echeance < timezone.now().date()
        )