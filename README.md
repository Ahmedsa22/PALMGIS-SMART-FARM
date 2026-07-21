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
