from django.contrib.gis.db import models as gis_models
from django.db import models
from core.models import BaseModel

class Palm(BaseModel):
    class Age(models.TextChoices):
        JEUNE = "JP", "Jeune"
        ADULTE = "A", "Adulte"
        VIEUX = "V", "Vieux"

    class Etat_Site(models.TextChoices):
        ISOLE = "ISO", "isolé"
        TOUFFES = "TOF", "touffes"

    class Etat_Sante(models.TextChoices):
        BON = "B", "Bon"
        MOYEN = "MO", "Moyen"
        MAUVAIS = "MA", "Mauvais"
        MORT = "MR", "Mort"

    class Sexe(models.TextChoices):
        MALE = "M", "Mâle"
        FEMALE = "F", "Femelle"

    geom = gis_models.PointField(srid=4326, geography=True)
    parcelle = models.ForeignKey(
    "parcels.Parcelle",
    on_delete=models.CASCADE,
    related_name="palms",
    null=True,
    blank=True,)

    
    age = models.CharField(max_length=2, choices=Age.choices, blank=True, null=True)
    etat_site = models.CharField(max_length=3, choices=Etat_Site.choices, blank=True, null=True)
    etat_sante = models.CharField(max_length=2, choices=Etat_Sante.choices, blank=True, null=True)
    sexe = models.CharField(max_length=1, choices=Sexe.choices, blank=True, null=True)
    variete = models.CharField(max_length=100, blank=True, null=True)
    ligne = models.CharField(max_length=100, blank=True, null=True)
    numero = models.CharField(max_length=100, blank=True, null=True)
    code_uni = models.CharField(max_length=100, blank=True, null=True)
    code_local = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ["ligne", "numero"]

    def __str__(self):
        return self.code_uni if self.code_uni else f"{self.ligne}-{self.numero}"
    
    def save(self, *args, **kwargs):
        if self.geom and not self.parcelle_id:
            from parcels.models import Parcelle
            parcelle_trouvee = Parcelle.objects.filter(geom__contains=self.geom).first()
            if parcelle_trouvee:
                self.parcelle = parcelle_trouvee
        super().save(*args, **kwargs)