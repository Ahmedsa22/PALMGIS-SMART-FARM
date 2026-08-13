import { useState, useEffect } from "react";
import api from "../../api/axios";

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
    if (val === null || val === undefined) return "#6b7280";
    if (val > 5)  return "#22c55e";
    if (val > 0)  return "#86efac";
    if (val > -5) return "#f97316";
    return "#ef4444";
  };

  const fleche = (val) => {
    if (val === null || val === undefined) return "→";
    if (val > 0) return "↑";
    return "↓";
  };

  const inputStyle = {
    width: "100%", padding: "0.4rem 0.6rem",
    borderRadius: "0.4rem", border: "1px solid #d1d5db",
    fontSize: "0.8rem", boxSizing: "border-box",
    backgroundColor: "white",
  };

  const labelStyle = {
    display: "block", fontSize: "0.75rem",
    fontWeight: 600, color: "#374151", marginBottom: "0.2rem",
  };

  return (
    <div style={{ padding: "1rem", overflowY: "auto", height: "100%" }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem",
      }}>
        <div>
          <p style={{
            fontSize: "0.7rem", color: "#9ca3af",
            textTransform: "uppercase", fontWeight: 600,
          }}>
            Remote Sensing
          </p>
          <h2 style={{
            fontSize: "1rem", fontWeight: "bold", color: "#2E5E3E",
          }}>
            📊 Comparaison temporelle
          </h2>
        </div>
        <button onClick={onCancel} style={{
          background: "none", border: "none",
          cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af",
        }}>✕</button>
      </div>

      {/* Contexte */}
      <div style={{
        backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
        marginBottom: "1rem", fontSize: "0.78rem", color: "#166534",
      }}>
        📐 Parcelle : <strong>{p.nom}</strong>
        {historique.length > 0 && (
          <span> — {historique.length} analyse(s) disponible(s)</span>
        )}
      </div>

      {isLoading ? (
        <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem" }}>
          Chargement de l'historique...
        </p>
      ) : historique.length < 2 ? (
        <div style={{
          textAlign: "center", padding: "2rem",
          backgroundColor: "#fefce8", border: "1px solid #fef08a",
          borderRadius: "0.5rem",
        }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚠️</p>
          <p style={{ fontSize: "0.85rem", color: "#854d0e", fontWeight: 600 }}>
            Il faut au moins 2 analyses terminées pour comparer.
          </p>
          <p style={{ fontSize: "0.78rem", color: "#92400e", marginTop: "0.4rem" }}>
            Va dans l'onglet "Analyse" pour télécharger des images
            Sentinel-2 supplémentaires.
          </p>
        </div>
      ) : (
        <form onSubmit={handleComparer}>

          {/* Sélection des images */}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>📅 Image — Période 1</label>
            <select
              value={image1}
              onChange={e => setImage1(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Sélectionne une date...</option>
              {historique.map(img => (
                <option key={img.id} value={img.id}>
                  {img.date} — ☁️{img.nuage_pct?.toFixed(1)}%
                  {img.ndvi_mean ? ` — NDVI: ${img.ndvi_mean?.toFixed(3)}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>📅 Image — Période 2</label>
            <select
              value={image2}
              onChange={e => setImage2(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Sélectionne une date...</option>
              {historique.map(img => (
                <option key={img.id} value={img.id}>
                  {img.date} — ☁️{img.nuage_pct?.toFixed(1)}%
                  {img.ndvi_mean ? ` — NDVI: ${img.ndvi_mean?.toFixed(3)}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Indice */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Indice à comparer</label>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["ndvi", "ndwi", "savi"].map(ind => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndice(ind)}
                  style={{
                    flex: 1, padding: "0.4rem",
                    borderRadius: "0.4rem",
                    border: `2px solid ${indice === ind ? "#2E5E3E" : "#e5e7eb"}`,
                    backgroundColor: indice === ind ? "#2E5E3E" : "white",
                    color: indice === ind ? "white" : "#374151",
                    cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                  }}
                >
                  {ind.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "0.4rem", padding: "0.5rem",
              fontSize: "0.78rem", color: "#dc2626", marginBottom: "0.75rem",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isComparing || !image1 || !image2}
            style={{
              width: "100%", padding: "0.6rem",
              borderRadius: "0.4rem",
              backgroundColor: isComparing || !image1 || !image2
                ? "#9ca3af" : "#2E5E3E",
              border: "none", color: "white", fontWeight: 600,
              cursor: isComparing ? "not-allowed" : "pointer",
              fontSize: "0.85rem", marginBottom: "1rem",
            }}
          >
            {isComparing ? "Comparaison..." : "📊 Comparer"}
          </button>
        </form>
      )}

      {/* ── Résultats de comparaison ── */}
      {resultat && (
        <div>

          {/* Tableau comparatif */}
          <div style={{
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem", padding: "0.75rem",
            marginBottom: "0.75rem",
            border: "1px solid #e5e7eb",
          }}>
            <p style={{
              fontSize: "0.78rem", fontWeight: 700,
              color: "#2E5E3E", marginBottom: "0.5rem",
            }}>
              {resultat.indice} — Comparaison
            </p>

            {/* En-têtes */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "0.25rem", fontSize: "0.7rem",
              fontWeight: 700, color: "#6b7280",
              marginBottom: "0.4rem",
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
                gap: "0.25rem", fontSize: "0.78rem",
                padding: "0.3rem 0",
                borderBottom: "1px solid #f3f4f6",
              }}>
                <span style={{ color: "#6b7280" }}>{label}</span>
                <span style={{ textAlign: "center", fontWeight: 600 }}>
                  {resultat.image_1[key]?.toFixed(3) ?? "—"}
                </span>
                <span style={{ textAlign: "center", fontWeight: 600 }}>
                  {resultat.image_2[key]?.toFixed(3) ?? "—"}
                </span>
                <span style={{
                  textAlign: "center", fontWeight: 700,
                  color: couleurEvol(evol),
                }}>
                  {fleche(evol)} {evol !== null ? `${evol}%` : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Graphique barres simulé en CSS */}
          <div style={{
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem", padding: "0.75rem",
            marginBottom: "0.75rem",
            border: "1px solid #e5e7eb",
          }}>
            <p style={{
              fontSize: "0.78rem", fontWeight: 700,
              color: "#2E5E3E", marginBottom: "0.75rem",
            }}>
              📊 Graphique comparatif
            </p>

            {[
              { label: "Moyenne", v1: resultat.image_1.mean, v2: resultat.image_2.mean },
              { label: "Min",     v1: resultat.image_1.min,  v2: resultat.image_2.min  },
              { label: "Max",     v1: resultat.image_1.max,  v2: resultat.image_2.max  },
            ].map(({ label, v1, v2 }) => {
              const max_val = Math.max(Math.abs(v1 || 0), Math.abs(v2 || 0), 0.1);
              const pct1 = Math.abs((v1 || 0) / max_val * 100);
              const pct2 = Math.abs((v2 || 0) / max_val * 100);
              return (
                <div key={label} style={{ marginBottom: "0.6rem" }}>
                  <p style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: "0.2rem" }}>
                    {label}
                  </p>
                  {/* Période 1 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.68rem", color: "#6b7280", width: "60px" }}>
                      {resultat.image_1.date.slice(0, 4)}
                    </span>
                    <div style={{
                      flex: 1, height: "12px",
                      backgroundColor: "#e5e7eb", borderRadius: "6px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${pct1}%`, height: "100%",
                        backgroundColor: "#2E5E3E",
                        borderRadius: "6px",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, width: "40px" }}>
                      {v1?.toFixed(3)}
                    </span>
                  </div>
                  {/* Période 2 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.68rem", color: "#6b7280", width: "60px" }}>
                      {resultat.image_2.date.slice(0, 4)}
                    </span>
                    <div style={{
                      flex: 1, height: "12px",
                      backgroundColor: "#e5e7eb", borderRadius: "6px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${pct2}%`, height: "100%",
                        backgroundColor: "#B08D57",
                        borderRadius: "6px",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, width: "40px" }}>
                      {v2?.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Légende */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#2E5E3E", borderRadius: "2px" }} />
                <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                  {resultat.image_1.date}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#B08D57", borderRadius: "2px" }} />
                <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                  {resultat.image_2.date}
                </span>
              </div>
            </div>
          </div>

          {/* Images côte à côte */}
          <div style={{
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem", padding: "0.75rem",
            marginBottom: "0.75rem",
            border: "1px solid #e5e7eb",
          }}>
            <p style={{
              fontSize: "0.78rem", fontWeight: 700,
              color: "#2E5E3E", marginBottom: "0.5rem",
            }}>
              🖼️ Cartes {resultat.indice} côte à côte
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.3rem", textAlign: "center" }}>
                  {resultat.image_1.date}
                </p>
                <img
                  src={resultat.image_1.chemin_png}
                  alt={`${resultat.indice} ${resultat.image_1.date}`}
                  style={{
                    width: "100%", borderRadius: "0.4rem",
                    border: "2px solid #2E5E3E",
                  }}
                />
              </div>
              <div>
                <p style={{ fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.3rem", textAlign: "center" }}>
                  {resultat.image_2.date}
                </p>
                <img
                  src={resultat.image_2.chemin_png}
                  alt={`${resultat.indice} ${resultat.image_2.date}`}
                  style={{
                    width: "100%", borderRadius: "0.4rem",
                    border: "2px solid #B08D57",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Interprétation */}
          {resultat.interpretation && (
            <div style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "0.5rem", padding: "0.75rem",
            }}>
              <p style={{
                fontSize: "0.78rem", fontWeight: 700,
                color: "#1e40af", marginBottom: "0.3rem",
              }}>
                🔍 Interprétation de la tendance
              </p>
              <p style={{ fontSize: "0.78rem", color: "#1e40af" }}>
                {resultat.interpretation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}