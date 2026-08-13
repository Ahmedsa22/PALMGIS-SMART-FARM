from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from interventions.models import Intervention
from palms.models import Palm
from parcels.models import Parcelle

from .models import Notification, RegleNotification


def generer_notifications(parcelle=None):
    """
    Génère les notifications manquantes pour toutes les parcelles (ou une
    parcelle précise si fournie).

    Appelée par la tâche Celery planifiée (à créer plus tard) et
    manuellement via l'action `generer` de NotificationViewSet.
    """
    aujourdhui = timezone.now().date()

    regles = RegleNotification.objects.filter(actif=True).select_related(
        "type_intervention"
    )
    if parcelle is not None:
        # Règles applicables à cette parcelle : les siennes + les globales.
        regles = regles.filter(Q(parcelle=parcelle) | Q(parcelle__isnull=True))

    created = 0
    skipped = 0

    for regle in regles:
        if parcelle is not None:
            parcelles_concernees = [parcelle]
        elif regle.parcelle_id:
            parcelles_concernees = [regle.parcelle]
        else:
            # Règle globale : s'applique à toutes les parcelles de la ferme.
            parcelles_concernees = list(Parcelle.objects.all())

        for p in parcelles_concernees:
            derniere = (
                Intervention.objects.filter(
                    type_intervention=regle.type_intervention, parcelle=p
                )
                .order_by("-date_intervention")
                .first()
            )

            if derniere is None:
                declenche = True
                date_echeance = aujourdhui
            else:
                derniere_date = derniere.date_intervention.date()
                jours_ecoules = (aujourdhui - derniere_date).days
                declenche = jours_ecoules > regle.delai_jours
                date_echeance = derniere_date + timedelta(days=regle.delai_jours)

            if not declenche:
                skipped += 1
                continue

            deja_en_attente = Notification.objects.filter(
                regle=regle, parcelle=p, statut=Notification.Statut.EN_ATTENTE
            ).exists()
            if deja_en_attente:
                skipped += 1
                continue

            palmiers_critiques = Palm.objects.filter(
                parcelle=p,
                etat_sante__in=[Palm.EtatSante.MAUVAIS, Palm.EtatSante.MORT],
            ).exists()
            priorite = (
                Notification.Priorite.HAUTE
                if palmiers_critiques
                else Notification.Priorite.NORMALE
            )

            Notification.objects.create(
                regle=regle,
                parcelle=p,
                priorite=priorite,
                date_echeance=date_echeance,
            )
            created += 1

    return {"created": created, "skipped": skipped}
