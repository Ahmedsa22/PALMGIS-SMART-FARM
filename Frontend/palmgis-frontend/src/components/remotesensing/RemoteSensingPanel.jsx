import { useState } from "react";
import api from "../../api/axios";
import ComparaisonPanel from "./ComparaisonPanel";

export default function RemoteSensingPanel({ parcelle, onCancel }) {
  const p = parcelle.properties;

  const [onglet, setOnglet]           = useState("analyse");
  const [dateDebut, setDateDebut]     = useState("2024-01-01");
  const [dateFin, setDateFin]         = useState("2024-12-31");
  const [nuageMax, setNuageMax]       = useState(30);
  const [images, setImages]           = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone]   = useState(false);
  const [imageSelectionnee, setImageSelectionnee] = useState(null);
  const [isDownloading, setIsDownloading]         = useState(false);
  const [imageId, setImageId]         = useState(null);
  const [statut, setStatut]           = useState(null);
  const [indices, setIndices]         = useState(null);
  const [indiceActif, setIndiceActif] = useState("ndvi");
  const [error, setError]             = useState(null);

  const statutLabel = {
    en_attente:     "⏳ En attente",
    telechargement: "📥 Téléchargement...",
    traitement:     "⚙️ Calcul des indices...",
    termine:        "✅ Terminé",
    erreur:         "❌ Erreur",
  };

  async function handleRechercher(e) {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    setImages([]);
    setSearchDone(false);
    try {
      const response = await api.post("/remote-sensing/rechercher/", {
        parcelle_id: p.id,
        date_debut:  dateDebut,
        date_fin:    dateFin,
        nuage_max:   nuageMax,
      });
      setImages(response.data.images || []);
      setSearchDone(true);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la recherche.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleTelecharger(image) {
    setIsDownloading(true);
    setError(null);
    setImageSelectionnee(image);
    setStatut("telechargement");
    setIndices(null);

    try {
      const response = await api.post("/remote-sensing/telecharger/", {
        parcelle_id:      p.id,
        produit_id:       image.id,
        date_acquisition: image.date,
        nuage_pct:        image.nuage,
      });

      const id = response.data.image_id;
      setImageId(id);

      const interval = setInterval(async () => {
        try {
          const statutResp = await api.get(`/remote-sensing/statut/${id}/`);
          const data = statutResp.data;
          setStatut(data.statut);
          if (data.statut === "termine") {
            clearInterval(interval);
            setIndices(data.indices);
            setIsDownloading(false);
          } else if (data.statut === "erreur") {
            clearInterval(interval);
            setError(data.message || "Erreur lors du traitement.");
            setIsDownloading(false);
          }
        } catch {
          clearInterval(interval);
          setIsDownloading(false);
        }
      }, 5000);

    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du lancement.");
      setIsDownloading(false);
    }
  }

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
            🛰️ Indices spectraux
          </h2>
        </div>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "none",
            cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af",
          }}
        >
          ✕
        </button>
      </div>

      {/* Contexte parcelle */}
      <div style={{
        backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
        marginBottom: "1rem", fontSize: "0.78rem", color: "#166534",
      }}>
        📐 Parcelle : <strong>{p.nom}</strong> — {p.superficie_ha} ha
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
        {[
          { id: "analyse",     label: "🛰️ Analyse" },
          { id: "comparaison", label: "📊 Comparaison" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            style={{
              flex: 1, padding: "0.5rem",
              borderRadius: "0.4rem",
              border: `2px solid ${onglet === id ? "#2E5E3E" : "#e5e7eb"}`,
              backgroundColor: onglet === id ? "#2E5E3E" : "white",
              color: onglet === id ? "white" : "#374151",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenu selon l'onglet */}
      {onglet === "comparaison" ? (

        <ComparaisonPanel parcelle={parcelle} onCancel={onCancel} />

      ) : (

        <>
          {/* Formulaire de recherche */}
          <form onSubmit={handleRechercher}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem", marginBottom: "0.75rem",
            }}>
              <div>
                <label style={labelStyle}>Date début</label>
                <input
                  type="date" value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Date fin</label>
                <input
                  type="date" value={dateFin}
                  onChange={e => setDateFin(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={labelStyle}>
                Couverture nuageuse max : {nuageMax}%
              </label>
              <input
                type="range" min="0" max="100" step="5"
                value={nuageMax}
                onChange={e => setNuageMax(parseInt(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              style={{
                width: "100%", padding: "0.6rem",
                borderRadius: "0.4rem",
                backgroundColor: isSearching ? "#9ca3af" : "#2E5E3E",
                border: "none", color: "white", fontWeight: 600,
                cursor: isSearching ? "not-allowed" : "pointer",
                fontSize: "0.85rem", marginBottom: "1rem",
              }}
            >
              {isSearching ? "Recherche..." : "🔍 Rechercher des images Sentinel-2"}
            </button>
          </form>

          {/* Résultats de recherche */}
          {searchDone && images.length === 0 && (
            <div style={{
              textAlign: "center", padding: "1rem",
              color: "#9ca3af", fontSize: "0.85rem",
            }}>
              📭 Aucune image disponible pour cette période.
            </div>
          )}

          {images.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{
                fontSize: "0.78rem", fontWeight: 600,
                color: "#374151", marginBottom: "0.5rem",
              }}>
                {images.length} image(s) disponible(s) :
              </p>
              {images.map((img) => (
                <div key={img.id} style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem", padding: "0.6rem",
                  marginBottom: "0.4rem",
                  backgroundColor: imageSelectionnee?.id === img.id
                    ? "#f0fdf4" : "white",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1f2937" }}>
                        📅 {img.date}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                        ☁️ {img.nuage?.toFixed(1)}% nuages
                        — {(img.taille / 1024 / 1024).toFixed(0)} Mo
                      </p>
                    </div>
                    <button
                      onClick={() => handleTelecharger(img)}
                      disabled={isDownloading}
                      style={{
                        padding: "0.35rem 0.6rem",
                        borderRadius: "0.4rem",
                        backgroundColor: isDownloading ? "#9ca3af" : "#2E5E3E",
                        border: "none", color: "white",
                        cursor: isDownloading ? "not-allowed" : "pointer",
                        fontSize: "0.75rem", fontWeight: 600,
                      }}
                    >
                      📥 Télécharger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statut du traitement */}
          {statut && (
            <div style={{
              backgroundColor: statut === "termine" ? "#f0fdf4"
                : statut === "erreur" ? "#fef2f2" : "#eff6ff",
              border: `1px solid ${
                statut === "termine" ? "#bbf7d0"
                : statut === "erreur" ? "#fecaca" : "#bfdbfe"
              }`,
              borderRadius: "0.5rem", padding: "0.75rem",
              marginBottom: "1rem",
            }}>
              <p style={{
                fontSize: "0.85rem", fontWeight: 600,
                color: statut === "termine" ? "#166534"
                  : statut === "erreur" ? "#dc2626" : "#1e40af",
              }}>
                {statutLabel[statut] || statut}
              </p>
              {isDownloading && (
                <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.3rem" }}>
                  Le traitement peut prendre plusieurs minutes...
                </p>
              )}
            </div>
          )}

          {/* Résultats des indices */}
          {indices && (
            <div>
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
                {["ndvi", "ndwi", "savi"].map(ind => (
                  <button
                    key={ind}
                    onClick={() => setIndiceActif(ind)}
                    style={{
                      flex: 1, padding: "0.4rem",
                      borderRadius: "0.4rem",
                      border: `2px solid ${indiceActif === ind ? "#2E5E3E" : "#e5e7eb"}`,
                      backgroundColor: indiceActif === ind ? "#2E5E3E" : "white",
                      color: indiceActif === ind ? "white" : "#374151",
                      cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                    }}
                  >
                    {ind.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{
                backgroundColor: "#f9fafb",
                borderRadius: "0.5rem", padding: "0.75rem",
                marginBottom: "0.75rem",
              }}>
                <p style={{
                  fontSize: "0.78rem", fontWeight: 700,
                  color: "#2E5E3E", marginBottom: "0.5rem",
                }}>
                  {indiceActif.toUpperCase()} — Résultats
                </p>
                {[
                  { label: "Moyenne", value: indices[`${indiceActif}_mean`]?.toFixed(3) },
                  { label: "Min",     value: indices[`${indiceActif}_min`]?.toFixed(3) },
                  { label: "Max",     value: indices[`${indiceActif}_max`]?.toFixed(3) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: "0.78rem", padding: "3px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}>
                    <span style={{ color: "#6b7280" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: "#1f2937" }}>
                      {value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              {imageId && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <p style={{
                    fontSize: "0.75rem", fontWeight: 600,
                    color: "#374151", marginBottom: "0.4rem",
                  }}>
                    Carte {indiceActif.toUpperCase()} :
                  </p>
                  <img
                    src={`/api/remote-sensing/image/${imageId}/${indiceActif}/`}
                    alt={`Carte ${indiceActif}`}
                    style={{
                      width: "100%", borderRadius: "0.4rem",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              )}

              {indices.interpretation && (
                <div style={{
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "0.5rem", padding: "0.75rem",
                }}>
                  <p style={{
                    fontSize: "0.78rem", fontWeight: 700,
                    color: "#1e40af", marginBottom: "0.4rem",
                  }}>
                    🔍 Interprétation automatique
                  </p>
                  {indices.interpretation.split("\n").map((ligne, i) => (
                    <p key={i} style={{
                      fontSize: "0.75rem", color: "#1e40af",
                      marginBottom: "0.2rem",
                    }}>
                      • {ligne}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div style={{
              backgroundColor: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "0.5rem", padding: "0.6rem",
              fontSize: "0.8rem", color: "#dc2626", marginTop: "0.5rem",
            }}>
              ⚠️ {error}
            </div>
          )}
        </>
      )}

    </div>
  );
}