import { useEffect, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { LandPlot, TreePalm, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { createParcelle } from "../../api/parcelles";
import { createPalm } from "../../api/palms";
import useMapStore from "../../store/mapStore";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";

export default function DrawingToolbox({ map, drawMode, setDrawMode }) {
  const drawRef = useRef(null);

  // ← mode vient des props (MapPage), pas d'un useState local
  const mode    = drawMode;
  const setMode = setDrawMode;

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
          paint: { "fill-color": theme.colors.primary, "fill-opacity": 0.3 },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: { "line-color": theme.colors.primary, "line-width": 2 },
        },
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 8,
            "circle-color": theme.colors.accent,
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
            "circle-stroke-color": theme.colors.primary,
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

  // ── Réagit aux changements de drawMode depuis MapPage ──
  useEffect(() => {
    if (!drawRef.current) return;

    if (mode === "parcelle") {
      drawRef.current.deleteAll();
      setShowForm(false);
      setGeomDessinee(null);
      setError(null);
      setSuccess(null);
      setNbCrees(0);
      drawRef.current.changeMode("draw_polygon");
    } else if (mode === "palm") {
      drawRef.current.deleteAll();
      setShowForm(false);
      setGeomDessinee(null);
      setError(null);
      setSuccess(null);
      setNbCrees(0);
      drawRef.current.changeMode("draw_point");
    } else {
      // mode === null → annule
      drawRef.current.deleteAll();
      drawRef.current.changeMode("simple_select");
      setShowForm(false);
      setGeomDessinee(null);
      setNomParcelle("");
      setCodeLocalPalm("");
      setNumeroPalm("");
      setNbCrees(0);
    }
  }, [mode]);

  function annulerDessin() {
    setMode(null);
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

      setSuccess("Parcelle créée !");
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

      setSuccess("Palmier créé !");
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

  return (
    <>
      {/* ── Instructions ── */}
      {mode && !showForm && (
        <div style={{
          position: "absolute", bottom: "4rem", right: "0.75rem",
          backgroundColor: theme.colors.surface, borderRadius: theme.radius.md,
          padding: "10px 12px", boxShadow: theme.shadow.md,
          fontSize: theme.font.size.sm, color: theme.colors.textSecondary,
          maxWidth: 200, zIndex: 10, border: `1px solid ${theme.colors.border}`,
        }}>
          {mode === "parcelle" ? (
            <>
              <strong style={{ color: theme.colors.text }}>Dessiner une parcelle</strong><br />
              Cliquez pour placer les points.<br />
              Double-clic pour terminer.
            </>
          ) : (
            <>
              <strong style={{ color: theme.colors.text }}>Ajouter un palmier</strong><br />
              Cliquez sur la carte pour placer le palmier.
              {nbCrees > 0 && (
                <div style={{
                  marginTop: 6, color: theme.colors.success, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <CheckCircle2 size={13} /> {nbCrees} palmier(s) créé(s)
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
          backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.lg, padding: 20, width: 300,
          zIndex: 20, maxHeight: "80vh", overflowY: "auto",
          border: `1px solid ${theme.colors.border}`,
        }}>
          <h3 style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: theme.font.size.base, fontWeight: 700,
            color: theme.colors.text, marginBottom: 16,
          }}>
            {mode === "parcelle" ? <LandPlot size={16} /> : <TreePalm size={16} />}
            {mode === "parcelle" ? "Nouvelle parcelle" : "Nouveau palmier"}
          </h3>

          {/* ── Formulaire Parcelle ── */}
          {mode === "parcelle" && (
            <form onSubmit={sauvegarderParcelle}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom *</label>
                <input
                  type="text" value={nomParcelle}
                  onChange={e => setNomParcelle(e.target.value)}
                  required placeholder="Ex: 11B" style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Type</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { value: "parcelle", label: "Parcelle" },
                    { value: "zone",     label: "Zone"     },
                    { value: "ferme",    label: "Ferme"    },
                  ].map(({ value, label }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setTypeParcelle(value)}
                      style={{
                        flex: 1, padding: "6px 4px",
                        borderRadius: theme.radius.sm,
                        border: `1px solid ${typeParcelle === value
                          ? theme.colors.primary : theme.colors.border}`,
                        backgroundColor: typeParcelle === value
                          ? theme.colors.primary : theme.colors.surface,
                        color: typeParcelle === value ? "white" : theme.colors.textSecondary,
                        cursor: "pointer", fontSize: theme.font.size.xs, fontWeight: 600,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Statut</label>
                <select value={statutParcelle}
                  onChange={e => setStatutParcelle(e.target.value)} style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="en_repos">En repos</option>
                  <option value="abandonnee">Abandonnée</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Propriétaire</label>
                <input type="text" value={proprietaire}
                  onChange={e => setProprietaire(e.target.value)}
                  placeholder="Nom du propriétaire" style={inputStyle}
                />
              </div>

              <FormMessages error={error} success={success} />

              <div style={{ display: "flex", gap: 8 }}>
                <Button type="button" variant="secondary"
                  onClick={annulerDessin} style={{ flex: 1 }}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary"
                  disabled={isSubmitting || !nomParcelle.trim()}
                  style={{ flex: 2 }}>
                  {isSubmitting ? "Création..." : "Créer la parcelle"}
                </Button>
              </div>
            </form>
          )}

          {/* ── Formulaire Palmier ── */}
          {mode === "palm" && (
            <form onSubmit={sauvegarderPalm}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 8, marginBottom: 12,
              }}>
                <div>
                  <label style={labelStyle}>État sanitaire</label>
                  <select value={etatSante}
                    onChange={e => setEtatSante(e.target.value)} style={inputStyle}>
                    <option value="B">Bon</option>
                    <option value="MO">Moyen</option>
                    <option value="MA">Mauvais</option>
                    <option value="MR">Mort</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>État site</label>
                  <select value={etatSite}
                    onChange={e => setEtatSite(e.target.value)} style={inputStyle}>
                    <option value="ISO">Isolé</option>
                    <option value="TOF">Touffes</option>
                    <option value="V">Vide</option>
                  </select>
                </div>
              </div>

              {etatSite !== "V" ? (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: 8, marginBottom: 12,
                }}>
                  <div>
                    <label style={labelStyle}>Sexe</label>
                    <select value={sexePalm}
                      onChange={e => setSexePalm(e.target.value)} style={inputStyle}>
                      <option value="M">Mâle</option>
                      <option value="F">Femelle</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Âge</label>
                    <select value={agePalm}
                      onChange={e => setAgePalm(e.target.value)} style={inputStyle}>
                      <option value="JP">Jeune</option>
                      <option value="A">Adulte</option>
                      <option value="V">Vieux</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 6,
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm, padding: 8,
                  fontSize: theme.font.size.xs,
                  color: theme.colors.textSecondary, marginBottom: 12,
                }}>
                  <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  Site vide — sexe et âge non applicables
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Variété</label>
                <input type="text" value={varietePalm}
                  onChange={e => setVarietePalm(e.target.value)}
                  placeholder="Ex: NJD, SAIR..." style={inputStyle}
                />
              </div>

              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 8, marginBottom: 12,
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

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Code local</label>
                <input type="text" value={codeLocalPalm}
                  onChange={e => setCodeLocalPalm(e.target.value)} style={inputStyle} />
              </div>

              {etatSite === "TOF" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>
                    Nombre de rejets
                    <span style={{
                      fontSize: "10px", color: theme.colors.textMuted,
                      fontWeight: 400, marginLeft: 6,
                    }}>
                      (touffes uniquement)
                    </span>
                  </label>
                  <input type="number" value={nombreRejets}
                    onChange={e => setNombreRejets(e.target.value)}
                    min="0" max="50" placeholder="Ex: 3" style={inputStyle}
                  />
                </div>
              )}

              <FormMessages
                error={error}
                success={success && `${success}${nbCrees > 0 ? ` (${nbCrees} créé(s))` : ""}`}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <Button type="button" variant="secondary"
                  onClick={annulerDessin} style={{ flex: 1 }}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary"
                  disabled={isSubmitting}
                  style={{ flex: 2, backgroundColor: theme.colors.accent }}>
                  {isSubmitting ? "Création..." : "Créer le palmier"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}

function FormMessages({ error, success }) {
  return (
    <>
      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 6,
          borderLeft: `3px solid ${theme.colors.danger}`,
          backgroundColor: "#FEF2F2", borderRadius: theme.radius.sm,
          padding: "8px 10px", marginBottom: 12,
          fontSize: theme.font.size.xs, color: theme.colors.danger,
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}
      {success && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 6,
          borderLeft: `3px solid ${theme.colors.success}`,
          backgroundColor: "#F0FDF4", borderRadius: theme.radius.sm,
          padding: "8px 10px", marginBottom: 12,
          fontSize: theme.font.size.xs, color: theme.colors.success,
        }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {success}
        </div>
      )}
    </>
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