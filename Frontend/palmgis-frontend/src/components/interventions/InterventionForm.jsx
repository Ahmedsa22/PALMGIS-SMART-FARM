import { useState, useEffect } from "react";
import {
  Plus, X, CheckCircle2, AlertTriangle,
  Calendar, TreePalm, LandPlot, Bell,
} from "lucide-react";
import { getTypesIntervention, createIntervention } from "../../api/interventions";
import { getParcelles } from "../../api/parcelles";
import useAuthStore from "../../store/authStore";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";

export default function InterventionForm({
  parcelle: parcelleInitiale,
  palm,
  parcelles: parcellesProps,
  onSuccess,
  onCancel,
}) {
  const user = useAuthStore((state) => state.user);

  const [types, setTypes]               = useState([]);
  const [parcelles, setParcelles]       = useState(parcellesProps || []);
  const [typeId, setTypeId]             = useState("");
  const [parcelleId, setParcelleId]     = useState(
    parcelleInitiale?.properties?.id ?? parcelleInitiale?.id ?? ""
  );
  const [date, setDate]                 = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [quantite, setQuantite]         = useState("");
  const [description, setDescription]   = useState("");

  // Période de notification
  const [activerNotif, setActiverNotif]     = useState(false);
  const [notifDebut, setNotifDebut]         = useState("");
  const [notifFin, setNotifFin]             = useState("");
  const [notifMessage, setNotifMessage]     = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(false);

  // Charge types et parcelles si pas fournis
  useEffect(() => {
    async function charger() {
      try {
        const dataTypes = await getTypesIntervention({ actif: true });
        const liste = dataTypes.results || dataTypes;
        setTypes(liste);
        if (liste.length > 0) setTypeId(liste[0].id);
      } catch (err) {
        console.error("Erreur types:", err);
      }

      // Charge les parcelles si pas déjà fournies via props
      if (!parcellesProps || parcellesProps.length === 0) {
        try {
          const data = await getParcelles();
          const feats = data?.features || [];
          setParcelles(feats.map(f => ({
            id:  f.properties.id || f.id,
            nom: f.properties.nom,
          })));
        } catch (err) {
          console.error("Erreur parcelles:", err);
        }
      }
    }
    charger();
  }, []);

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

      if (quantite) data.quantite = parseFloat(quantite);

      // Palmier ou parcelle
      if (palm) {
        data.palm = palm.properties?.id || palm.id;
      } else if (parcelleId) {
        data.parcelle = parseInt(parcelleId);
      }

      // Période de notification
      if (activerNotif && notifDebut && notifFin) {
        data.notification_debut  = notifDebut;
        data.notification_fin    = notifFin;
        data.notification_message = notifMessage || `Intervention ${typeSelectionne?.nom} prévue`;
      }

      await createIntervention(data);
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1500);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        JSON.stringify(err.response?.data) ||
        "Une erreur est survenue."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 10, padding: "32px 16px", textAlign: "center",
      }}>
        <CheckCircle2 size={32} color={theme.colors.success} />
        <p style={{ fontWeight: 600, color: theme.colors.text, fontSize: theme.font.size.base }}>
          Intervention enregistrée !
        </p>
      </div>
    );
  }

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

      <form onSubmit={handleSubmit}>

        {/* Sélection parcelle — si pas de parcelle/palmier fixe */}
        {!parcelleInitiale && !palm && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>
              <LandPlot size={12} style={{ display: "inline", marginRight: 4 }} />
              Parcelle *
            </label>
            <select
              value={parcelleId}
              onChange={e => setParcelleId(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Sélectionner une parcelle...</option>
              {parcelles.map(p => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
        )}

        {/* Contexte fixe — si parcelle/palmier déjà sélectionné */}
        {(parcelleInitiale || palm) && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: "8px 12px",
            marginBottom: 16, fontSize: theme.font.size.sm,
            color: theme.colors.textSecondary,
          }}>
            {palm
              ? <TreePalm size={14} color={theme.colors.textMuted} />
              : <LandPlot size={14} color={theme.colors.textMuted} />}
            {palm
              ? `Palmier : ${parcelleInitiale?.properties?.nom}_${palm.properties?.code_local}`
              : `Parcelle : ${parcelleInitiale?.properties?.nom}`}
          </div>
        )}

        {/* Type d'intervention */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Type d'intervention *</label>
          <select
            value={typeId}
            onChange={e => setTypeId(e.target.value)}
            required
            style={inputStyle}
          >
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.nom}</option>
            ))}
          </select>
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
            onChange={e => setDate(e.target.value)}
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
              : " (optionnel)"}
          </label>
          <input
            type="number" value={quantite}
            onChange={e => setQuantite(e.target.value)}
            placeholder="Ex: 150" min="0" step="0.01"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Observations (optionnel)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Notes sur l'intervention..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* ── Période de notification ── */}
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: 12, marginBottom: 16,
          backgroundColor: theme.colors.bg,
        }}>
          {/* Toggle */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: activerNotif ? 12 : 0,
          }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: theme.font.size.sm, fontWeight: 600,
              color: theme.colors.text, cursor: "pointer",
            }}>
              <Bell size={14} color={theme.colors.primary} />
              Générer des notifications
            </label>
            <button
              type="button"
              onClick={() => setActiverNotif(!activerNotif)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                border: "none", cursor: "pointer",
                backgroundColor: activerNotif
                  ? theme.colors.primary : theme.colors.borderStrong,
                position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute",
                top: 3, left: activerNotif ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%",
                backgroundColor: "white",
                transition: "left 0.2s",
              }} />
            </button>
          </div>

          {/* Champs notification */}
          {activerNotif && (
            <>
              <p style={{
                fontSize: theme.font.size.xs, color: theme.colors.textMuted,
                marginBottom: 10,
              }}>
                Des notifications seront générées automatiquement pour toutes
                les parcelles pendant la période définie.
              </p>

              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 8, marginBottom: 8,
              }}>
                <div>
                  <label style={labelStyle}>Date début *</label>
                  <input
                    type="date" value={notifDebut}
                    onChange={e => setNotifDebut(e.target.value)}
                    required={activerNotif}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Date fin *</label>
                  <input
                    type="date" value={notifFin}
                    onChange={e => setNotifFin(e.target.value)}
                    required={activerNotif}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Message de notification (optionnel)</label>
                <input
                  type="text" value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  placeholder={`Ex: Période de ${typeSelectionne?.nom || "l'intervention"}`}
                  style={inputStyle}
                />
              </div>
            </>
          )}
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
            type="submit" variant="primary"
            disabled={isSubmitting || !typeId}
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
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.colors.borderStrong}`,
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
  background: "none", border: "none", cursor: "pointer",
  color: theme.colors.textMuted, width: 28, height: 28,
};

const errorBoxStyle = {
  display: "flex", alignItems: "flex-start", gap: 6,
  borderLeft: `3px solid ${theme.colors.danger}`,
  backgroundColor: "#FEF2F2", borderRadius: theme.radius.sm,
  padding: "8px 10px", marginBottom: 12,
  fontSize: theme.font.size.xs, color: theme.colors.danger,
};