import { useEffect, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { createParcelle } from "../../api/parcelles";
import { createPalm } from "../../api/palms";
import useMapStore from "../../store/mapStore";

export default function DrawingToolbox({ map }) {
  const drawRef                         = useRef(null);
  const [mode, setMode]                 = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [geomDessinee, setGeomDessinee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);
  const [nbCrees, setNbCrees]           = useState(0);

  // Formulaire parcelle
  const [nomParcelle, setNomParcelle]       = useState("");
  const [statutParcelle, setStatutParcelle] = useState("active");
  const [typeParcelle, setTypeParcelle]     = useState("parcelle");
  const [proprietaire, setProprietaire]     = useState("");

  // Formulaire palmier
  const [agePalm, setAgePalm]             = useState("A");
  const [etatSante, setEtatSante]         = useState("B");
  const [etatSite, setEtatSite]           = useState("ISO");
  const [sexePalm, setSexePalm]           = useState("M");
  const [varietePalm, setVarietePalm]     = useState("");
  const [lignePalm, setLignePalm]         = useState("");
  const [numeroPalm, setNumeroPalm]       = useState("");
  const [codeLocalPalm, setCodeLocalPalm] = useState("");
  const [nombreRejets, setNombreRejets]   = useState("");

  const parcelleSelectionnee = useMapStore(
    (state) => state.parcelleSelectionnee
  );

  // ── Initialise MapboxDraw ──
  useEffect(() => {
    if (!map) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: { "fill-color": "#2E5E3E", "fill-opacity": 0.3 },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: { "line-color": "#2E5E3E", "line-width": 2 },
        },
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 8,
            "circle-color": "#B08D57",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#2E5E3E",
          },
        },
      ],
    });

    map.addControl(draw, "top-right");
    drawRef.current = draw;

    const onDrawCreate = (e) => {
      const feature = e.features[0];
      if (!feature) return;
      setGeomDessinee(feature.geometry);
      setShowForm(true);
      setTimeout(() => {
        if (drawRef.current) {
          drawRef.current.changeMode("simple_select");
        }
      }, 0);
    };

    map.on("draw.create", onDrawCreate);

    return () => {
      map.off("draw.create", onDrawCreate);
      if (map.hasControl(draw)) map.removeControl(draw);
      drawRef.current = null;
    };
  }, [map]);

  // ── Active le mode dessin ──
  function activerDessin(typeForme) {
    if (!drawRef.current) return;
    drawRef.current.deleteAll();
    setShowForm(false);
    setGeomDessinee(null);
    setError(null);
    setSuccess(null);
    setNbCrees(0);
    setMode(typeForme);
    if (typeForme === "parcelle") {
      drawRef.current.changeMode("draw_polygon");
    } else if (typeForme === "palm") {
      drawRef.current.changeMode("draw_point");
    }
  }

  function annulerDessin() {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode("simple_select");
    }
    setMode(null);
    setShowForm(false);
    setGeomDessinee(null);
    setError(null);
    setNbCrees(0);
    setNomParcelle("");
    setCodeLocalPalm("");
    setNumeroPalm("");
  }

  // ── Sauvegarde parcelle ──
  async function sauvegarderParcelle(e) {
    e.preventDefault();
    if (!geomDessinee || !nomParcelle.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await createParcelle({
        type:     "Feature",
        geometry: geomDessinee,
        properties: {
          nom:           nomParcelle,
          statut:        statutParcelle,
          type_parcelle: typeParcelle,
          proprietaire:  proprietaire || "",
          description:   "",
        },
      });

      setSuccess("✅ Parcelle créée !");
      drawRef.current?.deleteAll();
      setMode(null);
      setShowForm(false);
      setNomParcelle("");
      setTypeParcelle("parcelle");
      setStatutParcelle("active");
      setProprietaire("");

      setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
      console.error("Erreur création parcelle:", err.response?.data);
      setError(
        JSON.stringify(err.response?.data) ||
        "Erreur lors de la création."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Sauvegarde palmier ──
  async function sauvegarderPalm(e) {
    e.preventDefault();
    if (!geomDessinee) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await createPalm({
        geom:       geomDessinee,
        age:        etatSite === "V" ? null : agePalm,
        etat_sante: etatSante,
        etat_site:  etatSite,
        sexe:       etatSite === "V" ? null : sexePalm,
        variete:    varietePalm,
        ligne:      lignePalm,
        numero:     numeroPalm,
        code_local: codeLocalPalm,
        nombre_rejets: etatSite === "TOF" && nombreRejets !== ""
          ? parseInt(nombreRejets) : null,
      });

      setSuccess(`✅ Palmier créé !`);
      setNbCrees(prev => prev + 1);
      setGeomDessinee(null);
      setShowForm(false);
      setNombreRejets("");
      setCodeLocalPalm("");
      setNumeroPalm("");
      setError(null);

      if (drawRef.current) {
        drawRef.current.deleteAll();
        drawRef.current.changeMode("draw_point");
      }

      setTimeout(() => setSuccess(null), 2000);

    } catch (err) {
      console.error("Erreur création palmier:", err.response?.data);
      setError(
        JSON.stringify(err.response?.data) ||
        "Erreur lors de la création."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const btnStyle = (actif, couleur = "#2E5E3E") => ({
    display: "flex", alignItems: "center", gap: "0.4rem",
    padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
    border: `2px solid ${actif ? couleur : "#e5e7eb"}`,
    backgroundColor: actif ? couleur : "white",
    color: actif ? "white" : "#374151",
    cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    whiteSpace: "nowrap",
  });

  const inputStyle = {
    width: "100%", padding: "0.4rem 0.6rem",
    borderRadius: "0.4rem", border: "1px solid #d1d5db",
    fontSize: "0.8rem", boxSizing: "border-box",
    backgroundColor: "white",
  };

  const labelStyle = {
    display: "block", fontSize: "0.72rem",
    fontWeight: 600, color: "#374151", marginBottom: "0.2rem",
  };

  return (
    <>
      {/* ── Barre d'outils ── */}
      <div style={{
        position: "absolute", bottom: "8rem", right: "0.75rem",
        display: "flex", flexDirection: "column", gap: "0.4rem", zIndex: 10,
      }}>
        <button
          onClick={() => mode === "parcelle" ? annulerDessin() : activerDessin("parcelle")}
          style={btnStyle(mode === "parcelle")}
        >
          📐 {mode === "parcelle" ? "Annuler" : "Nouvelle parcelle"}
        </button>
        <button
          onClick={() => mode === "palm" ? annulerDessin() : activerDessin("palm")}
          style={btnStyle(mode === "palm", "#B08D57")}
        >
          🌴 {mode === "palm" ? "Annuler" : "Nouveau palmier"}
        </button>
      </div>

      {/* ── Instructions ── */}
      {mode && !showForm && (
        <div style={{
          position: "absolute", bottom: "13rem", right: "0.75rem",
          backgroundColor: "white", borderRadius: "0.6rem",
          padding: "0.6rem 0.75rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          fontSize: "0.78rem", color: "#374151",
          maxWidth: "200px", zIndex: 10, border: "1px solid #e5e7eb",
        }}>
          {mode === "parcelle" ? (
            <>
              <strong>Dessiner une parcelle</strong><br />
              Cliquez pour placer les points.<br />
              Double-clic pour terminer.
            </>
          ) : (
            <>
              <strong>Ajouter un palmier</strong><br />
              Cliquez sur la carte pour placer le palmier.
              {nbCrees > 0 && (
                <div style={{ marginTop: "0.4rem", color: "#2E5E3E", fontWeight: 600 }}>
                  ✅ {nbCrees} palmier(s) créé(s)
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Formulaire après dessin ── */}
      {showForm && geomDessinee && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white", borderRadius: "0.75rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          padding: "1.25rem", width: "300px", zIndex: 20,
          maxHeight: "80vh", overflowY: "auto",
        }}>

          <h3 style={{
            fontSize: "0.95rem", fontWeight: 700,
            color: "#2E5E3E", marginBottom: "1rem",
          }}>
            {mode === "parcelle" ? "📐 Nouvelle parcelle" : "🌴 Nouveau palmier"}
          </h3>

          {/* ── Formulaire Parcelle ── */}
          {mode === "parcelle" && (
            <form onSubmit={sauvegarderParcelle}>

              {/* Nom */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={labelStyle}>Nom *</label>
                <input
                  type="text"
                  value={nomParcelle}
                  onChange={e => setNomParcelle(e.target.value)}
                  required
                  placeholder="Ex: 11B"
                  style={inputStyle}
                />
              </div>

              {/* Type */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={labelStyle}>Type</label>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {[
                    { value: "parcelle", label: "🌿 Parcelle" },
                    { value: "zone",     label: "📍 Zone"     },
                    { value: "ferme",    label: "🏡 Ferme"    },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTypeParcelle(value)}
                      style={{
                        flex: 1, padding: "0.35rem",
                        borderRadius: "0.4rem",
                        border: `2px solid ${typeParcelle === value ? "#2E5E3E" : "#e5e7eb"}`,
                        backgroundColor: typeParcelle === value ? "#2E5E3E" : "white",
                        color: typeParcelle === value ? "white" : "#374151",
                        cursor: "pointer", fontSize: "0.72rem", fontWeight: 600,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statut */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={labelStyle}>Statut</label>
                <select
                  value={statutParcelle}
                  onChange={e => setStatutParcelle(e.target.value)}
                  style={inputStyle}
                >
                  <option value="active">✅ Active</option>
                  <option value="en_repos">⏸️ En repos</option>
                  <option value="abandonnee">❌ Abandonnée</option>
                </select>
              </div>

              {/* Propriétaire */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={labelStyle}>Propriétaire</label>
                <input
                  type="text"
                  value={proprietaire}
                  onChange={e => setProprietaire(e.target.value)}
                  placeholder="Nom du propriétaire"
                  style={inputStyle}
                />
              </div>

              {/* Erreur / Succès */}
              {error && (
                <div style={{
                  backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "0.4rem", padding: "0.5rem",
                  marginBottom: "0.75rem", fontSize: "0.78rem", color: "#dc2626",
                }}>
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div style={{
                  backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: "0.4rem", padding: "0.5rem",
                  marginBottom: "0.75rem", fontSize: "0.78rem", color: "#166534",
                }}>
                  {success}
                </div>
              )}

              {/* Boutons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button" onClick={annulerDessin}
                  style={{
                    flex: 1, padding: "0.5rem", borderRadius: "0.4rem",
                    backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
                    cursor: "pointer", fontSize: "0.82rem",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !nomParcelle.trim()}
                  style={{
                    flex: 2, padding: "0.5rem", borderRadius: "0.4rem",
                    backgroundColor: isSubmitting ? "#9ca3af" : "#2E5E3E",
                    border: "none", color: "white",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontSize: "0.82rem", fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Création..." : "💾 Créer la parcelle"}
                </button>
              </div>
            </form>
          )}

          {/* ── Formulaire Palmier ── */}
          {mode === "palm" && (
            <form onSubmit={sauvegarderPalm}>

              {/* État sanitaire + État site */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem", marginBottom: "0.75rem",
              }}>
                <div>
                  <label style={labelStyle}>État sanitaire</label>
                  <select value={etatSante} onChange={e => setEtatSante(e.target.value)} style={inputStyle}>
                    <option value="B">✅ Bon</option>
                    <option value="MO">⚠️ Moyen</option>
                    <option value="MA">🔴 Mauvais</option>
                    <option value="MR">💀 Mort</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>État site</label>
                  <select value={etatSite} onChange={e => setEtatSite(e.target.value)} style={inputStyle}>
                    <option value="ISO">Isolé</option>
                    <option value="TOF">Touffes</option>
                    <option value="V">Vide</option>
                  </select>
                </div>
              </div>

              {/* Sexe + Âge — cachés si site vide */}
              {etatSite !== "V" ? (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem", marginBottom: "0.75rem",
                }}>
                  <div>
                    <label style={labelStyle}>Sexe</label>
                    <select value={sexePalm} onChange={e => setSexePalm(e.target.value)} style={inputStyle}>
                      <option value="M">Mâle</option>
                      <option value="F">Femelle</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Âge</label>
                    <select value={agePalm} onChange={e => setAgePalm(e.target.value)} style={inputStyle}>
                      <option value="JP">Jeune</option>
                      <option value="A">Adulte</option>
                      <option value="V">Vieux</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                  borderRadius: "0.4rem", padding: "0.5rem",
                  fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.75rem",
                }}>
                  ℹ️ Site vide — sexe et âge non applicables
                </div>
              )}

              {/* Variété */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={labelStyle}>Variété</label>
                <input
                  type="text" value={varietePalm}
                  onChange={e => setVarietePalm(e.target.value)}
                  placeholder="Ex: NJD, SAIR..."
                  style={inputStyle}
                />
              </div>

              {/* Ligne + Numéro */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem", marginBottom: "0.75rem",
              }}>
                <div>
                  <label style={labelStyle}>Ligne</label>
                  <input type="text" value={lignePalm}
                    onChange={e => setLignePalm(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Numéro</label>
                  <input type="text" value={numeroPalm}
                    onChange={e => setNumeroPalm(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Code local */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={labelStyle}>Code local</label>
                <input type="text" value={codeLocalPalm}
                  onChange={e => setCodeLocalPalm(e.target.value)} style={inputStyle} />
              </div>

              {/* Nombre de rejets */}
              {etatSite === "TOF" && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={labelStyle}>
                    Nombre de rejets
                    <span style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 400, marginLeft: "0.4rem" }}>
                      (touffes uniquement)
                    </span>
                  </label>
                  <input
                    type="number" value={nombreRejets}
                    onChange={e => setNombreRejets(e.target.value)}
                    min="0" max="50" placeholder="Ex: 3"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Succès */}
              {success && (
                <div style={{
                  backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: "0.4rem", padding: "0.5rem",
                  marginBottom: "0.75rem", fontSize: "0.78rem", color: "#166534",
                }}>
                  {success} {nbCrees > 0 && `(${nbCrees} créé(s))`}
                </div>
              )}

              {/* Erreur */}
              {error && (
                <div style={{
                  backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "0.4rem", padding: "0.5rem",
                  marginBottom: "0.75rem", fontSize: "0.78rem", color: "#dc2626",
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Boutons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button" onClick={annulerDessin}
                  style={{
                    flex: 1, padding: "0.5rem", borderRadius: "0.4rem",
                    backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
                    cursor: "pointer", fontSize: "0.82rem",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  style={{
                    flex: 2, padding: "0.5rem", borderRadius: "0.4rem",
                    backgroundColor: isSubmitting ? "#9ca3af" : "#B08D57",
                    border: "none", color: "white",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontSize: "0.82rem", fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Création..." : "💾 Créer le palmier"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}