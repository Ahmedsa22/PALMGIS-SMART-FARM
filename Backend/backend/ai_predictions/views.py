import os
import joblib
import numpy as np
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# ── Chargement des modèles au démarrage (une seule fois)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

try:
    rendement_model  = joblib.load(os.path.join(MODELS_DIR, "rendement_model.pkl"))
    features_list    = joblib.load(os.path.join(MODELS_DIR, "features_list.pkl"))
    groupe_model     = joblib.load(os.path.join(MODELS_DIR, "groupe_model.pkl"))
    groupe_encoder   = joblib.load(os.path.join(MODELS_DIR, "groupe_encoder.pkl"))
    stats_variete    = joblib.load(os.path.join(MODELS_DIR, "stats_variete.pkl"))
    variete_model    = joblib.load(os.path.join(MODELS_DIR, "variete_model.pkl"))
    variete_encoder  = joblib.load(os.path.join(MODELS_DIR, "variete_encoder.pkl"))
    features_cls     = joblib.load(os.path.join(MODELS_DIR, "features_cls_list.pkl"))
    print("✅ Modèles ML chargés")
except Exception as e:
    print(f"❌ Erreur chargement modèles ML: {e}")
    rendement_model = groupe_model = variete_model = None

VARIETES_DISPONIBLES = [
    '16BIS', 'BFGM', 'BSTM-B', 'BSTM-N',
    'BZG', 'IKL', 'NJD', 'SAIR', 'SLY', 'TDMNT'
]


class PredictionRendementView(APIView):
    """
    POST /api/ai/predire/rendement/
    Body : { "variete": "BZG", "nombre_regimes": 8 }
    """

    def post(self, request):
        if rendement_model is None:
            return Response(
                {"error": "Modèle non disponible"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        variete      = request.data.get("variete")
        nb_regimes   = request.data.get("nombre_regimes")

        # Validation
        if not variete or variete not in VARIETES_DISPONIBLES:
            return Response(
                {"error": f"Variété invalide. Choisir parmi : {VARIETES_DISPONIBLES}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not nb_regimes or int(nb_regimes) <= 0:
            return Response(
                {"error": "nombre_regimes doit être > 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            nb_regimes = int(nb_regimes)

            # Construction du vecteur de features
            # (même ordre que features_list)
            row = {f: 0 for f in features_list}

            # NDVI/NDWI → valeurs moyennes de la base (approximation)
            ndvi_moy = 0.35
            ndwi_moy = -0.15
            for col in features_list:
                if col.startswith('NDVI'):
                    row[col] = ndvi_moy
                elif col.startswith('NDWI'):
                    row[col] = ndwi_moy

            # Variété one-hot
            row[variete] = 1

            # Nombre de régimes
            row['Nmbr_Regime'] = nb_regimes

            # Features dérivées
            row['NDVI_moyen']           = ndvi_moy
            row['NDWI_moyen']           = ndwi_moy
            row['NDVI_max']             = ndvi_moy + 0.05
            row['NDVI_variation']       = 0.10
            row['NDVI_ratio_croissance'] = 1.10

            X = pd.DataFrame([row])[features_list]
            prediction = float(rendement_model.predict(X)[0])
            prediction = max(0, round(prediction, 1))

            # Stats historiques de la variété
            stats = {}
            if variete in stats_variete.index:
                s = stats_variete.loc[variete]
                stats = {
                    "production_moyenne_historique": round(float(s['prod_moy_kg']), 1),
                    "production_par_regime_historique": round(float(s['prod_par_regime']), 2),
                    "nb_regimes_moyen_historique": round(float(s['nb_regimes_moyen']), 1),
                    "nb_observations": int(s['nb_observations']),
                }

            return Response({
                "variete":          variete,
                "nombre_regimes":   nb_regimes,
                "rendement_predit": prediction,
                "unite":            "kg",
                "stats_historiques": stats,
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecommandationVarieteView(APIView):
    """
    POST /api/ai/recommander/variete/
    Body : { "nombre_regimes": 8, "production_estimee": 55 }
    """

    def post(self, request):
        if groupe_model is None:
            return Response(
                {"error": "Modèle non disponible"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        nb_regimes         = request.data.get("nombre_regimes")
        production_estimee = request.data.get("production_estimee")

        if not nb_regimes or not production_estimee:
            return Response(
                {"error": "nombre_regimes et production_estimee sont requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            nb_regimes         = float(nb_regimes)
            production_estimee = float(production_estimee)
            prod_par_regime    = production_estimee / nb_regimes

            X = pd.DataFrame([{
                'Nmbr_Regime':    nb_regimes,
                'Pr_kg':          production_estimee,
                'prod_par_regime': prod_par_regime,
            }])

            groupe_enc  = groupe_model.predict(X)[0]
            groupe_nom  = groupe_encoder.inverse_transform([groupe_enc])[0]
            probas      = groupe_model.predict_proba(X)[0]

            # Probabilités par groupe
            groupes_probas = [
                {
                    "groupe":      groupe_encoder.inverse_transform([i])[0],
                    "probabilite": round(float(p) * 100, 1),
                }
                for i, p in enumerate(probas)
            ]
            groupes_probas.sort(key=lambda x: x["probabilite"], reverse=True)

            # Variétés recommandées dans ce groupe
            varietes_groupe = stats_variete[
                stats_variete.index.isin(
                    [v for v in VARIETES_DISPONIBLES
                     if v in stats_variete.index]
                )
            ].copy()

            # Filtre selon le groupe prédit
            seuil_haut = 30.1
            seuil_bas  = 18.4

            if groupe_nom == "Haute performance":
                varietes_rec = varietes_groupe[
                    varietes_groupe['prod_moy_kg'] >= seuil_haut
                ]
            elif groupe_nom == "Moyenne performance":
                varietes_rec = varietes_groupe[
                    (varietes_groupe['prod_moy_kg'] >= seuil_bas) &
                    (varietes_groupe['prod_moy_kg'] < seuil_haut)
                ]
            else:
                varietes_rec = varietes_groupe[
                    varietes_groupe['prod_moy_kg'] < seuil_bas
                ]

            varietes_rec = varietes_rec.sort_values(
                'prod_moy_kg', ascending=False
            )

            recommandations = [
                {
                    "variete":           v,
                    "production_moyenne": round(float(r['prod_moy_kg']), 1),
                    "prod_par_regime":   round(float(r['prod_par_regime']), 2),
                    "nb_observations":   int(r['nb_observations']),
                }
                for v, r in varietes_rec.iterrows()
            ]

            return Response({
                "groupe_predit":    groupe_nom,
                "probabilites":     groupes_probas,
                "recommandations":  recommandations,
                "input": {
                    "nombre_regimes":    nb_regimes,
                    "production_estimee": production_estimee,
                    "prod_par_regime":   round(prod_par_regime, 2),
                }
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StatsVarietesView(APIView):
    """
    GET /api/ai/stats/varietes/
    Retourne le classement historique de toutes les variétés
    """

    def get(self, request):
        if stats_variete is None:
            return Response(
                {"error": "Données non disponibles"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        stats = []
        for variete, row in stats_variete.iterrows():
            prod = float(row['prod_moy_kg'])
            if prod >= 30.1:
                groupe = "Haute performance"
            elif prod >= 18.4:
                groupe = "Moyenne performance"
            else:
                groupe = "Basse performance"

            stats.append({
                "variete":           variete,
                "groupe":            groupe,
                "production_moyenne": round(prod, 1),
                "prod_par_regime":   round(float(row['prod_par_regime']), 2),
                "nb_regimes_moyen":  round(float(row['nb_regimes_moyen']), 1),
                "nb_observations":   int(row['nb_observations']),
            })

        return Response({
            "varietes": stats,
            "seuils": {
                "haute_performance":  30.1,
                "basse_performance":  18.4,
            }
        })