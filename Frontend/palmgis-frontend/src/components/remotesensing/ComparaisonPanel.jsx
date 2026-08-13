import { useState, useEffect } from "react";
import {
  BarChart3, X, LandPlot, Calendar, Cloud, AlertTriangle, Info,
  ArrowUp, ArrowDown, ArrowRight, Images,
} from "lucide-react";
import api from "../../api/axios";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";
import { SectionTitle } from "../ui/Badge";

export default function ComparaisonPanel({ parcelle, onCancel }) {
  const p = parcelle.properties;

  const [historique, setHistorique]       = useState([]);
  const [image1, setImage1]               = useState("");
  const [image2, setImage2]               = useState("");
  const [indice, setIndice]               = useState("ndvi");
  const [resultat, setResultat]           = useState(null);
  const [isComparing, setIsComparing]     = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState(null);


  // Charge l'historique des images calculées
  useEffect(() => {
    async function charger() {
      try {
        const resp = await api.get(
          `/remote-sensing/historique/${p.id}/`
        );
        setHistorique(resp.data.images || []);
      } catch (err) {
        setError("Erreur chargement historique");
      } finally {
        setIsLoading(false);
      }
    }
    charger();
  }, [p.id]);

  async function handleComparer(e) {
    e.preventDefault();
    if (!image1 || !image2 || image1 === image2) {
      setError("Sélectionne deux images différentes");
      return;
    }

    setIsComparing(true);
    setError(null);
    setResultat(null);

    try {
      const resp = await api.post("/remote-sensing/comparer/", {
        parcelle_id: p.id,
        image_id_1:  parseInt(image1),
        image_id_2:  parseInt(image2),
        indice,
      });
      setResultat(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la comparaison");
    } finally {
      setIsComparing(false);
    }
  }

  const couleurEvol = (val) => {
    if (val === null || val === undefined) return theme.colors.textMuted;
    if (val > 5)  return theme.colors.success;
    if (val > 0)  return theme.colors.santeBon;
    if (val > -5) return theme.colors.warning;
    return theme.colors.danger;
  };

  const FlecheEvol = ({ val }) => {
    if (val === null || val === undefined) return <ArrowRight size={12} />;
    return val > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <div>
          <SectionTitle style={{ marginBottom: 4 }}>Remote Sensing</SectionTitle>
          <h2 style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: theme.font.size.base, fontWeight: 700, color: theme.colors.text,
          }}>
            <BarChart3 size={16} color={theme.colors.primary} /> Comparaison temporelle
          </h2>
        </div>
        <button onClick={onCancel} style={closeButtonStyle}>
          <X size={18} />
        </button>
      </div>

      {/* Contexte */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, padding: "8px 12px",
        marginBottom: 16, fontSize: theme.font.size.sm, color: theme.colors.textSecondary,
      }}>
        <LandPlot size={14} color={theme.colors.textMuted} />
        Parcelle : <strong style={{ color: theme.colors.text }}>{p.nom}</strong>
        {historique.length > 0 && (
          <span>— {historique.length} analyse(s) disponible(s)</span>
        )}
      </div>

      {isLoading ? (
        <p style={{ textAlign: "center", color: theme.colors.textMuted, padding: 16, fontSize: theme.font.size.sm }}>
          Chargement de l'historique...
        </p>
      ) : historique.length < 2 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          textAlign: "center", padding: 24,
          border: `1px solid ${theme.colors.border}`,
          borderLeft: `3px solid ${theme.colors.warning}`,
          borderRadius: theme.radius.sm,
        }}>
          <AlertTriangle size={20} color={theme.colors.warning} />
          <p style={{ fontSize: theme.font.size.sm, color: theme.colors.text, fontWeight: 600 }}>
            Il faut au moins 2 analyses terminées pour comparer.
          </p>
          <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textSecondary }}>
            Va dans l'onglet « Analyse » pour télécharger des images
            Sentinel-2 supplémentaires.
          </p>
        </div>
      ) : (
        <form onSubmit={handleComparer}>

          {/* Sélection des images */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Image — Période 1</label>
            <select
              value={image1}
              onChange={e => setImage1(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Sélectionne une date...</option>
              {historique.map(img => (
                <option key={img.id} value={img.id}>
                  {img.date} — {img.nuage_pct?.toFixed(1)}% nuages
                  {img.ndvi_mean ? ` — NDVI: ${img.ndvi_mean?.toFixed(3)}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Image — Période 2</label>
            <select
              value={image2}
              onChange={e => setImage2(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Sélectionne une date...</option>
              {historique.map(img => (
                <option key={img.id} value={img.id}>
                  {img.date} — {img.nuage_pct?.toFixed(1)}% nuages
                  {img.ndvi_mean ? ` — NDVI: ${img.ndvi_mean?.toFixed(3)}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Indice */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Indice à comparer</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["ndvi", "ndwi", "savi"].map(ind => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndice(ind)}
                  style={{
                    flex: 1, padding: "6px",
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${indice === ind ? theme.colors.primary : theme.colors.border}`,
                    backgroundColor: indice === ind ? theme.colors.primary : theme.colors.surface,
                    color: indice === ind ? "white" : theme.colors.textSecondary,
                    cursor: "pointer", fontSize: theme.font.size.xs, fontWeight: 600,
                  }}
                >
                  {ind.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={errorBoxStyle}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            icon={BarChart3}
            disabled={isComparing || !image1 || !image2}
            style={{ marginBottom: 16 }}
          >
            {isComparing ? "Comparaison..." : "Comparer"}
          </Button>
        </form>
      )}

      {/* ── Résultats de comparaison ── */}
      {resultat && (
        <div>

          {/* Tableau comparatif */}
          <div style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: 12,
            marginBottom: 12,
          }}>
            <SectionTitle style={{ marginBottom: 8 }}>
              {resultat.indice} — Comparaison
            </SectionTitle>

            {/* En-têtes */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 4, fontSize: "10px",
              fontWeight: 700, color: theme.colors.textMuted,
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              <span>Stat</span>
              <span style={{ textAlign: "center" }}>
                {resultat.image_1.date}
              </span>
              <span style={{ textAlign: "center" }}>
                {resultat.image_2.date}
              </span>
              <span style={{ textAlign: "center" }}>Évol.</span>
            </div>

            {/* Lignes */}
            {[
              { label: "Moyenne", key: "mean", evol: resultat.evolution.mean },
              { label: "Min",     key: "min",  evol: resultat.evolution.min  },
              { label: "Max",     key: "max",  evol: resultat.evolution.max  },
            ].map(({ label, key, evol }) => (
              <div key={key} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 4, fontSize: theme.font.size.sm,
                padding: "6px 0",
                borderBottom: `1px solid ${theme.colors.border}`,
              }}>
                <span style={{ color: theme.colors.textSecondary }}>{label}</span>
                <span style={{ textAlign: "center", fontWeight: 600 }}>
                  {resultat.image_1[key]?.toFixed(3) ?? "—"}
                </span>
                <span style={{ textAlign: "center", fontWeight: 600 }}>
                  {resultat.image_2[key]?.toFixed(3) ?? "—"}
                </span>
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
                  fontWeight: 700,
                  color: couleurEvol(evol),
                }}>
                  <FlecheEvol val={evol} /> {evol !== null ? `${evol}%` : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Graphique barres simulé en CSS */}
          <div style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: 12,
            marginBottom: 12,
          }}>
            <SectionTitle style={{ marginBottom: 12 }}>Graphique comparatif</SectionTitle>

            {[
              { label: "Moyenne", v1: resultat.image_1.mean, v2: resultat.image_2.mean },
              { label: "Min",     v1: resultat.image_1.min,  v2: resultat.image_2.min  },
              { label: "Max",     v1: resultat.image_1.max,  v2: resultat.image_2.max  },
            ].map(({ label, v1, v2 }) => {
              const max_val = Math.max(Math.abs(v1 || 0), Math.abs(v2 || 0), 0.1);
              const pct1 = Math.abs((v1 || 0) / max_val * 100);
              const pct2 = Math.abs((v2 || 0) / max_val * 100);
              return (
                <div key={label} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginBottom: 4 }}>
                    {label}
                  </p>
                  {/* Période 1 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: "10px", color: theme.colors.textMuted, width: 60 }}>
                      {resultat.image_1.date.slice(0, 4)}
                    </span>
                    <div style={barTrackStyle}>
                      <div style={{
                        width: `${pct1}%`, height: "100%",
                        backgroundColor: theme.colors.primary,
                        borderRadius: 6,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 600, width: 40 }}>
                      {v1?.toFixed(3)}
                    </span>
                  </div>
                  {/* Période 2 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "10px", color: theme.colors.textMuted, width: 60 }}>
                      {resultat.image_2.date.slice(0, 4)}
                    </span>
                    <div style={barTrackStyle}>
                      <div style={{
                        width: `${pct2}%`, height: "100%",
                        backgroundColor: theme.colors.accent,
                        borderRadius: 6,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 600, width: 40 }}>
                      {v2?.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Légende */}
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: theme.colors.primary }} />
                <span style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                  {resultat.image_1.date}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: theme.colors.accent }} />
                <span style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                  {resultat.image_2.date}
                </span>
              </div>
            </div>
          </div>

          {/* Images côte à côte */}
          <div style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: 12,
            marginBottom: 12,
          }}>
            <p style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: theme.font.size.xs, fontWeight: 700,
              color: theme.colors.textMuted, textTransform: "uppercase", letterSpacing: "1px",
              marginBottom: 8,
            }}>
              <Images size={13} /> Cartes {resultat.indice} côte à côte
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <p style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginBottom: 4,
                }}>
                  <Calendar size={11} /> {resultat.image_1.date}
                </p>
                <img
                  src={resultat.image_1.chemin_png}
                  alt={`${resultat.indice} ${resultat.image_1.date}`}
                  style={{
                    width: "100%", borderRadius: theme.radius.md,
                    border: `2px solid ${theme.colors.primary}`,
                  }}
                />
              </div>
              <div>
                <p style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginBottom: 4,
                }}>
                  <Calendar size={11} /> {resultat.image_2.date}
                </p>
                <img
                  src={resultat.image_2.chemin_png}
                  alt={`${resultat.indice} ${resultat.image_2.date}`}
                  style={{
                    width: "100%", borderRadius: theme.radius.md,
                    border: `2px solid ${theme.colors.accent}`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Interprétation */}
          {resultat.interpretation && (
            <div style={{
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `3px solid ${theme.colors.info}`,
              borderRadius: theme.radius.sm, padding: 12,
            }}>
              <p style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: theme.font.size.xs, fontWeight: 700,
                color: theme.colors.info, marginBottom: 6,
              }}>
                <Info size={13} /> Interprétation de la tendance
              </p>
              <p style={{ fontSize: theme.font.size.sm, color: theme.colors.textSecondary }}>
                {resultat.interpretation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px",
  borderRadius: theme.radius.md, border: `1px solid ${theme.colors.borderStrong}`,
  fontSize: theme.font.size.sm, boxSizing: "border-box",
  backgroundColor: theme.colors.surface, outline: "none",
  fontFamily: theme.font.family,
};

const labelStyle = {
  display: "block", fontSize: theme.font.size.xs,
  fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 4,
};

const closeButtonStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "none",
  cursor: "pointer", color: theme.colors.textMuted,
  width: 28, height: 28,
};

const errorBoxStyle = {
  display: "flex", alignItems: "flex-start", gap: 6,
  borderLeft: `3px solid ${theme.colors.danger}`,
  backgroundColor: "#FEF2F2",
  borderRadius: theme.radius.sm,
  padding: "8px 10px",
  marginBottom: 12, fontSize: theme.font.size.xs, color: theme.colors.danger,
};

const barTrackStyle = {
  flex: 1, height: 10,
  backgroundColor: theme.colors.border, borderRadius: 6,
  overflow: "hidden",
};
