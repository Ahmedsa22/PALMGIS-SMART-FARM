import { useState } from "react";
import {
  Satellite, BarChart3, X, LandPlot, Search, Download, Calendar, Cloud,
  Info, AlertTriangle, Loader2,
} from "lucide-react";
import api from "../../api/axios";
import ComparaisonPanel from "./ComparaisonPanel";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";
import { SectionTitle } from "../ui/Badge";

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
    en_attente:     "En attente",
    telechargement: "Téléchargement...",
    traitement:     "Calcul des indices...",
    termine:        "Terminé",
    erreur:         "Erreur",
  };

  const statutColor = {
    en_attente:     theme.colors.info,
    telechargement: theme.colors.info,
    traitement:     theme.colors.info,
    termine:        theme.colors.success,
    erreur:         theme.colors.danger,
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
            <Satellite size={16} color={theme.colors.primary} /> Indices spectraux
          </h2>
        </div>
        <button onClick={onCancel} style={closeButtonStyle}>
          <X size={18} />
        </button>
      </div>

      {/* Contexte parcelle */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, padding: "8px 12px",
        marginBottom: 16, fontSize: theme.font.size.sm, color: theme.colors.textSecondary,
      }}>
        <LandPlot size={14} color={theme.colors.textMuted} />
        Parcelle : <strong style={{ color: theme.colors.text }}>{p.nom}</strong> — {p.superficie_ha} ha
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", borderBottom: `1px solid ${theme.colors.border}`, marginBottom: 16 }}>
        {[
          { id: "analyse",     label: "Analyse",     icon: Satellite },
          { id: "comparaison", label: "Comparaison", icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              flex: 1, padding: "8px 4px",
              border: "none",
              borderBottom: onglet === id ? `2px solid ${theme.colors.primary}` : "2px solid transparent",
              backgroundColor: "transparent",
              color: onglet === id ? theme.colors.primary : theme.colors.textSecondary,
              cursor: "pointer", fontSize: theme.font.size.sm, fontWeight: 600,
              justifyContent: "center",
            }}
          >
            <Icon size={14} /> {label}
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
              gap: 8, marginBottom: 12,
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

            <div style={{ marginBottom: 12 }}>
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

            <Button
              type="submit"
              variant="primary"
              icon={Search}
              disabled={isSearching}
              style={{ marginBottom: 16 }}
            >
              {isSearching ? "Recherche..." : "Rechercher des images Sentinel-2"}
            </Button>
          </form>

          {/* Résultats de recherche */}
          {searchDone && images.length === 0 && (
            <div style={{
              textAlign: "center", padding: 16,
              color: theme.colors.textMuted, fontSize: theme.font.size.sm,
            }}>
              Aucune image disponible pour cette période.
            </div>
          )}

          {images.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontSize: theme.font.size.xs, fontWeight: 600,
                color: theme.colors.textSecondary, marginBottom: 8,
              }}>
                {images.length} image(s) disponible(s) :
              </p>
              {images.map((img) => (
                <div key={img.id} style={{
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md, padding: 10,
                  marginBottom: 6,
                  backgroundColor: imageSelectionnee?.id === img.id
                    ? theme.colors.bg : theme.colors.surface,
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <p style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontSize: theme.font.size.sm, fontWeight: 600, color: theme.colors.text,
                      }}>
                        <Calendar size={12} /> {img.date}
                      </p>
                      <p style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginTop: 2,
                      }}>
                        <Cloud size={12} /> {img.nuage?.toFixed(1)}% nuages
                        — {(img.taille / 1024 / 1024).toFixed(0)} Mo
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      icon={Download}
                      fullWidth={false}
                      onClick={() => handleTelecharger(img)}
                      disabled={isDownloading}
                      style={{ padding: "6px 10px", fontSize: theme.font.size.xs }}
                    >
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Statut du traitement */}
          {statut && (
            <div style={{
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `3px solid ${statutColor[statut] || theme.colors.info}`,
              borderRadius: theme.radius.sm, padding: 12,
              marginBottom: 16,
            }}>
              <p style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: theme.font.size.sm, fontWeight: 600,
                color: statutColor[statut] || theme.colors.info,
              }}>
                {isDownloading && <Loader2 size={13} className="animate-spin" />}
                {statutLabel[statut] || statut}
              </p>
              {isDownloading && (
                <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginTop: 4 }}>
                  Le traitement peut prendre plusieurs minutes...
                </p>
              )}
            </div>
          )}

          {/* Résultats des indices */}
          {indices && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {["ndvi", "ndwi", "savi"].map(ind => (
                  <button
                    key={ind}
                    onClick={() => setIndiceActif(ind)}
                    style={{
                      flex: 1, padding: "6px",
                      borderRadius: theme.radius.sm,
                      border: `1px solid ${indiceActif === ind ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: indiceActif === ind ? theme.colors.primary : theme.colors.surface,
                      color: indiceActif === ind ? "white" : theme.colors.textSecondary,
                      cursor: "pointer", fontSize: theme.font.size.xs, fontWeight: 600,
                    }}
                  >
                    {ind.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md, padding: 12,
                marginBottom: 12,
              }}>
                <SectionTitle style={{ marginBottom: 8 }}>
                  {indiceActif.toUpperCase()} — Résultats
                </SectionTitle>
                {[
                  { label: "Moyenne", value: indices[`${indiceActif}_mean`]?.toFixed(3) },
                  { label: "Min",     value: indices[`${indiceActif}_min`]?.toFixed(3) },
                  { label: "Max",     value: indices[`${indiceActif}_max`]?.toFixed(3) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: theme.font.size.sm, padding: "6px 0",
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}>
                    <span style={{ color: theme.colors.textSecondary }}>{label}</span>
                    <span style={{ fontWeight: 600, color: theme.colors.text }}>
                      {value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              {imageId && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{
                    fontSize: theme.font.size.xs, fontWeight: 600,
                    color: theme.colors.textSecondary, marginBottom: 6,
                  }}>
                    Carte {indiceActif.toUpperCase()} :
                  </p>
                  <img
                    src={`/api/remote-sensing/image/${imageId}/${indiceActif}/`}
                    alt={`Carte ${indiceActif}`}
                    style={{
                      width: "100%", borderRadius: theme.radius.md,
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  />
                </div>
              )}

              {indices.interpretation && (
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
                    <Info size={13} /> Interprétation automatique
                  </p>
                  {indices.interpretation.split("\n").map((ligne, i) => (
                    <p key={i} style={{
                      fontSize: theme.font.size.xs, color: theme.colors.textSecondary,
                      marginBottom: 4,
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
            <div style={errorBoxStyle}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
        </>
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
  marginTop: 8, fontSize: theme.font.size.xs, color: theme.colors.danger,
};
