from django.db import models

# Create your models here.
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Polygon
from django.db import models
from core.models import BaseModel


class Parcelle(BaseModel):
    class Statut(models.TextChoices):
        ACTIVE = "active", "Active"
        EN_REPOS = "en_repos", "En repos"
        ABANDONNEE = "abandonnee", "Abandonnée"

    class TypeParcelle(models.TextChoices):
        FERME    = "ferme",    "Ferme"
        ZONE     = "zone",     "Zone"
        PARCELLE = "parcelle", "Parcelle"


    nom = models.CharField(max_length=150)
    geom = gis_models.PolygonField(srid=4326)  # 4326 = coordonnées GPS (lat/lon)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.ACTIVE,
    )
    type_parcelle = models.CharField(          # ← nouveau champ
        max_length=10,
        choices=TypeParcelle.choices,
        default=TypeParcelle.PARCELLE,
    )



    proprietaire = models.CharField(max_length=150, blank=True, default="")
    description = models.TextField(blank=True, default="")

    # Calculés automatiquement à chaque sauvegarde (voir save() ci-dessous)
    superficie_m2 = models.FloatField(editable=False, null=True, blank=True)
    perimetre_m = models.FloatField(editable=False, null=True, blank=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        return self.nom

    def save(self, *args, **kwargs):
        # Transforme la géométrie en projection métrique (UTM zone 29N pour le Maroc,
        # EPSG:26191 ou EPSG:32629 selon la zone exacte) pour un calcul précis en mètres.
        geom_metric = self.geom.transform(26192, clone=True)
        self.superficie_m2 = geom_metric.area
        self.perimetre_m = geom_metric.length
        super().save(*args, **kwargs)

    @property
    def superficie_ha(self):
        return round(self.superficie_m2 / 10000, 3) if self.superficie_m2 else None

    @property
    def superficie_ha(self):
        """Superficie en hectares."""
        return round((self.superficie_m2 or 0) / 10000, 2)