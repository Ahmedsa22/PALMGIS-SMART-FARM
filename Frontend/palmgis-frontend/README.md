# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.






#####

# 🌴 PalmGIS Smart Farm

Plateforme SIG web de gestion intelligente d'une palmeraie dattière.
Développée dans le cadre d'un projet de fin d'études en géoinformation — Domaine Expérimental de Zagora, INRA Maroc.

---

## Fonctionnalités

- Cartographie interactive des parcelles et palmiers (MapLibre GL JS)
- Suivi sanitaire individuel de chaque palmier
- Gestion des interventions agronomiques
- Notifications automatiques et manuelles
- Génération de cartes PDF (GeoServer + ReportLab)
- Télédétection Sentinel-2 (NDVI, NDWI, SAVI)
- Comparaison temporelle des indices spectraux
- Prédiction du rendement et recommandation de variété (Machine Learning)
- Gestion des utilisateurs (Manager / Viewer)

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — gratuit, Windows / Mac / Linux
- Git (optionnel — tu peux aussi télécharger le ZIP depuis GitHub)
- 4 Go de RAM disponibles pour Docker
- 5 Go d'espace disque libre

---

## Installation

### 1. Clone le projet

```bash
git clone https://github.com/Ahmedsa22/PALMGIS-SMART-FARM
cd PALMGIS-SMART-FARM
```

Ou télécharge le ZIP depuis GitHub → **Code** → **Download ZIP** → décompresse.

### 2. Configure les variables d'environnement

```bash
copy .env.example .env
```

Ouvre `.env` et remplis les valeurs :

```env
SECRET_KEY=une-cle-longue-et-aleatoire-minimum-50-caracteres
DB_NAME=Palm_GIS
DB_USER=postgres
DB_PASSWORD=choisis-un-mot-de-passe
DB_HOST=db
DB_PORT=5432
GEOSERVER_PASSWORD=choisis-un-mot-de-passe-geoserver
COPERNICUS_USER=ton-email@gmail.com
COPERNICUS_PASSWORD=ton-mot-de-passe-copernicus
DOCKER_ENV=true
```

> Pour Copernicus : crée un compte gratuit sur https://dataspace.copernicus.eu

### 3. Lance l'application

```bash
docker-compose up -d
```

Le premier démarrage télécharge les images Docker (~1.5 Go) — patiente 10-15 minutes selon ta connexion.

### 4. Restaure les données

```bash
docker-compose exec backend bash -c "PGPASSWORD=ton-mot-de-passe pg_restore -h db -p 5432 -U postgres -d Palm_GIS --no-owner --no-privileges /app/palmgis_backup.dump"
```

### 5. Crée ton compte administrateur

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 6. Configure le rôle Manager

```bash
docker-compose exec backend python manage.py shell -c "from core.models import User; u = User.objects.get(username='TON_USERNAME'); u.role = 'manager'; u.save(); print('OK')"
```

### 7. Ouvre l'application

http://localhost



---

## Accès aux services

| Service | URL | Identifiants |
|---|---|---|
| Application | http://localhost | Ton compte créé à l'étape 5 |
| API Django | http://localhost:8000/api/ | — |
| GeoServer | http://localhost:8080/geoserver | admin / ton GEOSERVER_PASSWORD |
| Admin Django | http://localhost:8000/admin | Ton superuser |

---

## Commandes utiles

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f backend

# Redémarrer le backend
docker-compose restart backend

# Sauvegarder la base de données
docker-compose exec db bash -c "PGPASSWORD=ton-mot-de-passe pg_dump -U postgres Palm_GIS -F c -f /tmp/backup.dump"
docker cp palmgis_db:/tmp/backup.dump ./backup.dump
```

> ⚠️ Ne jamais faire `docker-compose down -v` — cela supprime toutes les données.

---

## Configuration GeoServer

Après le premier démarrage, configure GeoServer pour afficher les couches :

1. Ouvre http://localhost:8080/geoserver
2. Connecte-toi avec `admin` / ton `GEOSERVER_PASSWORD`
3. Crée le workspace `palmgis`
4. Ajoute le store PostGIS :
   - Host : `db`
   - Port : `5432`
   - Database : `Palm_GIS`
   - User : `postgres`
   - Password : ton `DB_PASSWORD`
5. Publie les couches `parcelles` et `palmiers`
6. Applique les styles SLD (disponibles dans `geoserver/styles/`)

---

## Structure du projet

PALMGIS-SMART-FARM/
├── docker-compose.yml
├── .env.example
├── README.md
├── docker/
│ └── init-db.sh
├── Backend/
│ └── backend/
│ ├── Dockerfile
│ ├── requirements.txt
│ ├── palmgis_backup.dump
│ └── ai_predictions/models/ ← modèles ML
└── Frontend/
└── palmgis-frontend/
├── Dockerfile
└── nginx.conf


---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite + MapLibre GL JS |
| Backend | Django 5.2 + GeoDjango + DRF |
| Base de données | PostgreSQL 15 + PostGIS |
| Serveur carto | GeoServer 2.23 |
| Télédétection | rasterio + numpy + Copernicus API |
| Machine Learning | scikit-learn + Random Forest |
| Rapports PDF | ReportLab |
| Conteneurisation | Docker + Docker Compose |

---

## Développé par

Ahmed Sabbar — Étudiant ingénieur en géoinformation  
Projet de fin d'études — INRA Domaine Expérimental de Zagora, Maroc  
2025-2026

