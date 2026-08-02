import { useState } from "react";
import { genererCarte } from "../../api/parcelles";

export default function CarteForm({ parcelle, onCancel }) {
  const p = parcelle.properties;

  const [orientation, setOrientation] = useState("portrait");
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
        parcelle_id: p.id,
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

  const inputStyle = {
    width: "100%", padding: "0.4rem 0.6rem",
    borderRadius: "0.4rem", border: "1px solid #d1d5db",
    fontSize: "0.8rem", boxSizing: "border-box",
    backgroundColor: "white",
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
            Générer
          </p>
          <h2 style={{
            fontSize: "1rem", fontWeight: "bold", color: "#2E5E3E",
          }}>
            🗺️ Carte PDF
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

      {/* Contexte */}
      <div style={{
        backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
        marginBottom: "1rem", fontSize: "0.78rem", color: "#166534",
      }}>
        📐 Parcelle : <strong>{p.nom}</strong> — {p.superficie_ha} ha
      </div>

      <form onSubmit={handleGenerer}>

        {/* Titre */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Titre de la carte</label>
          <input
            type="text"
            value={titre}
            onChange={e => setTitre(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Type de carte */}
        <div style={{ marginBottom: "0.75rem" }}>
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
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Orientation</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["portrait", "landscape"].map(o => (
              <button
                key={o}
                type="button"
                onClick={() => setOrientation(o)}
                style={{
                  flex: 1, padding: "0.5rem",
                  borderRadius: "0.4rem",
                  border: `2px solid ${orientation === o ? "#2E5E3E" : "#e5e7eb"}`,
                  backgroundColor: orientation === o ? "#2E5E3E" : "white",
                  color: orientation === o ? "white" : "#374151",
                  cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                }}
              >
                {o === "portrait" ? "📄 Portrait" : "📋 Paysage"}
              </button>
            ))}
          </div>
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
            disabled={isLoading}
            style={{
              flex: 2, padding: "0.6rem", borderRadius: "0.4rem",
              backgroundColor: isLoading ? "#9ca3af" : "#2E5E3E",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "0.82rem", color: "white", fontWeight: 600,
            }}
          >
            {isLoading ? "Génération..." : "🗺️ Télécharger PDF"}
          </button>
        </div>

      </form>
    </div>
  );
}