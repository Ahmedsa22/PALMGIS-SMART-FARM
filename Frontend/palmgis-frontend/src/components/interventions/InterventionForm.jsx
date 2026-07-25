import { useState, useEffect } from "react";
import { getTypesIntervention, createIntervention } from "../../api/interventions";
import useAuthStore from "../../store/authStore";

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
        padding: "2rem 1rem", textAlign: "center"
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
        <p style={{ fontWeight: 600, color: "#2E5E3E", fontSize: "0.95rem" }}>
          Intervention enregistrée !
        </p>
      </div>
    );
  }

  // ─── Formulaire ───
  return (
    <div style={{ padding: "1rem" }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem"
      }}>
        <h2 style={{ fontWeight: "bold", color: "#2E5E3E", fontSize: "0.95rem" }}>
          ➕ Nouvelle intervention
        </h2>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "none",
            cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af"
          }}
        >
          ✕
        </button>
      </div>

      {/* Contexte */}
      <div style={{
        backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
        marginBottom: "1rem", fontSize: "0.8rem", color: "#166534"
      }}>
        {palm
          ? `🌴 Palmier : ${parcelle?.properties?.nom}_${palm.properties.code_local}`
          : `📐 Parcelle : ${parcelle?.properties?.nom}`
        }
      </div>

      <form onSubmit={handleSubmit}>

        {/* Type d'intervention */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{
            display: "block", fontSize: "0.8rem",
            color: "#374151", fontWeight: 600, marginBottom: "0.25rem"
          }}>
            Type d'intervention *
          </label>
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            required
            style={{
              width: "100%", padding: "0.5rem",
              borderRadius: "0.4rem", border: "1px solid #d1d5db",
              fontSize: "0.85rem", backgroundColor: "white"
            }}
          >
            {types.map(t => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
          {/* Période recommandée */}
          {typeSelectionne && (
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
              📅 Période recommandée : mois {typeSelectionne.mois_debut}
              → {typeSelectionne.mois_fin}
            </p>
          )}
        </div>

        {/* Date */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{
            display: "block", fontSize: "0.8rem",
            color: "#374151", fontWeight: 600, marginBottom: "0.25rem"
          }}>
            Date et heure *
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{
              width: "100%", padding: "0.5rem",
              borderRadius: "0.4rem", border: "1px solid #d1d5db",
              fontSize: "0.85rem"
            }}
          />
        </div>

        {/* Quantité */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{
            display: "block", fontSize: "0.8rem",
            color: "#374151", fontWeight: 600, marginBottom: "0.25rem"
          }}>
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
            style={{
              width: "100%", padding: "0.5rem",
              borderRadius: "0.4rem", border: "1px solid #d1d5db",
              fontSize: "0.85rem"
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{
            display: "block", fontSize: "0.8rem",
            color: "#374151", fontWeight: 600, marginBottom: "0.25rem"
          }}>
            Observations (optionnel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes sur l'intervention..."
            rows={3}
            style={{
              width: "100%", padding: "0.5rem",
              borderRadius: "0.4rem", border: "1px solid #d1d5db",
              fontSize: "0.85rem", resize: "vertical"
            }}
          />
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            backgroundColor: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: "0.4rem", padding: "0.5rem 0.75rem",
            marginBottom: "0.75rem", fontSize: "0.8rem", color: "#dc2626"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: "0.6rem",
              borderRadius: "0.4rem",
              backgroundColor: "#f3f4f6",
              border: "1px solid #e5e7eb",
              cursor: "pointer", fontSize: "0.85rem",
              color: "#374151", fontWeight: 600
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !typeId}
            style={{
              flex: 2, padding: "0.6rem",
              borderRadius: "0.4rem",
              backgroundColor: isSubmitting ? "#9ca3af" : "#2E5E3E",
              border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "0.85rem", color: "white", fontWeight: 600
            }}
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

      </form>
    </div>
  );
}