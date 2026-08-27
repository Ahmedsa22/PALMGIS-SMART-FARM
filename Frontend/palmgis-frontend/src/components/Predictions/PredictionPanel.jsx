import { useState, useEffect } from "react";
import {
  ChevronLeft, TrendingUp, Leaf, BarChart2,
  CheckCircle2, AlertTriangle, X,
} from "lucide-react";
import api from "../../api/axios";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";

const VARIETES = [
  "16BIS", "BFGM", "BSTM-B", "BSTM-N",
  "BZG", "IKL", "NJD", "SAIR", "SLY", "TDMNT"
];

const COULEUR_GROUPE = {
  "Haute performance":   theme.colors.success,
  "Moyenne performance": theme.colors.warning,
  "Basse performance":   theme.colors.danger,
};

export default function PredictionPanel({ parcelle, onCancel }) {
  const p          = parcelle?.properties;
  const parcelleId = parcelle?.properties?.id ?? parcelle?.id;

  // ── Onglet actif
  const [onglet, setOnglet] = useState("rendement"); // "rendement" | "variete" | "stats"

  // ── Prédiction rendement
  const [variete,    setVariete]    = useState("BZG");
  const [nbRegimes,  setNbRegimes]  = useState(8);
  const [resultRend, setResultRend] = useState(null);
  const [loadingRend, setLoadingRend] = useState(false);
  const [errorRend,  setErrorRend]  = useState(null);

  // ── Recommandation variété
  const [nbRegimesRec,  setNbRegimesRec]  = useState(8);
  const [productionEst, setProductionEst] = useState(50);
  const [resultRec,     setResultRec]     = useState(null);
  const [loadingRec,    setLoadingRec]    = useState(false);
  const [errorRec,      setErrorRec]      = useState(null);

  // ── Stats variétés
  const [statsVarietes, setStatsVarietes] = useState(null);
  const [loadingStats,  setLoadingStats]  = useState(false);

  // Charge les stats au montage
  useEffect(() => {
    async function chargerStats() {
      setLoadingStats(true);
      try {
        const resp = await api.get("/ai/stats/varietes/");
        setStatsVarietes(resp.data);
      } catch (err) {
        console.error("Erreur stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    chargerStats();
  }, []);

  // ── Prédire le rendement
  async function handlePredireRendement(e) {
    e.preventDefault();
    setLoadingRend(true);
    setErrorRend(null);
    setResultRend(null);
    try {
      const resp = await api.post("/ai/predire/rendement/", {
        variete,
        nombre_regimes: parseInt(nbRegimes),
      });
      setResultRend(resp.data);
    } catch (err) {
      setErrorRend(
        err.response?.data?.error || "Erreur lors de la prédiction."
      );
    } finally {
      setLoadingRend(false);
    }
  }

  // ── Recommander une variété
  async function handleRecommander(e) {
    e.preventDefault();
    setLoadingRec(true);
    setErrorRec(null);
    setResultRec(null);
    try {
      const resp = await api.post("/ai/recommander/variete/", {
        nombre_regimes:    parseInt(nbRegimesRec),
        production_estimee: parseFloat(productionEst),
      });
      setResultRec(resp.data);
    } catch (err) {
      setErrorRec(
        err.response?.data?.error || "Erreur lors de la recommandation."
      );
    } finally {
      setLoadingRec(false);
    }
  }

  return (
    <div style={{ padding: 16, height: "100%", overflowY: "auto" }}>

      {/* En-tête */}
      <button
        onClick={onCancel}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "none", border: "none", cursor: "pointer",
          fontSize: theme.font.size.xs, color: theme.colors.textSecondary,
          marginBottom: 12, padding: "4px 0", fontWeight: 600,
        }}
      >
        <ChevronLeft size={14} /> Retour
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <TrendingUp size={16} color={theme.colors.primary} />
        <h2 style={{
          fontSize: theme.font.size.base, fontWeight: 700,
          color: theme.colors.text,
        }}>
          Prédiction & Recommandation
        </h2>
      </div>

      {p?.nom && (
        <p style={{
          fontSize: theme.font.size.xs, color: theme.colors.textMuted,
          marginBottom: 16,
        }}>
          Parcelle : {p.nom}
        </p>
      )}

      {/* Onglets */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 16,
        borderBottom: `1px solid ${theme.colors.border}`,
      }}>
        {[
          { id: "rendement", label: "Rendement", icon: TrendingUp },
          { id: "variete",   label: "Variété",   icon: Leaf       },
          { id: "stats",     label: "Classement", icon: BarChart2  },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 10px", background: "none", cursor: "pointer",
              border: "none",
              borderBottom: `2px solid ${onglet === id
                ? theme.colors.primary : "transparent"}`,
              color: onglet === id
                ? theme.colors.primary : theme.colors.textSecondary,
              fontSize: theme.font.size.xs, fontWeight: 600,
              marginBottom: -1,
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── Onglet Rendement ── */}
      {onglet === "rendement" && (
        <div>
          <p style={{
            fontSize: theme.font.size.xs, color: theme.colors.textMuted,
            marginBottom: 12,
          }}>
            Estimez la production d'un palmier selon sa variété
            et son nombre de régimes.
          </p>

          <form onSubmit={handlePredireRendement}>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Variété</label>
              <select
                value={variete}
                onChange={e => setVariete(e.target.value)}
                style={inputStyle}
              >
                {VARIETES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nombre de régimes</label>
              <input
                type="number" min="1" max="30"
                value={nbRegimes}
                onChange={e => setNbRegimes(e.target.value)}
                style={inputStyle}
              />
            </div>

            {errorRend && <MessageBox type="error" text={errorRend} />}

            <Button
              type="submit"
              variant="primary"
              disabled={loadingRend}
              style={{ width: "100%" }}
            >
              {loadingRend ? "Calcul en cours..." : "Prédire le rendement"}
            </Button>
          </form>

          {/* Résultat rendement */}
          {resultRend && (
            <div style={{
              marginTop: 16,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              overflow: "hidden",
            }}>
              {/* Résultat principal */}
              <div style={{
                backgroundColor: theme.colors.primary,
                padding: "14px 16px", textAlign: "center",
              }}>
                <p style={{
                  fontSize: theme.font.size.xs, color: "rgba(255,255,255,0.7)",
                  marginBottom: 4,
                }}>
                  Production prédite — {resultRend.variete}
                </p>
                <p style={{
                  fontSize: "28px", fontWeight: 700, color: "white",
                }}>
                  {resultRend.rendement_predit} kg
                </p>
                <p style={{
                  fontSize: theme.font.size.xs, color: "rgba(255,255,255,0.7)",
                }}>
                  pour {resultRend.nombre_regimes} régime(s)
                </p>
              </div>

              {/* Stats historiques */}
              {resultRend.stats_historiques && (
                <div style={{ padding: "12px 14px" }}>
                  <p style={{
                    fontSize: "11px", fontWeight: 600,
                    color: theme.colors.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}>
                    Historique {resultRend.variete}
                  </p>
                  {[
                    {
                      label: "Production moy.",
                      value: `${resultRend.stats_historiques.production_moyenne_historique} kg`,
                    },
                    {
                      label: "Par régime",
                      value: `${resultRend.stats_historiques.production_par_regime_historique} kg`,
                    },
                    {
                      label: "Régimes moy.",
                      value: resultRend.stats_historiques.nb_regimes_moyen_historique,
                    },
                    {
                      label: "Observations",
                      value: resultRend.stats_historiques.nb_observations,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      fontSize: theme.font.size.xs,
                    }}>
                      <span style={{ color: theme.colors.textSecondary }}>
                        {label}
                      </span>
                      <span style={{ fontWeight: 600, color: theme.colors.text }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Variété ── */}
      {onglet === "variete" && (
        <div>
          <p style={{
            fontSize: theme.font.size.xs, color: theme.colors.textMuted,
            marginBottom: 12,
          }}>
            Entrez les caractéristiques de votre parcelle pour obtenir
            une recommandation de variété à implanter.
          </p>

          <form onSubmit={handleRecommander}>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Nombre de régimes attendu</label>
              <input
                type="number" min="1" max="30"
                value={nbRegimesRec}
                onChange={e => setNbRegimesRec(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Production estimée (kg)</label>
              <input
                type="number" min="1" max="90"
                value={productionEst}
                onChange={e => setProductionEst(e.target.value)}
                style={inputStyle}
              />
            </div>

            {errorRec && <MessageBox type="error" text={errorRec} />}

            <Button
              type="submit"
              variant="primary"
              disabled={loadingRec}
              style={{ width: "100%" }}
            >
              {loadingRec ? "Analyse en cours..." : "Recommander une variété"}
            </Button>
          </form>

          {/* Résultat recommandation */}
          {resultRec && (
            <div style={{ marginTop: 16 }}>

              {/* Groupe prédit */}
              <div style={{
                border: `2px solid ${COULEUR_GROUPE[resultRec.groupe_predit]}`,
                borderRadius: theme.radius.md,
                padding: "12px 14px",
                marginBottom: 12,
                backgroundColor: `${COULEUR_GROUPE[resultRec.groupe_predit]}15`,
              }}>
                <p style={{
                  fontSize: "11px", fontWeight: 600,
                  color: theme.colors.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  marginBottom: 4,
                }}>
                  Groupe prédit
                </p>
                <p style={{
                  fontSize: theme.font.size.lg, fontWeight: 700,
                  color: COULEUR_GROUPE[resultRec.groupe_predit],
                }}>
                  {resultRec.groupe_predit}
                </p>

                {/* Probabilités */}
                <div style={{ marginTop: 8 }}>
                  {resultRec.probabilites.map(({ groupe, probabilite }) => (
                    <div key={groupe} style={{ marginBottom: 6 }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: theme.font.size.xs, marginBottom: 2,
                      }}>
                        <span style={{ color: theme.colors.textSecondary }}>
                          {groupe}
                        </span>
                        <span style={{ fontWeight: 600, color: theme.colors.text }}>
                          {probabilite}%
                        </span>
                      </div>
                      <div style={{
                        height: 4, borderRadius: 2,
                        backgroundColor: theme.colors.border,
                      }}>
                        <div style={{
                          height: 4, borderRadius: 2,
                          width: `${probabilite}%`,
                          backgroundColor: COULEUR_GROUPE[groupe] || theme.colors.primary,
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variétés recommandées */}
              <p style={{
                fontSize: "11px", fontWeight: 600,
                color: theme.colors.textMuted,
                textTransform: "uppercase", letterSpacing: "0.5px",
                marginBottom: 8,
              }}>
                Variétés recommandées
              </p>

              {resultRec.recommandations.map((rec, i) => (
                <div key={rec.variete} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  backgroundColor: i === 0 ? `${theme.colors.primary}10` : theme.colors.surface,
                  border: `1px solid ${i === 0 ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  marginBottom: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {i === 0 && (
                      <CheckCircle2 size={14} color={theme.colors.primary} />
                    )}
                    <div>
                      <p style={{
                        fontSize: theme.font.size.sm, fontWeight: 700,
                        color: i === 0 ? theme.colors.primary : theme.colors.text,
                      }}>
                        {rec.variete}
                      </p>
                      <p style={{
                        fontSize: "11px", color: theme.colors.textMuted,
                      }}>
                        {rec.prod_par_regime} kg/régime
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{
                      fontSize: theme.font.size.sm, fontWeight: 700,
                      color: theme.colors.text,
                    }}>
                      {rec.production_moyenne} kg
                    </p>
                    <p style={{
                      fontSize: "11px", color: theme.colors.textMuted,
                    }}>
                      moy. historique
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Stats ── */}
      {onglet === "stats" && (
        <div>
          <p style={{
            fontSize: theme.font.size.xs, color: theme.colors.textMuted,
            marginBottom: 12,
          }}>
            Classement des variétés par performance agronomique
            sur 10 ans d'observations.
          </p>

          {loadingStats && (
            <p style={{
              textAlign: "center", color: theme.colors.textMuted,
              fontSize: theme.font.size.xs, padding: 16,
            }}>
              Chargement...
            </p>
          )}

          {statsVarietes && (
            <>
              {/* Seuils */}
              <div style={{
                display: "flex", gap: 6, marginBottom: 12,
                flexWrap: "wrap",
              }}>
                {[
                  { label: "Haute",   color: theme.colors.success, seuil: `≥ ${statsVarietes.seuils.haute_performance} kg` },
                  { label: "Moyenne", color: theme.colors.warning, seuil: `${statsVarietes.seuils.basse_performance}–${statsVarietes.seuils.haute_performance} kg` },
                  { label: "Basse",   color: theme.colors.danger,  seuil: `< ${statsVarietes.seuils.basse_performance} kg` },
                ].map(({ label, color, seuil }) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: "11px", color: theme.colors.textSecondary,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      backgroundColor: color,
                    }} />
                    {label} : {seuil}
                  </div>
                ))}
              </div>

              {/* Liste variétés */}
              {statsVarietes.varietes.map((v, i) => {
                const couleur = COULEUR_GROUPE[v.groupe] || theme.colors.textMuted;
                const maxProd = statsVarietes.varietes[0].production_moyenne;
                const pct     = (v.production_moyenne / maxProd) * 100;

                return (
                  <div key={v.variete} style={{
                    padding: "8px 10px",
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 4,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: "11px", fontWeight: 700,
                          color: theme.colors.textMuted, width: 18,
                        }}>
                          {i + 1}.
                        </span>
                        <span style={{
                          fontSize: theme.font.size.sm, fontWeight: 600,
                          color: theme.colors.text,
                        }}>
                          {v.variete}
                        </span>
                        <span style={{
                          fontSize: "10px", fontWeight: 600,
                          color: couleur, textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}>
                          {v.groupe.split(" ")[0]}
                        </span>
                      </div>
                      <span style={{
                        fontSize: theme.font.size.sm, fontWeight: 700,
                        color: theme.colors.text,
                      }}>
                        {v.production_moyenne} kg
                      </span>
                    </div>

                    {/* Barre de progression */}
                    <div style={{
                      height: 4, borderRadius: 2,
                      backgroundColor: theme.colors.border,
                      marginLeft: 24,
                    }}>
                      <div style={{
                        height: 4, borderRadius: 2,
                        width: `${pct}%`,
                        backgroundColor: couleur,
                      }} />
                    </div>

                    <p style={{
                      fontSize: "11px", color: theme.colors.textMuted,
                      marginTop: 3, marginLeft: 24,
                    }}>
                      {v.prod_par_regime} kg/régime · {v.nb_observations} obs.
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBox({ type, text }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 6,
      borderLeft: `3px solid ${type === "error" ? theme.colors.danger : theme.colors.success}`,
      backgroundColor: type === "error" ? "#FEF2F2" : "#F0FDF4",
      borderRadius: theme.radius.sm, padding: "8px 10px",
      marginBottom: 12, fontSize: theme.font.size.xs,
      color: type === "error" ? theme.colors.danger : theme.colors.success,
    }}>
      {type === "error"
        ? <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        : <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      }
      {text}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px",
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.borderStrong}`,
  fontSize: theme.font.size.sm, boxSizing: "border-box",
  backgroundColor: theme.colors.surface, outline: "none",
  fontFamily: theme.font.family,
};

const labelStyle = {
  display: "block", fontSize: theme.font.size.xs,
  fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 4,
};