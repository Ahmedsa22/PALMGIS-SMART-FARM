# PALMGIS-SMART-FARM
Plateforme SIG intelligente pour la gestion d'une ferme de palmiers — cartographie, suivi agricole, télédétection satellite et prédiction de rendement par IA. React · Django · GeoDjango · PostGIS
# 🌴 PalmGIS Smart Farm

Plateforme web SIG (Système d'Information Géographique) intelligente pour 
la gestion complète d'une ferme de palmiers dattiers. Centralise les 
données spatiales de l'exploitation, automatise le suivi agricole, exploite 
la télédétection satellitaire et l'intelligence artificielle pour l'aide 
à la décision.

## Fonctionnalités principales

- 🗺️ **Cartographie interactive** des parcelles et palmiers (import 
  Shapefile/GeoJSON, calcul automatique de superficie/périmètre)
- 🌱 **Suivi individuel des palmiers** géolocalisés (variété, âge, état 
  sanitaire, historique)
- 📋 **Gestion des interventions agricoles** (irrigation, fertilisation, 
  traitements, récoltes)
- 🔔 **Notifications intelligentes** pour les opérations planifiées
- 🛰️ **Analyse satellitaire** (indices NDVI, NDWI, SAVI via Sentinel)
- 🤖 **Prédiction de rendement** par Machine Learning et recommandations 
  agronomiques
- 📊 **Tableau de bord** de pilotage de l'exploitation
- 📄 **Rapports PDF et cartes imprimables**

## Stack technique

| Couche | Technologie |
|---|---|
| Front-end | React |
| Back-end | Django · Django REST Framework |
| Géospatial | GeoDjango |
| Base de données | PostgreSQL · PostGIS |
| Authentification | dj-rest-auth (JWT via cookies httpOnly) |
| Télédétection | Sentinel Hub / Copernicus |
| Machine Learning | scikit-learn / XGBoost |






## DOCKER

# PalmGIS Smart Farm

Plateforme SIG de gestion d'une palmeraie dattière — Zagora, Maroc.

## Prérequis

- Docker Desktop : https://www.docker.com/products/docker-desktop/
- 4 Go de RAM minimum disponibles pour Docker

## Installation (5 minutes)

### 1. Télécharge le projet
git clone https://github.com/Ahmedsa22/PALMGIS-SMART-FARM
cd PALMGIS-SMART-FARM

### 2. Configure les variables
cp .env.example .env
# Ouvre .env et modifie les mots de passe si nécessaire

### 3. Lance l'application
docker-compose up -d

### 4. Attends 2-3 minutes le démarrage complet
docker-compose logs -f backend

### 5. Ouvre dans le navigateur
http://localhost

## Compte par défaut

Crée le compte admin après le premier démarrage :
docker-compose exec backend python manage.py createsuperuser

## Commandes utiles

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Arrêter et supprimer les données
docker-compose down -v

# Redémarrer
docker-compose restart
