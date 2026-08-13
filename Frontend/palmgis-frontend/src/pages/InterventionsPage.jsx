import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, ChevronLeft, X, Trash2, Inbox, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getInterventions,
  getTypesIntervention,
  deleteIntervention,
} from "../api/interventions";
import { getParcelles } from "../api/parcelles";
import useAuthStore from "../store/authStore";
import Navbar from "../components/layout/Navbar";
import { theme } from "../styles/theme";
import Button from "../components/ui/Button";

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
      setMessage({ type: "success", text: "Intervention supprimée" });
      charger();
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la suppression" });
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

  const columns = [
    "Type", "Parcelle", "Palmier",
    "Date", "Quantité", "Opérateur", "Description",
    user?.role === "manager" ? "Actions" : null,
  ].filter(Boolean);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", backgroundColor: theme.colors.bg,
      overflow: "hidden", fontFamily: theme.font.family,
    }}>
      <Navbar />

      {/* En-tête */}
      <div style={{
        backgroundColor: theme.colors.surface, padding: "16px 24px",
        borderBottom: `1px solid ${theme.colors.border}`,
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <h1 style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: theme.font.size.lg, fontWeight: 700, color: theme.colors.text,
          }}>
            <Wrench size={18} color={theme.colors.primary} /> Interventions
          </h1>
          <p style={{ fontSize: theme.font.size.sm, color: theme.colors.textMuted, marginTop: 2 }}>
            {count} intervention(s) trouvée(s)
          </p>
        </div>
        <Button variant="secondary" icon={ChevronLeft} fullWidth={false} onClick={() => navigate("/map")}>
          Carte
        </Button>
      </div>

      {/* Message flash */}
      {message && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          backgroundColor: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
          borderLeft: `3px solid ${message.type === "success" ? theme.colors.success : theme.colors.danger}`,
          color: message.type === "success" ? theme.colors.success : theme.colors.danger,
          padding: "10px 24px", fontSize: theme.font.size.sm,
          fontWeight: 500, flexShrink: 0,
        }}>
          {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Filtres */}
      <div style={{
        backgroundColor: theme.colors.surface, padding: "12px 24px",
        borderBottom: `1px solid ${theme.colors.border}`,
        display: "flex", gap: 12, flexWrap: "wrap",
        alignItems: "flex-end", flexShrink: 0,
      }}>

        {/* Filtre type */}
        <div>
          <label style={filterLabelStyle}>Type</label>
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            style={{ ...filterInputStyle, minWidth: 150 }}
          >
            <option value="">Tous les types</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.nom}</option>
            ))}
          </select>
        </div>

        {/* Filtre parcelle */}
        <div>
          <label style={filterLabelStyle}>Parcelle</label>
          <select
            value={filtreParcelle}
            onChange={(e) => setFiltreParcelle(e.target.value)}
            style={{ ...filterInputStyle, minWidth: 130 }}
          >
            <option value="">Toutes</option>
            {parcelles.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>

        {/* Filtre date début */}
        <div>
          <label style={filterLabelStyle}>Du</label>
          <input
            type="date"
            value={filtreDateDebut}
            onChange={(e) => setFiltreDateDebut(e.target.value)}
            style={filterInputStyle}
          />
        </div>

        {/* Filtre date fin */}
        <div>
          <label style={filterLabelStyle}>Au</label>
          <input
            type="date"
            value={filtreDateFin}
            onChange={(e) => setFiltreDateFin(e.target.value)}
            style={filterInputStyle}
          />
        </div>

        {/* Bouton reset */}
        <Button variant="secondary" icon={X} fullWidth={false} onClick={resetFiltres}>
          Réinitialiser
        </Button>
      </div>

      {/* Contenu */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px 24px", minHeight: 0,
      }}>

        {/* Chargement */}
        {isLoading && (
          <p style={{
            textAlign: "center", color: theme.colors.textMuted,
            padding: 32, fontSize: theme.font.size.sm,
          }}>
            Chargement...
          </p>
        )}

        {/* Liste vide */}
        {!isLoading && interventions.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Inbox size={40} color={theme.colors.textMuted} style={{ marginBottom: 12 }} />
            <p style={{ color: theme.colors.textMuted, fontSize: theme.font.size.base }}>
              Aucune intervention trouvée.
            </p>
            <Button
              variant="primary"
              icon={ChevronLeft}
              fullWidth={false}
              onClick={() => navigate("/map")}
              style={{ marginTop: 16 }}
            >
              Retour à la carte pour saisir une intervention
            </Button>
          </div>
        )}

        {/* Tableau */}
        {!isLoading && interventions.length > 0 && (
          <div style={{
            overflowX: "auto", backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg,
          }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: theme.font.size.sm,
            }}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} style={thStyle}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interventions.map((intervention) => (
                  <tr
                    key={intervention.id}
                    style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.colors.bg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    {/* Type */}
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontWeight: 600, fontSize: theme.font.size.xs,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: theme.colors.primary,
                        }} />
                        {intervention.type_intervention_nom ||
                         intervention.type_intervention}
                      </span>
                    </td>

                    {/* Parcelle */}
                    <td style={tdStyle}>{intervention.parcelle_nom || "—"}</td>

                    {/* Palmier */}
                    <td style={tdStyle}>{intervention.palm_code || "Toute la parcelle"}</td>

                    {/* Date */}
                    <td style={{ ...tdStyle, color: theme.colors.textMuted, whiteSpace: "nowrap" }}>
                      {formatDate(intervention.date_intervention)}
                    </td>

                    {/* Quantité */}
                    <td style={tdStyle}>{intervention.quantite ?? "—"}</td>

                    {/* Opérateur */}
                    <td style={tdStyle}>{intervention.operateur_username || "—"}</td>

                    {/* Description */}
                    <td style={{
                      ...tdStyle, color: theme.colors.textMuted,
                      maxWidth: 200, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {intervention.description || "—"}
                    </td>

                    {/* Actions — managers seulement */}
                    {user?.role === "manager" && (
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleSupprimer(intervention.id)}
                          style={deleteButtonStyle}
                        >
                          <Trash2 size={12} /> Supprimer
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

const filterLabelStyle = {
  display: "block", fontSize: theme.font.size.xs,
  color: theme.colors.textSecondary, marginBottom: 4, fontWeight: 600,
};

const filterInputStyle = {
  padding: "8px 10px", borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.borderStrong}`, fontSize: theme.font.size.sm,
  backgroundColor: theme.colors.surface, outline: "none",
  fontFamily: theme.font.family,
};

const thStyle = {
  padding: "10px 12px", textAlign: "left",
  fontSize: "11px", fontWeight: 600,
  color: theme.colors.textMuted, textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: `1px solid ${theme.colors.border}`,
};

const tdStyle = {
  padding: "10px 12px", color: theme.colors.text,
};

const deleteButtonStyle = {
  display: "flex", alignItems: "center", gap: 4,
  padding: "4px 8px", borderRadius: theme.radius.sm,
  backgroundColor: "transparent",
  border: `1px solid ${theme.colors.danger}`,
  cursor: "pointer", fontSize: theme.font.size.xs, color: theme.colors.danger,
  fontWeight: 600,
};
