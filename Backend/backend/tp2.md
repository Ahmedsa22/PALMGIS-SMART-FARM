# TP — Mise en Place du Back-end d'une Application SIG avec Django

**Niveau :** Débutant
**Projet :** PalmGIS Smart Farm — Plateforme SIG pour la gestion d'une ferme de palmiers
**Stack :** React · Django / DRF / GeoDjango · PostgreSQL / PostGIS

---

## Objectif du TP

Ce document explique, étape par étape et avec les explications pédagogiques
nécessaires, tout le travail réalisé pour poser les fondations back-end du
projet : configuration du projet Django, mise en place de l'authentification,
création du modèle utilisateur avec gestion des rôles, et création du premier
modèle métier géospatial (`Parcelle`).

À la fin de ce TP, tu dois être capable de refaire chaque étape seul, sur un
nouveau projet, en comprenant **pourquoi** chaque commande et chaque ligne de
configuration sont nécessaires — pas seulement **comment** les copier.

---

## Partie 1 — Organisation du projet en apps Django

### 1.1 Qu'est-ce qu'une app Django ?

Un **projet** Django est l'application complète. Une **app** est un
sous-module autonome dédié à une seule responsabilité métier — un dossier
avec une structure standardisée (`models.py`, `views.py`, `urls.py`,
`serializers.py`, `admin.py`...).

### 1.2 Pourquoi découper en plusieurs apps plutôt qu'une seule

| Sans découpage                                   | Avec découpage en apps |
|--------------------------------------------------|--------------------------------|
| Un fichier `models.py` géant, illisible          | Code organisé par domaine métier |
| Conflits fréquents en travail d'équipe           | Chacun travaille sur son module |
| Difficile de tester une fonctionnalité isolément | Tests ciblés par app |
| Le code ne reflète pas le cahier des charges     | Structure = miroir direct des modules métier |

### 1.3 Les apps créées pour ce projet

Chaque app correspond à un module du cahier des charges :

```
core            → Utilisateur personnalisé, rôles, audit, permissions
parcels         → Gestion des parcelles (polygones)
palms           → Gestion des sites/palmiers (points)
interventions   → Historique des opérations agricoles
notifications   → Rappels automatiques
remote_sensing  → Analyse satellitaire (NDVI/NDWI/SAVI)
ai_predictions  → Prédiction de rendement, recommandations IA
dashboard       → Statistiques et agrégations
reports         → Génération PDF et cartes imprimables
```

**Règle de dépendance à retenir :** `core` ne dépend de rien. `parcels` et
`palms` ne dépendent que de `core`. Les autres apps peuvent dépendre de
`parcels`/`palms`, mais jamais l'inverse. Cette règle évite les dépendances
circulaires (deux apps qui s'importent mutuellement, ce que Python refuse).

### 1.4 Structure de dossiers retenue

```
Backend/
├── backend/            → dossier de config Django (settings.py, urls.py)
├── core/
├── parcels/
├── palms/
├── interventions/
├── notifications/
├── remote_sensing/
├── ai_predictions/
├── dashboard/
├── reports/
└── manage.py
Frontend/
```

Toutes les apps sont au même niveau que `manage.py` — c'est la convention
standard Django, qui permet de les importer directement (`from core.models
import ...`) sans préfixe supplémentaire.

---

## Partie 2 — Configuration de `settings.py`

Le fichier `settings.py` est le cœur de la configuration Django. Voici,
dans l'ordre logique, tout ce qui a été mis en place et pourquoi.

### 2.1 `AUTH_USER_MODEL` — à définir avant toute migration

```python
AUTH_USER_MODEL = "core.User"
```

**Pourquoi :** Django utilise par défaut son propre modèle `User` (table
`auth_user`). Comme ce projet a besoin d'un champ `role` personnalisé, il
faut remplacer ce modèle par le nôtre. **Ce réglage doit être fait avant la
toute première migration** — le changer après coup casse la cohérence de
la base de données, car la table utilisateur ne peut pas être "renommée"
après coup par Django.

### 2.2 `DATABASES` — connexion PostGIS via variables d'environnement

```python
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

            1. __file__
            C'est une variable interne de Python. Elle contient le chemin absolu du fichier actuel, c'est-à-dire le fichier settings.py.

            Exemple : C:\mon_projet\config\settings.py

            2. .resolve()
            Cette méthode nettoie le chemin. Elle supprime les éventuels liens symboliques ou les doubles barres obliques (\\) pour donner un chemin propre, officiel et unique.

            3. .parent (le premier)
            Il demande le dossier qui contient le fichier actuel. Le parent de settings.py est donc le dossier de configuration (souvent nommé comme ton projet).

            Exemple : C:\mon_projet\config\

            4. .parent (le deuxième)
            Il remonte encore d'un cran. Le parent du dossier de configuration est le dossier racine de ton projet (là où se trouve le fichier manage.py).

            Exemple : C:\mon_projet\

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',  # pas postgresql classique
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': os.getenv('POSTGRES_HOST'),
        'PORT': os.getenv('POSTGRES_PORT'),
    }
}
```

**Pourquoi le moteur `postgis` et pas `postgresql`** : c'est le moteur
spécial de GeoDjango, qui sait manipuler les colonnes géométriques
(polygones, points) et exécuter les fonctions spatiales de PostGIS
(calcul d'aire, de périmètre, intersections...).

**Pourquoi les variables d'environnement (`.env`)** : pour ne jamais écrire
de mot de passe en clair dans le code source, qui pourrait se retrouver sur
GitHub. Le fichier `.env` contient les vraies valeurs et est exclu de Git
via `.gitignore` ; un fichier `.env.example` (sans les vraies valeurs) est
commité pour documenter les variables attendues.

```env
# .env (jamais commité)
POSTGRES_DB=Palm_GIS
POSTGRES_USER=postgres
POSTGRES_PASSWORD=xxxx
POSTGRES_HOST=localhost
POSTGRES_PORT=5434
```

### 2.3 `INSTALLED_APPS`

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",         # obligatoire pour GeoDjango
    "django.contrib.sites",       # requis par dj-rest-auth/allauth

    "rest_framework",
    "rest_framework_gis",
    "corsheaders",
    "django_filters",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "allauth",
    "allauth.account",

    "core",
    "parcels",
    "palms",
    "interventions",
    "notifications",
    "remote_sensing",
    "ai_predictions",
    "dashboard",
    "reports",
]

SITE_ID = 1
###why SITE_ID
```

### 2.4 Modèle d'accès — 2 rôles seulement

Décision prise pour ce projet : un modèle simplifié à deux rôles plutôt
qu'un système complexe à plusieurs niveaux.

| Rôle                      | Droits |
|---|---|
| `manager` (Gestionnaire)  | Lecture + écriture sur tous les modules |
| `viewer` (Consultant)     | Lecture seule sur tous les modules |

### 2.5 Authentification — JWT via cookies httpOnly (bonne pratique retenue)

Deux approches existent pour l'authentification par token JWT :

| | JWT en header (`Authorization: Bearer ...`) | JWT en cookie httpOnly (retenu) |
|---|---|---|
| Où vit le token | Stocké côté front (localStorage) | Stocké dans un cookie, invisible en JS |
| Risque XSS | Un script malveillant peut voler le token | Protégé — JS ne peut pas lire le cookie |
| Complexité | Plus simple à mettre en place | Nécessite CORS + CSRF configurés |

**Choix retenu : cookies httpOnly**, via la librairie `dj-rest-auth`, pour
apprendre directement la bonne pratique de sécurité.

```python
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_COOKIE": "palmgis_access_cookie",
    "JWT_AUTH_REFRESH_COOKIE": "palmgis_refresh_cookie",
    "JWT_AUTH_HTTPONLY": True,
    "JWT_AUTH_SAMESITE": "Lax",
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "core.permissions.IsManagerOrReadOnly",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}
```

**Conséquence côté front React (à retenir pour plus tard) :** chaque appel
API doit inclure `credentials: 'include'` (fetch) ou `withCredentials: true`
(axios), sinon le cookie ne part jamais.

### 2.6 CORS — communication front/back

```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # tout en haut, avant les autres
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
CORS_ALLOW_CREDENTIALS = True   # obligatoire pour que les cookies passent
```

**Pourquoi CORS** : par défaut, un navigateur bloque les requêtes d'un site
(`localhost:3000`, React) vers un autre (`localhost:8000`, Django) pour des
raisons de sécurité. CORS autorise explicitement cet échange.

### 2.7 Fuseau horaire

```python
TIME_ZONE = 'Africa/Casablanca'
USE_TZ = True
```

**Pourquoi `USE_TZ = True` même avec le bon fuseau** : Django stocke
toujours les dates en UTC en base (bonne pratique universelle), et les
convertit uniquement à l'affichage selon `TIME_ZONE`. Sans ce réglage,
les horodatages des interventions agricoles (irrigation, traitement...)
afficheraient une heure décalée par rapport à l'heure réelle au Maroc.

### 2.8 Fichiers statiques et médias

```python
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

`MEDIA_ROOT` est important pour ce projet : c'est là que seront stockées
les photos des palmiers et les pièces jointes des interventions.

---

## Partie 3 — L'app `core` : utilisateurs, rôles, permissions

### 3.1 `core/models.py`

```python
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        MANAGER = "manager", "Gestionnaire"
        VIEWER = "viewer", "Consultant"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class BaseModel(models.Model):
    """Classe abstraite réutilisée par tous les modèles métier."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="%(class)s_created",
    )
                    C'est une clé étrangère qui lie la donnée à l'utilisateur qui l'a créée.

                    on_delete=models.SET_NULL : Si l'utilisateur est supprimé du système, la donnée ne s'efface pas, le champ devient simplement vide (NULL).

                    related_name="%(class)s_created" : C'est une astuce avancée de Django pour les classes abstraites. Elle génère un nom de relation inverse dynamique pour chaque modèle enfant (par exemple, si une classe Batiment hérite de ce modèle, tu pourras faire user.batiment_created.all() pour voir tous les bâtiments créés par cet utilisateur).

    class Meta:
        abstract = True     L'option abstract = True dit à Django : "Ne crée pas de table en base de données pour BaseModel". Ce modèle ne sert que de "moule" ou de modèle parent pour tes autres applications.


class AuditLog(models.Model):
    """Journal des actions sensibles — non encore alimenté automatiquement,
    à connecter plus tard aux vues ou aux signaux Django."""
    class Action(models.TextChoices):
        CREATE = "create", "Création"
        UPDATE = "update", "Modification"
        DELETE = "delete", "Suppression"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=10, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(blank=True, null=True)
```

**Point important : `BaseModel` est abstraite** (`abstract = True` dans sa
`Meta`). Ça veut dire qu'elle ne crée **jamais** de table en base — elle
sert uniquement de "moule" dont héritent les vrais modèles (`Parcelle`,
`Site`...), qui récupèrent automatiquement les champs `created_at`,
`updated_at`, `created_by`.

### 3.2 `core/permissions.py`

```python
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsManagerOrReadOnly(BasePermission):
    """
    Consultant (viewer) : lecture seule (GET, HEAD, OPTIONS)
    Gestionnaire (manager) : accès complet
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_manager
```

Cette permission est déclarée comme **valeur par défaut globale** dans
`REST_FRAMEWORK` (voir partie 2.5) : chaque nouvel endpoint créé est donc
protégé automatiquement, sans devoir y penser à chaque fois.

### 3.3 `core/admin.py`

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AuditLog


class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Rôle", {"fields": ("role",)}),
    )
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = UserAdmin.list_filter + ("role",)


admin.site.register(User, CustomUserAdmin)
admin.site.register(AuditLog)
```

**Piège rencontré :** si ce fichier reste vide, Django n'enregistre jamais
le modèle `User` dans l'interface d'administration — la section "Core"
n'apparaît alors pas du tout dans `/admin/`, même si les migrations ont été
appliquées correctement. Toujours vérifier que `admin.py` n'est pas resté
vide après avoir créé un modèle.

### 3.4 `core/serializers.py`, `views.py`, `urls.py`

```python
# core/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "first_name", "last_name"]
        read_only_fields = ["id"]
```

```python
# core/views.py
from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
```

```python
# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

app_name = "core"
router = DefaultRouter()
router.register("users", UserViewSet, basename="user")

urlpatterns = [path("", include(router.urls))]



[Frontend / React] 
       │ (Ex: GET /api/core/users/)
       ▼
 [core/urls.py] ───► Détecte l'adresse grâce au routeur automatique
       │
       ▼
 [core/views.py] ──► Vérifie que l'utilisateur est bien connecté (IsAuthenticated)
       │             et récupère les données dans la Base (User.objects.all())
       ▼
[core/serializers.py] ► Filtre et traduit les données en JSON propre
       │
       ▼
[Navigateur / Client] Reçoit la liste formatée avec les Rôles de chacun !
```

### 3.5 `urls.py` principal du projet

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api-auth/', include('rest_framework.urls')),

    path('api/', include('core.urls')),
    path('api/', include('parcels.urls')),
    path('api/', include('interventions.urls')),
    path('api/', include('dashboard.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Piège rencontré et règle à retenir sur les imports Python :** les imports
dans le code (`from core.permissions import ...`) doivent toujours être
écrits **relativement à la racine du projet Django** (là où se trouve
`manage.py`), jamais avec le chemin complet du disque
(`from Backend.backend.core...` est incorrect, même si c'est le vrai
chemin sur le disque dur). Bien vérifier les suggestions d'auto-complétion
de l'éditeur, qui peuvent se tromper sur ce point.

### 3.6 Migrations de `core`

```bash
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser
```

**Rappel de l'ordre logique, toujours valable :**
```
1. Écrire le modèle dans models.py
2. makemigrations   → génère le fichier de migration (lit models.py)
3. migrate           → applique réellement les changements en base
```
`makemigrations` ne fait que lire `models.py` : si un modèle n'y est pas
écrit, Django ne peut pas deviner qu'il faut créer une table pour lui.

### 3.7 Assigner le rôle `manager` au compte administrateur

Après connexion sur `/admin/`, aller dans **Core → Users**, ouvrir le
compte créé, changer le champ **Rôle** en **Gestionnaire**, puis
**Save**.

---

## Partie 4 — Problèmes rencontrés et solutions (retour d'expérience)

| # | Erreur | Cause | Solution |
|---|---|---|---|
| 1 | `ModuleNotFoundError: rest_framework_gis` | Package pip non installé | `pip install djangorestframework-gis` |
| 2 | `ModuleNotFoundError: allauth` (après `pip install allauth`) | Mauvais nom de package pip tenté | `pip install django-allauth` — le nom pip et le nom du module Python sont différents |
| 3 | `Could not find the GDAL library` | GDAL non installé au niveau système sous Windows | `conda install -c conda-forge gdal` — plus fiable que pip sous Windows pour les librairies binaires |
| 4 | `UnicodeDecodeError` lors de `makemigrations` | Encodage du terminal Windows (page 850) différent de celui attendu (1252), déclenché par un message d'erreur PostgreSQL contenant un accent | `chcp 65001` dans le terminal avant de lancer les commandes Django |
| 5 | `la colonne core_user.role n'existe pas` | Table créée avant l'ajout du champ `role`, migration désynchronisée de la base réelle | Remise à zéro propre de la base + régénération des migrations (voir 4.1) |
| 6 | `admin.py` vide → section "Core" absente de `/admin/` | Le modèle existe mais n'a jamais été enregistré via `admin.site.register()` | Remplir `admin.py` |
| 7 | `ModuleNotFoundError: core.permissions` puis imports incorrects (`backend.permissions`, `Backend.backend.core.permissions`) | Fichier manquant, puis chemins d'import mal renseignés | Créer le fichier au bon endroit + toujours importer relativement à la racine du projet (`from core.permissions import ...`) |

### 4.1 Remise à zéro propre d'une base désynchronisée

Quand les migrations Django et la structure réelle de la base ne
correspondent plus (et que `makemigrations` ne détecte rien de nouveau
alors qu'une erreur de colonne manquante apparaît), la solution la plus
sûre en phase de développement (peu de données réelles) est de repartir
d'une base vide plutôt que de modifier les tables à la main dans pgAdmin :

```sql
-- Dans psql
DROP DATABASE "Palm_GIS";
CREATE DATABASE "Palm_GIS";
\c "Palm_GIS"
CREATE EXTENSION postgis;
```

```bash
# Supprimer tous les fichiers dans chaque dossier migrations/
# SAUF __init__.py
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

**Pourquoi ne pas juste ajouter la colonne manquante via pgAdmin :** ça
désynchronise l'historique que Django croit avoir appliqué
(`django_migrations`), ce qui peut recasser silencieusement lors d'une
migration future. Les migrations Django doivent rester la seule source de
vérité sur la structure de la base.

---

## Partie 5 — L'app `parcels` : premier modèle géospatial

### 5.1 Le modèle `Parcelle`

```python
# parcels/models.py
from django.contrib.gis.db import models as gis_models
from django.db import models
from core.models import BaseModel


class Parcelle(BaseModel):
    class Statut(models.TextChoices):
        ACTIVE = "active", "Active"
        EN_REPOS = "en_repos", "En repos"
        ABANDONNEE = "abandonnee", "Abandonnée"

    nom = models.CharField(max_length=150)
    geom = gis_models.PolygonField(srid=4326)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.ACTIVE)
    proprietaire = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    superficie_m2 = models.FloatField(editable=False, null=True, blank=True)
    perimetre_m = models.FloatField(editable=False, null=True, blank=True)

    class Meta:
        ordering = ["nom"] Chaque fois que je te demande une liste de ces objets sans préciser de tri particulier, applique automatiquement cette règle".

    def __str__(self):
        return self.nom 
        Chaque fois que tu dois afficher cet objet sous forme de texte, montre simplement la valeur de son champ nom

    def save(self, *args, **kwargs):
        # Reprojection vers une projection métrique marocaine pour un calcul précis
        geom_metric = self.geom.transform(26192, clone=True)  # Merchich / Sud Maroc
        self.superficie_m2 = geom_metric.area
        self.perimetre_m = geom_metric.length
        super().save(*args, **kwargs)

    @property
    def superficie_ha(self):
        return round(self.superficie_m2 / 10000, 3) if self.superficie_m2 else None
```

### 5.2 Pourquoi deux systèmes de coordonnées différents (SRID)

| SRID | Nom | Usage dans ce projet |
|---|---|---|
| `4326` | WGS84 (coordonnées GPS en degrés) | **Stockage** du champ `geom` — standard universel du web, compatible GeoJSON/Leaflet/React |
| `26192` | Merchich / Sud Maroc (mètres) | **Calcul uniquement** (superficie, périmètre) — les degrés ne peuvent pas être utilisés directement pour un calcul d'aire précis |

Le champ `geom` reste toujours stocké en 4326. À chaque sauvegarde, une
copie temporaire de la géométrie est reprojetée en 26192
(`.transform(26192, clone=True)`) uniquement pour calculer `superficie_m2`
et `perimetre_m` en mètres réels — cette copie n'est jamais stockée.

### 5.3 Import de données existantes (Shapefile en EPSG:26192)

Les données de la ferme existent déjà sous forme de Shapefile en
EPSG:26192. Comme la base attend du 4326, une reprojection est nécessaire
au moment de l'import — soit via un script de gestion Django, soit en
reprojetant le fichier au préalable avec `ogr2ogr` :

```bash
ogr2ogr -s_srs EPSG:26192 -t_srs EPSG:4326 parcelles_wgs84.shp parcelles.shp
```

Point de vigilance : toujours vérifier la présence et l'exactitude du
fichier `.prj` accompagnant le `.shp`, qui déclare la projection source.

### 5.4 Serializer GeoJSON

```python
# parcels/serializers.py
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Parcelle

class ParcelleSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Parcelle
        geo_field = "geom"
        fields = [
            "id", "nom", "statut", "proprietaire", "description",
            "superficie_m2", "superficie_ha", "perimetre_m",
            "created_at", "updated_at",
        ]
        read_only_fields = ["superficie_m2", "perimetre_m", "created_at", "updated_at"]
```

`GeoFeatureModelSerializer` produit directement du GeoJSON standard,
directement exploitable par une carte React (Leaflet/MapLibre).

### 5.5 Vue, urls, admin

```python
# parcels/views.py
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsManagerOrReadOnly
from .models import Parcelle
from .serializers import ParcelleSerializer

class ParcelleViewSet(viewsets.ModelViewSet):
    queryset = Parcelle.objects.all()
    serializer_class = ParcelleSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["statut"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
```

```python
# parcels/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParcelleViewSet

app_name = "parcels"
router = DefaultRouter()
router.register("parcelles", ParcelleViewSet, basename="parcelle")

urlpatterns = [path("", include(router.urls))]
```

```python
# parcels/admin.py
from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Parcelle

@admin.register(Parcelle)
class ParcelleAdmin(GISModelAdmin):
    list_display = ["nom", "statut", "superficie_ha", "proprietaire"]
    list_filter = ["statut"]
    search_fields = ["nom", "proprietaire"]
```

`GISModelAdmin` affiche une carte interactive directement dans
l'administration Django, permettant de dessiner/tester des parcelles
sans attendre que le front React soit développé.

### 5.6 Migration

```bash
python manage.py makemigrations parcels
python manage.py migrate
```

---

## Partie 6 — Récapitulatif : état actuel du projet

- [x] Projet Django structuré en 9 apps métier
- [x] Environnement conda `palmgis` avec toutes les dépendances installées
- [x] GDAL/PostGIS fonctionnels
- [x] Base PostgreSQL/PostGIS connectée via `.env`
- [x] Modèle `User` personnalisé avec 2 rôles (`manager`/`viewer`)
- [x] Authentification JWT via cookies httpOnly (`dj-rest-auth`)
- [x] Permission centralisée `IsManagerOrReadOnly` active par défaut
- [x] Compte administrateur créé et rôle `manager` assigné
- [x] Modèle `Parcelle` créé (GeoDjango, calcul auto superficie/périmètre)
- [ ] Import des données réelles (Shapefile EPSG:26192) — à finaliser
- [ ] Modèle `Site` (palmiers) — app `palms`, prochaine étape
- [ ] Modèle `Intervention` — app `interventions`

---

## Partie 7 — Prochaine étape

Développer le modèle `Site` dans l'app `palms` :
- Géométrie `PointField` (SRID 4326)
- Rattachement automatique à la `Parcelle` englobante via une requête
  spatiale PostGIS (`ST_Contains` / méthode `.contains()` de GeoDjango)
- Champs métier : identifiant, variété, âge, état sanitaire, date de
  plantation, observations, photos

---

*Document pédagogique de suivi — à conserver comme référence et à
compléter au fil de l'avancement du projet.*