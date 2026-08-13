import { useState, useEffect } from "react";
import { Plus, X, CheckCircle2, AlertTriangle, Calendar, TreePalm, LandPlot } from "lucide-react";
import { getTypesIntervention, createIntervention } from "../../api/interventions";
import useAuthStore from "../../store/authStore";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";

export default function InterventionForm({ parcelle, palm, onSuccess, onCancel }) {
  const user = useAuthStore((state) => state.user);

  // État du formulaire
  const [types, setTypes]                   = useState([]);
  const [typeId, setTypeId]                 = useState("");
  const [date, setDate]                     = useState(
    new Date().toISOString().slice(0, 16)   // format datetime-local
  );
  const [quantite, setQuantite]             = useState("");
  const [description, setDescription]       = useState("");
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [error, setError]                   = useState(null);
  const [success, setSuccess]               = useState(false);

  // Charge les types d'intervention au montage
  useEffect(() => {
    async function chargerTypes() {
      try {
        const data = await getTypesIntervention({ actif: true });
        // L'API retourne { count, results: [...] } ou directement [...]
        const liste = data.results || data;
        setTypes(liste);
        if (liste.length > 0) setTypeId(liste[0].id);
      } catch (err) {
        console.error("Erreur chargement types :", err);
      }
    }
    chargerTypes();
  }, []);

  // Type sélectionné (pour afficher l'unité de mesure)
  const typeSelectionne = types.find(t => t.id === parseInt(typeId));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!typeId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        type_intervention: parseInt(typeId),
        date_intervention: new Date(date).toISOString(),
        description,
      };

      // Quantité si renseignée
      if (quantite) data.quantite = parseFloat(quantite);

      // Parcelle ou palmier
      if (palm) {
        data.palm = palm.properties.id;
      } else if (parcelle) {
        data.parcelle = parcelle.properties.id;
      }

      await createIntervention(data);
      setSuccess(true);

      // Ferme le formulaire après 1.5s
      setTimeout(() => {
        onSuccess?.();
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Une erreur est survenue."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Message de succès ───
  if (success) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        padding: "32px 16px", textAlign: "center",
      }}>
        <CheckCircle2 size={32} color={theme.colors.success} />
        <p style={{ fontWeight: 600, color: theme.colors.text, fontSize: theme.font.size.base }}>
          Intervention enregistrée !
        </p>
      </div>
    );
  }

  // ─── Formulaire ───
  return (
    <div style={{ padding: 16 }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <h2 style={{
          display: "flex", alignItems: "center", gap: 6,
          fontWeight: 700, color: theme.colors.text, fontSize: theme.font.size.base,
        }}>
          <Plus size={16} color={theme.colors.primary} /> Nouvelle intervention
        </h2>
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
        {palm ? <TreePalm size={14} color={theme.colors.textMuted} /> : <LandPlot size={14} color={theme.colors.textMuted} />}
        {palm
          ? `Palmier : ${parcelle?.properties?.nom}_${palm.properties.code_local}`
          : `Parcelle : ${parcelle?.properties?.nom}`
        }
      </div>

      <form onSubmit={handleSubmit}>

        {/* Type d'intervention */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Type d'intervention *</label>
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            required
            style={inputStyle}
          >
            {types.map(t => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
          {/* Période recommandée */}
          {typeSelectionne && (
            <p style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginTop: 4,
            }}>
              <Calendar size={11} /> Période recommandée : mois {typeSelectionne.mois_debut}
              → {typeSelectionne.mois_fin}
            </p>
          )}
        </div>

        {/* Date */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Date et heure *</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        {/* Quantité */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>
            Quantité
            {typeSelectionne?.unite_mesure
              ? ` (${typeSelectionne.unite_mesure})`
              : " (optionnel)"
            }
          </label>
          <input
            type="number"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            placeholder="Ex: 150"
            min="0"
            step="0.01"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Observations (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes sur l'intervention..."
            rows={3}
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
          <Button type="submit" variant="primary" disabled={isSubmitting || !typeId} style={{ flex: 2 }}>
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
