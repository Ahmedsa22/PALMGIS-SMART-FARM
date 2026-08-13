import { useState } from "react";
import { updateParcelle } from "../../api/parcelles";

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

  const inputStyle = {
    width: "100%", padding: "0.5rem",
    borderRadius: "0.4rem", border: "1px solid #d1d5db",
    fontSize: "0.82rem", boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", fontSize: "0.75rem",
    fontWeight: 600, color: "#374151",
    marginBottom: "0.2rem",
  };

  return (
    <div style={{ padding: "1rem" }}>

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
            Modifier
          </p>
          <h2 style={{
            fontSize: "1rem", fontWeight: "bold", color: "#2E5E3E",
          }}>
            📐 {p.nom}
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

      <form onSubmit={handleSubmit}>

        {/* Nom */}
        <div style={{ marginBottom: "0.75rem" }}>
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
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Statut</label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            style={inputStyle}
          >
            <option value="active">✅ Active</option>
            <option value="en_repos">⏸️ En repos</option>
            <option value="abandonnee">❌ Abandonnée</option>
          </select>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Type</label>
          <select
            value={typeParcelle}
            onChange={e => setTypeParcelle(e.target.value)}
            style={inputStyle}
          >
            <option value="parcelle">🌿 Parcelle</option>
            <option value="zone">📍 Zone</option>
            <option value="ferme">🏡 Ferme</option>
          </select>
        </div>

        {/* Propriétaire */}
        <div style={{ marginBottom: "0.75rem" }}>
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
        <div style={{ marginBottom: "1rem" }}>
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
          <div style={{
            backgroundColor: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: "0.4rem", padding: "0.5rem",
            marginBottom: "0.75rem", fontSize: "0.8rem", color: "#dc2626",
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
              flex: 1, padding: "0.6rem", borderRadius: "0.4rem",
              backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
              cursor: "pointer", fontSize: "0.82rem", color: "#374151",
              fontWeight: 600,
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !nom.trim()}
            style={{
              flex: 2, padding: "0.6rem", borderRadius: "0.4rem",
              backgroundColor: isSubmitting ? "#9ca3af" : "#2E5E3E",
              border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "0.82rem", color: "white", fontWeight: 600,
            }}
          >
            {isSubmitting ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </div>

      </form>
    </div>
  );
}