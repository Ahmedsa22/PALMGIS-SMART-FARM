# CONTEXTE PROJET — PalmGIS Smart Farm (Backend Django)

Tu es mon copilote de développement sur ce projet. Lis ce contexte avant
toute action : il reflète l'état réel du code, pas un plan théorique.

## 1. Objectif du projet
Plateforme SIG pour la gestion complète d'une ferme de palmiers dattiers :
cartographie des parcelles/palmiers, interventions agricoles, notifications,
analyse satellitaire (NDVI/NDWI/SAVI), prédiction de rendement par IA,
tableau de bord, rapports/cartes PDF.

## 2. Stack technique
- Front-end : React (SPA), carte via Leaflet/MapLibre
- Back-end : Django + Django REST Framework
- Géospatial : GeoDjango
- Base de données : PostgreSQL + PostGIS (port local non standard : 5434)
- Auth : dj-rest-auth + JWT via cookies httpOnly (PAS de token en header
  Authorization — c'est un choix délibéré pour la protection XSS)
- Environnement : conda (env `palmgis`), Windows

## 3. Structure du projet
Backend/
├── backend/          → config Django (settings.py, urls.py)
├── core/              → User custom, rôles, permissions, audit
├── parcels/           → Parcelle (fait)
├── palms/             → Site/palmiers (à faire)
├── interventions/     → historique opérations (à faire)
├── notifications/     → rappels automatiques (à faire)
├── remote_sensing/    → NDVI/NDWI/SAVI (à faire)
├── ai_predictions/    → prédiction rendement (à faire)
├── dashboard/         → stats agrégées (à faire)
├── reports/           → PDF/cartes (à faire)
└── manage.py
Frontend/

Règle de dépendance stricte : `core` ne dépend de rien. `parcels`/`palms`
ne dépendent que de `core`. Les autres apps peuvent dépendre de
`parcels`/`palms` mais jamais l'inverse. Ne jamais créer de dépendance
circulaire entre apps.

## 4. Modèle de rôles (2 rôles seulement, décision actée)
- `manager` (Gestionnaire) : lecture + écriture sur tout
- `viewer` (Consultant) : lecture seule sur tout
- Implémenté via `core.User.role` + `core.permissions.IsManagerOrReadOnly`,
  appliqué par défaut à TOUS les endpoints via `REST_FRAMEWORK.
  DEFAULT_PERMISSION_CLASSES` dans settings.py. Ne pas dupliquer cette
  logique dans chaque vue — elle est déjà globale.

## 5. Ce qui est déjà fait et fonctionnel
- `core` : User custom (role manager/viewer), BaseModel (abstract, avec
  created_at/updated_at/created_by), AuditLog (modèle créé mais PAS
  encore alimenté automatiquement — à connecter plus tard via signaux
  ou dans perform_create/update/destroy des vues)
- Authentification : dj-rest-auth opérationnel, routes sous `/api/auth/`
- `parcels` : modèle `Parcelle` (Polygon, SRID stockage 4326), calcul
  auto superficie_m2/perimetre_m via reprojection EPSG:26192 (Merchich/
  Sud Maroc) dans save(), serializer GeoJSON (GeoFeatureModelSerializer),
  ViewSet CRUD complet, admin avec carte (GISModelAdmin)
- Import de données : endpoint `POST /api/parcelles/import/` acceptant
  un .zip (Shapefile) ou .geojson, reprojection automatique vers 4326,
  réservé aux managers

## 6. Conventions de code à respecter
- Tous les modèles métier héritent de `core.BaseModel` (jamais de
  duplication de created_at/updated_at/created_by)
- Les imports sont TOUJOURS relatifs à la racine du projet
  (`from core.permissions import ...`), jamais de chemin absolu type
  `from Backend.backend...`
- Tout champ géométrique se stocke en SRID 4326 ; les calculs métriques
  (superficie, périmètre, distances) utilisent une reprojection
  temporaire vers EPSG:26192 (ne jamais stocker la géométrie reprojetée)
- Chaque nouvelle app métier doit avoir : models.py, serializers.py,
  views.py, urls.py (avec app_name), admin.py — ne jamais laisser
  admin.py vide si un modèle doit être visible dans /admin/
- Les endpoints d'écriture sont réservés aux managers via
  IsManagerOrReadOnly (déjà en default, ne pas le retirer sauf besoin
  explicite justifié)
- Nouvelle app → penser à l'ajouter dans INSTALLED_APPS ET dans le
  urls.py principal (`path('api/', include('<app>.urls'))`)
- Après ajout/modification d'un modèle : toujours
  `python manage.py makemigrations <app>` puis `migrate`, jamais de
  modification manuelle de la structure de table via pgAdmin

## 7. Pièges déjà rencontrés (à éviter de reproduire)
- Nom du package pip ≠ nom du module Python (ex: `django-allauth` →
  `allauth`, `djangorestframework-gis` → `rest_framework_gis`,
  `django-cors-headers` → `corsheaders`)
- GDAL sous Windows : toujours installer via
  `conda install -c conda-forge gdal`, pas pip
- Ne jamais éditer une colonne de table existante directement en base
  (pgAdmin) — toujours passer par makemigrations/migrate

## 8. Comment travailler avec moi
- Avant un nouveau module (palms, interventions...), propose le plan
  (modèle, serializer, vue, urls) puis attends validation si la logique
  métier n'est pas déjà cadrée ci-dessus.
- Signale toute divergence entre ma demande et les conventions ci-dessus
  avant d'implémenter.
- Code commenté en français, noms de variables explicites.
- Isole la logique IA/télédétection dans des services dédiés, pas dans
  les vues.

## 9. Prochaine étape prévue
Développer `palms` : modèle `Site` (PointField SRID 4326), rattachement
automatique à la Parcelle englobante (via `.contains()` GeoDjango),
champs métier (identifiant, variété, âge, état sanitaire, date de
plantation, observations, photos).