import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getInterventions,
  getTypesIntervention,
  deleteIntervention,
} from "../api/interventions";
import { getParcelles } from "../api/parcelles";
import useAuthStore from "../store/authStore";
import Navbar from "../components/layout/Navbar";

export default function InterventionsPage() {
  const navigate = useNavigate();
  const user     = useAuthStore((state) => state.user);

  const [interventions, setInterventions] = useState([]);
  const [count, setCount]                 = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [types, setTypes]                 = useState([]);
  const [parcelles, setParcelles]         = useState([]);
  const [message, setMessage]             = useState(null);

  // Filtres
  const [filtreType, setFiltreType]         = useState("");
  const [filtreParcelle, setFiltreParcelle] = useState("");
  const [filtreDateDebut, setFiltreDateDebut] = useState("");
  const [filtreDateFin, setFiltreDateFin]     = useState("");

  // Charge les données de référence au montage
  useEffect(() => {
    async function chargerRefs() {
      try {
        const [dataTypes, dataParcelles] = await Promise.all([
          getTypesIntervention({ actif: true }),
          getParcelles(),
        ]);
        setTypes(Array.isArray(dataTypes.results) ? dataTypes.results : dataTypes);
        const feats = dataParcelles?.features || [];
        setParcelles(feats.map(f => ({
          id: f.properties.id || f.id,
          nom: f.properties.nom,
        })));
      } catch (err) {
        console.error("Erreur chargement refs:", err);
      }
    }
    chargerRefs();
  }, []);

  const charger = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filtreType)       params.type_intervention = filtreType;
      if (filtreParcelle)   params.parcelle          = filtreParcelle;
      if (filtreDateDebut)  params.date_intervention_after  = filtreDateDebut;
      if (filtreDateFin)    params.date_intervention_before = filtreDateFin;

      const data = await getInterventions(params);
      setCount(data.count || 0);
      setInterventions(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("Erreur chargement interventions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filtreType, filtreParcelle, filtreDateDebut, filtreDateFin]);

  useEffect(() => { charger(); }, [charger]);

  async function handleSupprimer(id) {
    if (!window.confirm("Supprimer cette intervention ?")) return;
    try {
      await deleteIntervention(id);
      setMessage("✅ Intervention supprimée");
      charger();
    } catch (err) {
      setMessage("❌ Erreur lors de la suppression");
    }
    setTimeout(() => setMessage(null), 3000);
  }

  function resetFiltres() {
    setFiltreType("");
    setFiltreParcelle("");
    setFiltreDateDebut("");
    setFiltreDateFin("");
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-MA", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", backgroundColor: "#f9fafb",
      overflow: "hidden",
    }}>
      <Navbar />

      {/* En-tête */}
      <div style={{
        backgroundColor: "white", padding: "1rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2E5E3E" }}>
            📋 Interventions
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.1rem" }}>
            {count} intervention(s) trouvée(s)
          </p>
        </div>
        <button
          onClick={() => navigate("/map")}
          style={{
            padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
            backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
            cursor: "pointer", fontSize: "0.8rem", color: "#374151",
          }}
        >
          ← Carte
        </button>
      </div>

      {/* Message flash */}
      {message && (
        <div style={{
          backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`,
          color: message.startsWith("✅") ? "#166534" : "#dc2626",
          padding: "0.6rem 1.5rem", fontSize: "0.85rem",
          fontWeight: 500, flexShrink: 0,
        }}>
          {message}
        </div>
      )}

      {/* Filtres */}
      <div style={{
        backgroundColor: "white", padding: "0.75rem 1.5rem",
        borderBottom: "1px solid #f3f4f6",
        display: "flex", gap: "0.75rem", flexWrap: "wrap",
        alignItems: "flex-end", flexShrink: 0,
      }}>

        {/* Filtre type */}
        <div>
          <label style={{
            display: "block", fontSize: "0.72rem",
            color: "#6b7280", marginBottom: "0.2rem", fontWeight: 600,
          }}>
            Type
          </label>
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem", borderRadius: "0.4rem",
              border: "1px solid #d1d5db", fontSize: "0.82rem",
              backgroundColor: "white", minWidth: "150px",
            }}
          >
            <option value="">Tous les types</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.nom}</option>
            ))}
          </select>
        </div>

        {/* Filtre parcelle */}
        <div>
          <label style={{
            display: "block", fontSize: "0.72rem",
            color: "#6b7280", marginBottom: "0.2rem", fontWeight: 600,
          }}>
            Parcelle
          </label>
          <select
            value={filtreParcelle}
            onChange={(e) => setFiltreParcelle(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem", borderRadius: "0.4rem",
              border: "1px solid #d1d5db", fontSize: "0.82rem",
              backgroundColor: "white", minWidth: "130px",
            }}
          >
            <option value="">Toutes</option>
            {parcelles.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>

        {/* Filtre date début */}
        <div>
          <label style={{
            display: "block", fontSize: "0.72rem",
            color: "#6b7280", marginBottom: "0.2rem", fontWeight: 600,
          }}>
            Du
          </label>
          <input
            type="date"
            value={filtreDateDebut}
            onChange={(e) => setFiltreDateDebut(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem", borderRadius: "0.4rem",
              border: "1px solid #d1d5db", fontSize: "0.82rem",
            }}
          />
        </div>

        {/* Filtre date fin */}
        <div>
          <label style={{
            display: "block", fontSize: "0.72rem",
            color: "#6b7280", marginBottom: "0.2rem", fontWeight: 600,
          }}>
            Au
          </label>
          <input
            type="date"
            value={filtreDateFin}
            onChange={(e) => setFiltreDateFin(e.target.value)}
            style={{
              padding: "0.4rem 0.6rem", borderRadius: "0.4rem",
              border: "1px solid #d1d5db", fontSize: "0.82rem",
            }}
          />
        </div>

        {/* Bouton reset */}
        <button
          onClick={resetFiltres}
          style={{
            padding: "0.4rem 0.75rem", borderRadius: "0.4rem",
            backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
            cursor: "pointer", fontSize: "0.82rem", color: "#6b7280",
          }}
        >
          ✕ Réinitialiser
        </button>
      </div>

      {/* Contenu */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "1rem 1.5rem", minHeight: 0,
      }}>

        {/* Chargement */}
        {isLoading && (
          <p style={{
            textAlign: "center", color: "#9ca3af",
            padding: "2rem", fontSize: "0.85rem",
          }}>
            Chargement...
          </p>
        )}

        {/* Liste vide */}
        {!isLoading && interventions.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📭</div>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Aucune intervention trouvée.
            </p>
            <button
              onClick={() => navigate("/map")}
              style={{
                marginTop: "1rem", padding: "0.6rem 1.2rem",
                borderRadius: "0.5rem", backgroundColor: "#2E5E3E",
                border: "none", color: "white", cursor: "pointer",
                fontSize: "0.85rem", fontWeight: 600,
              }}
            >
              ← Retour à la carte pour saisir une intervention
            </button>
          </div>
        )}

        {/* Tableau */}
        {!isLoading && interventions.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: "0.83rem",
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  {[
                    "Type", "Parcelle", "Palmier",
                    "Date", "Quantité", "Opérateur", "Description",
                    user?.role === "manager" ? "Actions" : null,
                  ].filter(Boolean).map(col => (
                    <th key={col} style={{
                      padding: "0.6rem 0.75rem", textAlign: "left",
                      fontSize: "0.72rem", fontWeight: 700,
                      color: "#6b7280", textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: "2px solid #e5e7eb",
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interventions.map((intervention, idx) => (
                  <tr key={intervention.id} style={{
                    backgroundColor: idx % 2 === 0 ? "white" : "#fafafa",
                    borderBottom: "1px solid #f3f4f6",
                  }}>
                    {/* Type */}
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <span style={{
                        backgroundColor: "#f0fdf4",
                        color: "#2E5E3E", fontWeight: 600,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.3rem", fontSize: "0.78rem",
                      }}>
                        {intervention.type_intervention_nom ||
                         intervention.type_intervention}
                      </span>
                    </td>

                    {/* Parcelle */}
                    <td style={{ padding: "0.6rem 0.75rem", color: "#374151" }}>
                      {intervention.parcelle_nom || "—"}
                    </td>

                    {/* Palmier */}
                    <td style={{ padding: "0.6rem 0.75rem", color: "#374151" }}>
                      {intervention.palm_code || "Toute la parcelle"}
                    </td>

                    {/* Date */}
                    <td style={{
                      padding: "0.6rem 0.75rem", color: "#6b7280",
                      whiteSpace: "nowrap",
                    }}>
                      {formatDate(intervention.date_intervention)}
                    </td>

                    {/* Quantité */}
                    <td style={{ padding: "0.6rem 0.75rem", color: "#374151" }}>
                      {intervention.quantite
                        ? `${intervention.quantite}`
                        : "—"
                      }
                    </td>

                    {/* Opérateur */}
                    <td style={{ padding: "0.6rem 0.75rem", color: "#374151" }}>
                      {intervention.operateur_username || "—"}
                    </td>

                    {/* Description */}
                    <td style={{
                      padding: "0.6rem 0.75rem", color: "#6b7280",
                      maxWidth: "200px", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {intervention.description || "—"}
                    </td>

                    {/* Actions — managers seulement */}
                    {user?.role === "manager" && (
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <button
                          onClick={() => handleSupprimer(intervention.id)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.3rem",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            cursor: "pointer",
                            fontSize: "0.75rem", color: "#dc2626",
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}