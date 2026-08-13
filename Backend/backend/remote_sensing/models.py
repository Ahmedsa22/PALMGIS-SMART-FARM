from django.db import models
from core.models import BaseModel
from parcels.models import Parcelle


class ImageSentinel(BaseModel):
    """Image Sentinel-2 téléchargée pour une parcelle."""

    class Statut(models.TextChoices):
        EN_ATTENTE   = "en_attente",   "En attente"
        TELECHARGEMENT = "telechargement", "Téléchargement"
        TRAITEMENT   = "traitement",   "Traitement"
        TERMINE      = "termine",      "Terminé"
        ERREUR       = "erreur",       "Erreur"

    parcelle         = models.ForeignKey(
        Parcelle, on_delete=models.CASCADE,
        related_name="images_sentinel"
    )
    date_acquisition = models.DateField()
    produit_id       = models.CharField(max_length=200, blank=True)
    nuage_pct        = models.FloatField(default=0)
    statut           = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE
    )
    chemin_b04       = models.CharField(max_length=500, blank=True)  # Rouge
    chemin_b08       = models.CharField(max_length=500, blank=True)  # PIR
    chemin_b11       = models.CharField(max_length=500, blank=True)  # SWIR
    message_erreur   = models.TextField(blank=True)

    class Meta:
        ordering = ["-date_acquisition"]

    def __str__(self):
        return f"{self.parcelle.nom} — {self.date_acquisition}"


class IndiceSpectral(BaseModel):
    """Résultats des indices spectraux calculés."""

    image     = models.OneToOneField(
        ImageSentinel, on_delete=models.CASCADE,
        related_name="indices"
    )

    # NDVI — Normalized Difference Vegetation Index
    ndvi_min  = models.FloatField(null=True, blank=True)
    ndvi_max  = models.FloatField(null=True, blank=True)
    ndvi_mean = models.FloatField(null=True, blank=True)
    ndvi_std  = models.FloatField(null=True, blank=True)

    # NDWI — Normalized Difference Water Index
    ndwi_min  = models.FloatField(null=True, blank=True)
    ndwi_max  = models.FloatField(null=True, blank=True)
    ndwi_mean = models.FloatField(null=True, blank=True)

    # SAVI — Soil Adjusted Vegetation Index
    savi_min  = models.FloatField(null=True, blank=True)
    savi_max  = models.FloatField(null=True, blank=True)
    savi_mean = models.FloatField(null=True, blank=True)

    # Chemins des images colorées générées
    chemin_ndvi_png  = models.CharField(max_length=500, blank=True)
    chemin_ndwi_png  = models.CharField(max_length=500, blank=True)
    chemin_savi_png  = models.CharField(max_length=500, blank=True)

    # Interprétation automatique
    interpretation   = models.TextField(blank=True)

    def __str__(self):
        return f"Indices — {self.image}"
