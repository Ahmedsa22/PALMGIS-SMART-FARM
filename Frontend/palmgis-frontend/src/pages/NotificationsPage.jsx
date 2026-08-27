import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, ChevronLeft, Zap, Inbox, CheckCircle2, AlertTriangle, Check, Pause, X,
  Sprout, LandPlot,
} from "lucide-react";
import {
  getNotifications,
  traiterNotification,
  reporterNotification,
  ignorerNotification,
  genererNotifications,
} from "../api/notifications";
import useAuthStore from "../store/authStore";
import Navbar from "../components/layout/Navbar";
import { theme } from "../styles/theme";
import Button from "../components/ui/Button";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const user     = useAuthStore((state) => state.user);

  const [notifications, setNotifications] = useState([]);
  const [count, setCount]                 = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [filtreStatut, setFiltreStatut]   = useState("en_attente");
  const [isGenerating, setIsGenerating]   = useState(false);
  const [message, setMessage]             = useState(null);

  async function charger() {
    setIsLoading(true);
    try {
      const data = await getNotifications(
        filtreStatut ? { statut: filtreStatut } : {}
      );
      setCount(data.count || 0);
      const liste = Array.isArray(data.results) ? data.results : [];
      setNotifications(liste);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    async function initialiser() {
      try {
        await genererNotifications();
      } catch (err) {
        console.error("Erreur génération auto:", err);
      }
      charger();
    }
    initialiser();
  }, []); 

  useEffect(() => {
    charger();
  }, [filtreStatut]);

  async function handleTraiter(id) {
    try {
      await traiterNotification(id);
      setMessage({ type: "success", text: "Notification traitée — intervention créée automatiquement" });
      charger();
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors du traitement" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleReporter(id) {
    try {
      await reporterNotification(id);
      charger();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleIgnorer(id) {
    try {
      await ignorerNotification(id);
      charger();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGenerer() {
    setIsGenerating(true);
    try {
      const result = await genererNotifications();
      setMessage({ type: "success", text: `${result.created} notification(s) générée(s)` });
      charger();
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la génération" });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const couleurPriorite = {
    haute:   theme.colors.danger,
    normale: theme.colors.warning,
    basse:   theme.colors.textMuted,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-MA", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", backgroundColor: theme.colors.bg,
      overflow: "hidden", fontFamily: theme.font.family,
    }}>

      <Navbar />

      {/* En-tête page */}
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
            <Bell size={18} color={theme.colors.primary} /> Notifications
          </h1>
          <p style={{ fontSize: theme.font.size.sm, color: theme.colors.textMuted, marginTop: 2 }}>
            {count} notification(s) — filtre : {filtreStatut || "toutes"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button variant="secondary" icon={ChevronLeft} fullWidth={false} onClick={() => navigate("/map")}>
            Carte
          </Button>
          {user?.role === "manager" && (
            <Button variant="primary" icon={Zap} fullWidth={false} onClick={handleGenerer} disabled={isGenerating}>
              {isGenerating ? "Génération..." : "Générer rappels"}
            </Button>
          )}
        </div>
      </div>

      {/* Message flash */}
      {message && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          backgroundColor: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
          borderLeft: `3px solid ${message.type === "success" ? theme.colors.success : theme.colors.danger}`,
          color: message.type === "success" ? theme.colors.success : theme.colors.danger,
          padding: "10px 24px", fontSize: theme.font.size.sm, fontWeight: 500,
          flexShrink: 0,
        }}>
          {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Filtres */}
      <div style={{
        padding: "12px 24px", backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        display: "flex", gap: 8, flexWrap: "wrap",
        flexShrink: 0,
      }}>
        {[
          { label: "En attente", value: "en_attente" },
          { label: "Traitées",   value: "traitee"    },
          { label: "Reportées",  value: "reportee"   },
          { label: "Ignorées",   value: "ignoree"    },
          { label: "Toutes",     value: ""           },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFiltreStatut(value)}
            style={{
              padding: "6px 12px", borderRadius: theme.radius.lg,
              border: `1px solid ${filtreStatut === value ? theme.colors.primary : theme.colors.border}`,
              backgroundColor: filtreStatut === value ? theme.colors.primary : theme.colors.surface,
              color: filtreStatut === value ? "white" : theme.colors.textSecondary,
              cursor: "pointer", fontSize: theme.font.size.sm, fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenu scrollable */}
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
        {!isLoading && notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Inbox size={40} color={theme.colors.textMuted} style={{ marginBottom: 12 }} />
            <p style={{ color: theme.colors.textMuted, fontSize: theme.font.size.base }}>
              Aucune notification pour ce filtre.
            </p>
            {user?.role === "manager" && (
            <Button
              variant="secondary"
              icon={Zap}
              fullWidth={false}
              onClick={handleGenerer}
              disabled={isGenerating}
            >
              {isGenerating ? "Actualisation..." : "Actualiser"}
            </Button>
          )}
          </div>
        )}

        {/* Liste des notifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((n) => {
            const couleur  = couleurPriorite[n.priorite] || couleurPriorite.basse;
            const enRetard = n.est_en_retard;

            return (
              <div key={n.id} style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderLeft: `3px solid ${enRetard ? theme.colors.danger : couleur}`,
                borderRadius: theme.radius.md, padding: 16,
                position: "relative",
              }}>

                {/* Badge en retard */}
                {enRetard && (
                  <span style={{
                    position: "absolute", top: -8, right: 16,
                    backgroundColor: theme.colors.danger, color: "white",
                    fontSize: "10px", fontWeight: 700,
                    padding: "2px 8px", borderRadius: theme.radius.lg,
                    letterSpacing: "0.5px",
                  }}>
                    EN RETARD
                  </span>
                )}

                {/* En-tête notification */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: 8,
                }}>
                  <div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: theme.font.size.xs, fontWeight: 700,
                      color: couleur, textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: couleur }} />
                      {n.priorite}
                    </span>
                    <p style={{
                      fontSize: theme.font.size.sm, fontWeight: 600,
                      color: theme.colors.text, marginTop: 2,
                    }}>
                      {n.message || "Notification"}
                    </p>
                  </div>
                  <span style={{
                    fontSize: theme.font.size.xs, color: theme.colors.textMuted,
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    {formatDate(n.date_echeance)}
                  </span>
                </div>

                {/* Type intervention */}
                {n.type_intervention_nom && (
                  <p style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: theme.font.size.xs, color: theme.colors.primary,
                    fontWeight: 600, marginBottom: 4,
                  }}>
                    <Sprout size={12} /> {n.type_intervention_nom}
                  </p>
                )}

                {/* Parcelle */}
                {n.parcelle_nom && (
                  <p style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: theme.font.size.xs, color: theme.colors.textMuted,
                    marginBottom: 8,
                  }}>
                    <LandPlot size={12} /> {n.parcelle_nom}
                  </p>
                )}

                {/* Boutons d'action — managers seulement */}
                {user?.role === "manager" && n.statut === "en_attente" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <Button
                      variant="primary"
                      icon={Check}
                      onClick={() => handleTraiter(n.id)}
                      style={{ flex: 2, padding: "6px 10px", fontSize: theme.font.size.xs }}
                    >
                      Traiter
                    </Button>
                    <button
                      onClick={() => handleReporter(n.id)}
                      title="Reporter"
                      style={{ ...iconOnlyButtonStyle, flex: 1 }}
                    >
                      <Pause size={13} />
                    </button>
                    <button
                      onClick={() => handleIgnorer(n.id)}
                      title="Ignorer"
                      style={{ ...iconOnlyButtonStyle, flex: 1 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* Statut si pas en attente */}
                {n.statut !== "en_attente" && (
                  <span style={{
                    fontSize: theme.font.size.xs, color: theme.colors.textMuted,
                    fontStyle: "italic",
                  }}>
                    Statut : {n.statut_display || n.statut}
                  </span>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const iconOnlyButtonStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "6px 10px", borderRadius: theme.radius.md,
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  cursor: "pointer", color: theme.colors.textSecondary,
};
