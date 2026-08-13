import { useState } from "react";
import { FileDown, X, AlertTriangle, LandPlot } from "lucide-react";
import { genererCarte } from "../../api/parcelles";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";
import { SectionTitle } from "../ui/Badge";

export default function CarteForm({ parcelle, onCancel }) {
  const p = parcelle.properties;

  // Récupère l'id à tous les niveaux possibles
  const parcelleId = parcelle?.properties?.id
                  ?? parcelle?.id
                  ?? p?.id;

  const [orientation, setOrientation] = useState("landscape");
  const [titre, setTitre]             = useState(`Carte de la palmeraie ${p.nom}`);
  const [typeCarte, setTypeCarte]     = useState("etat_sanitaire");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);

  async function handleGenerer(e) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await genererCarte({
        parcelle_id: parcelleId,
        type_carte:  typeCarte,
        orientation,
        titre,
      });
    } catch (err) {
      setError("Erreur lors de la génération de la carte.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <div>
          <SectionTitle style={{ marginBottom: 4 }}>Générer</SectionTitle>
          <h2 style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: theme.font.size.base, fontWeight: 700, color: theme.colors.text,
          }}>
            <FileDown size={16} color={theme.colors.primary} /> Carte PDF
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
        Parcelle : <strong style={{ color: theme.colors.text }}>{p.nom}</strong> — {p.superficie_ha} ha
        {!parcelleId && (
          <span style={{ color: theme.colors.danger, marginLeft: 6, fontWeight: 600 }}>
            ID introuvable
          </span>
        )}
      </div>

      <form onSubmit={handleGenerer}>

        {/* Titre */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Titre de la carte</label>
          <input
            type="text"
            value={titre}
            onChange={e => setTitre(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Type de carte */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Type de carte</label>
          <select
            value={typeCarte}
            onChange={e => setTypeCarte(e.target.value)}
            style={inputStyle}
          >
            <option value="etat_sanitaire">État sanitaire</option>
            <option value="plan_masse">Plan de masse</option>
            <option value="age">Âge des palmiers</option>
            <option value="sexe">Répartition sexe</option>
          </select>
        </div>

        {/* Orientation */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Orientation</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "portrait", label: "Portrait" },
              { value: "landscape", label: "Paysage" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setOrientation(value)}
                style={{
                  flex: 1, padding: "8px",
                  borderRadius: theme.radius.md,
                  border: `1px solid ${orientation === value ? theme.colors.primary : theme.colors.border}`,
                  backgroundColor: orientation === value ? theme.colors.primary : theme.colors.surface,
                  color: orientation === value ? "white" : theme.colors.textSecondary,
                  cursor: "pointer", fontSize: theme.font.size.sm, fontWeight: 600,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div style={errorBoxStyle}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={FileDown}
            disabled={isLoading || !parcelleId}
            style={{ flex: 2 }}
          >
            {isLoading ? "Génération..." : "Télécharger PDF"}
          </Button>
        </div>

      </form>
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
