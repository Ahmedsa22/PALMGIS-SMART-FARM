import { useState, useEffect } from "react";
import { History, X, Inbox, AlertTriangle, TreePalm, LandPlot } from "lucide-react";
import {
  getInterventionsByParcelle,
  getInterventionsByPalm
} from "../../api/interventions";
import { theme } from "../../styles/theme";
import { SectionTitle } from "../ui/Badge";

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
    <div style={{ padding: 16 }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <div>
          <SectionTitle style={{ marginBottom: 4 }}>
            <History size={11} style={{ marginRight: 4, verticalAlign: -1 }} /> Historique
          </SectionTitle>
          <h2 style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: theme.font.size.base, fontWeight: 700, color: theme.colors.text,
          }}>
            {palm ? <TreePalm size={15} color={theme.colors.primary} /> : <LandPlot size={15} color={theme.colors.primary} />}
            {palm
              ? `${parcelle?.properties?.nom}_${palm.properties.code_local}`
              : parcelle?.properties?.nom
            }
          </h2>
        </div>
        <button onClick={onClose} style={closeButtonStyle}>
          <X size={18} />
        </button>
      </div>

      {/* Chargement */}
      {isLoading && (
        <p style={{ fontSize: theme.font.size.sm, color: theme.colors.textMuted, textAlign: "center",
                    padding: 16 }}>
          Chargement...
        </p>
      )}

      {/* Erreur */}
      {error && (
        <div style={errorBoxStyle}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Liste vide */}
      {!isLoading && !error && interventions.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <Inbox size={28} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: theme.font.size.sm, color: theme.colors.textMuted }}>
            Aucune intervention enregistrée.
          </p>
        </div>
      )}

      {/* Liste des interventions */}
      {!isLoading && interventions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {interventions.map((intervention) => (
            <div key={intervention.id} style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding: 12,
            }}>
              {/* Type + date */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 6,
              }}>
                <span style={{
                  fontSize: theme.font.size.sm, fontWeight: 700,
                  color: theme.colors.text,
                }}>
                  {intervention.type_intervention_nom ||
                   intervention.type_intervention}
                </span>
                <span style={{
                  fontSize: theme.font.size.xs, color: theme.colors.textMuted,
                  textAlign: "right", flexShrink: 0, marginLeft: 8,
                }}>
                  {formatDate(intervention.date_intervention)}
                </span>
              </div>

              {/* Quantité */}
              {intervention.quantite && (
                <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textSecondary,
                            marginBottom: 4 }}>
                  Quantité : <strong>{intervention.quantite}</strong>
                </p>
              )}

              {/* Opérateur */}
              {intervention.operateur_username && (
                <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textSecondary,
                            marginBottom: 4 }}>
                  Par : <strong>{intervention.operateur_username}</strong>
                </p>
              )}

              {/* Description */}
              {intervention.description && (
                <p style={{
                  fontSize: theme.font.size.xs, color: theme.colors.text,
                  marginTop: 4, fontStyle: "italic"
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
  fontSize: theme.font.size.xs, color: theme.colors.danger,
};
