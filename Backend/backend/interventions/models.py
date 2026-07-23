from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import BaseModel


class TypeIntervention(BaseModel):
    """Type d'opération agronomique paramétrable (irrigation, pollinisation...).

    Volontairement PAS un TextChoices : la liste des types et leurs périodes
    évoluent (calendrier agronomique), donc stockées en base et gérables
    via l'admin plutôt que figées dans le code.
    """

    class Cible(models.TextChoices):
        PARCELLE = "parcelle", "Parcelle"
        PALMIER = "palmier", "Palmier"
        LES_DEUX = "les_deux", "Les deux"

    nom = models.CharField(max_length=100, unique=True)
    code = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    # Période recommandée dans l'année (1-12). mois_fin peut être < mois_debut
    # quand la période chevauche le nouvel an (ex: fertilisation fond 12→2).
    mois_debut = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    mois_fin = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    cible_defaut = models.CharField(max_length=10, choices=Cible.choices)
    unite_mesure = models.CharField(max_length=20, blank=True)
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ["mois_debut", "nom"]

    def __str__(self):
        return self.nom


class Intervention(BaseModel):
    type_intervention = models.ForeignKey(
        TypeIntervention,
        on_delete=models.PROTECT,
        related_name="interventions",
    )
    parcelle = models.ForeignKey(
        "parcels.Parcelle",
        on_delete=models.CASCADE,
        related_name="interventions",
        null=True,
        blank=True,
    )
    palm = models.ForeignKey(
        "palms.Palm",
        on_delete=models.CASCADE,
        related_name="interventions",
        null=True,
        blank=True,
    )
    date_intervention = models.DateTimeField()
    quantite = models.FloatField(null=True, blank=True)
    operateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="interventions_realisees",
    )
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["-date_intervention"]

    def __str__(self):
        cible = self.palm or self.parcelle
        return f"{self.type_intervention} - {cible} ({self.date_intervention:%Y-%m-%d})"

    def clean(self):
        if not self.parcelle_id and not self.palm_id:
            raise ValidationError(
                "Une intervention doit cibler au moins une parcelle ou un palmier."
            )

    def save(self, *args, **kwargs):
        # Rattachement automatique à la parcelle du palmier ciblé, pour
        # permettre de filtrer/agréger les interventions par parcelle même
        # quand seul un palmier précis a été renseigné.
        if self.palm_id and not self.parcelle_id:
            self.parcelle = self.palm.parcelle
        super().save(*args, **kwargs)

    @property
    def est_dans_periode_recommandee(self):
        if not self.date_intervention or not self.type_intervention_id:
            return None
        mois = self.date_intervention.month
        debut = self.type_intervention.mois_debut
        fin = self.type_intervention.mois_fin
        if debut <= fin:
            return debut <= mois <= fin
        # La période chevauche le nouvel an (ex: 12 → 2) : le mois est dans
        # la plage s'il est après le début OU avant la fin.
        return mois >= debut or mois <= fin


class PieceJointe(BaseModel):
    intervention = models.ForeignKey(
        Intervention,
        on_delete=models.CASCADE,
        related_name="pieces_jointes",
    )
    fichier = models.FileField(upload_to="interventions/")

    def __str__(self):
        return self.fichier.name
