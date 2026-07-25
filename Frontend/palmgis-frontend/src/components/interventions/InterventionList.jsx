import { useState, useEffect } from "react";
import {
  getInterventionsByParcelle,
  getInterventionsByPalm
} from "../../api/interventions";

export default function InterventionList({ parcelle, palm, onClose }) {

  const [interventions, setInterventions] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    async function charger() {
      setIsLoading(true);
      setError(null);
      try {
        let data;
        if (palm) {
          data = await getInterventionsByPalm(palm.properties.id);
        } else {
          data = await getInterventionsByParcelle(parcelle.properties.id);
        }
        // Gère la pagination DRF
        const liste = data.results || data;
        setInterventions(Array.isArray(liste) ? liste : []);
      } catch (err) {
        setError("Impossible de charger les interventions.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    charger();
  }, [parcelle, palm]);

  // Labels lisibles
  const labelStatut = (statut) => ({
    active:     "✅ Active",
    en_repos:   "⏸️ En repos",
    abandonnee: "❌ Abandonnée",
  })[statut] || statut;

  // Formate la date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-MA", {
      day:   "2-digit",
      month: "2-digit",
      year:  "numeric",
      hour:  "2-digit",
      minute:"2-digit",
    });
  };

  return (
    <div style={{ padding: "1rem" }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem"
      }}>
        <div>
          <p style={{
            fontSize: "0.7rem", color: "#9ca3af",
            textTransform: "uppercase", fontWeight: 600,
            letterSpacing: "0.05em", marginBottom: "0.1rem"
          }}>
            Historique
          </p>
          <h2 style={{
            fontSize: "0.95rem", fontWeight: "bold", color: "#2E5E3E"
          }}>
            {palm
              ? `🌴 ${parcelle?.properties?.nom}_${palm.properties.code_local}`
              : `📐 ${parcelle?.properties?.nom}`
            }
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none",
            cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af"
          }}
        >
          ✕
        </button>
      </div>

      {/* Chargement */}
      {isLoading && (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", textAlign: "center",
                    padding: "1rem" }}>
          Chargement...
        </p>
      )}

      {/* Erreur */}
      {error && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "0.4rem", padding: "0.5rem 0.75rem",
          fontSize: "0.8rem", color: "#dc2626"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Liste vide */}
      {!isLoading && !error && interventions.length === 0 && (
        <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Aucune intervention enregistrée.
          </p>
        </div>
      )}

      {/* Liste des interventions */}
      {!isLoading && interventions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {interventions.map((intervention) => (
            <div key={intervention.id} style={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "0.75rem",
            }}>
              {/* Type + date */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: "0.4rem"
              }}>
                <span style={{
                  fontSize: "0.85rem", fontWeight: 700,
                  color: "#2E5E3E"
                }}>
                  {intervention.type_intervention_nom ||
                   intervention.type_intervention}
                </span>
                <span style={{
                  fontSize: "0.72rem", color: "#9ca3af",
                  textAlign: "right", flexShrink: 0, marginLeft: "0.5rem"
                }}>
                  {formatDate(intervention.date_intervention)}
                </span>
              </div>

              {/* Quantité */}
              {intervention.quantite && (
                <p style={{ fontSize: "0.78rem", color: "#6b7280",
                            marginBottom: "0.25rem" }}>
                  Quantité : <strong>{intervention.quantite}</strong>
                </p>
              )}

              {/* Opérateur */}
              {intervention.operateur_username && (
                <p style={{ fontSize: "0.78rem", color: "#6b7280",
                            marginBottom: "0.25rem" }}>
                  Par : <strong>{intervention.operateur_username}</strong>
                </p>
              )}

              {/* Description */}
              {intervention.description && (
                <p style={{
                  fontSize: "0.78rem", color: "#374151",
                  marginTop: "0.25rem", fontStyle: "italic"
                }}>
                  "{intervention.description}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}