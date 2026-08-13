import { useState } from "react";
import { LandPlot, X, AlertTriangle } from "lucide-react";
import { updateParcelle } from "../../api/parcelles";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";
import { SectionTitle } from "../ui/Badge";

export default function ParcelleEditForm({ parcelle, onSuccess, onCancel }) {
  const p = parcelle.properties;

  const [nom, setNom]               = useState(p.nom || "");
  const [statut, setStatut]         = useState(p.statut || "active");
  const [proprietaire, setProprietaire] = useState(p.proprietaire || "");
  const [description, setDescription]  = useState(p.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState(null);
  const [typeParcelle, setTypeParcelle] = useState(p.type_parcelle || "parcelle");


  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateParcelle(p.id, {
        nom,
        statut,
        type_parcelle: typeParcelle,
        proprietaire,
        description,
      });
      onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0] ||
        "Erreur lors de la modification."
      );
    } finally {
      setIsSubmitting(false);
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
          <SectionTitle style={{ marginBottom: 4 }}>Modifier</SectionTitle>
          <h2 style={{
            fontSize: theme.font.size.base, fontWeight: 700, color: theme.colors.text,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <LandPlot size={16} color={theme.colors.primary} /> {p.nom}
          </h2>
        </div>
        <button onClick={onCancel} style={closeButtonStyle}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Nom */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nom *</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* Statut */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Statut</label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            style={inputStyle}
          >
            <option value="active">Active</option>
            <option value="en_repos">En repos</option>
            <option value="abandonnee">Abandonnée</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Type</label>
          <select
            value={typeParcelle}
            onChange={e => setTypeParcelle(e.target.value)}
            style={inputStyle}
          >
            <option value="parcelle">Parcelle</option>
            <option value="zone">Zone</option>
            <option value="ferme">Ferme</option>
          </select>
        </div>

        {/* Propriétaire */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Propriétaire</label>
          <input
            type="text"
            value={proprietaire}
            onChange={(e) => setProprietaire(e.target.value)}
            placeholder="Nom du propriétaire"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notes sur cette parcelle..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
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
            disabled={isSubmitting || !nom.trim()}
            style={{ flex: 2 }}
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
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
  fontWeight: 600, color: theme.colors.textSecondary,
  marginBottom: 4,
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
