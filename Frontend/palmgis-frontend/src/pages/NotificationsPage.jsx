import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  traiterNotification,
  reporterNotification,
  ignorerNotification,
  genererNotifications,
} from "../api/notifications";
import useAuthStore from "../store/authStore";
import Navbar from "../components/layout/Navbar";

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
  console.log("🟡 charger() appelé");
  setIsLoading(true);
  try {
    const data = await getNotifications(
      filtreStatut ? { statut: filtreStatut } : {}
    );
    console.log("🟢 data reçue:", data);
    setCount(data.count || 0);
    const liste = Array.isArray(data.results) ? data.results : [];
    console.log("🟢 liste:", liste.length, "items");
    setNotifications(liste);
  } catch (err) {
    console.error("🔴 Erreur:", err);
  } finally {
    setIsLoading(false);
  }
}

    useEffect(() => {
    console.log("🔵 useEffect déclenché, filtreStatut:", filtreStatut);
    charger();
    }, [filtreStatut]);

  async function handleTraiter(id) {
    try {
      await traiterNotification(id);
      setMessage("✅ Notification traitée — intervention créée automatiquement");
      charger();
    } catch (err) {
      setMessage("❌ Erreur lors du traitement");
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
      setMessage(`✅ ${result.created} notification(s) générée(s)`);
      charger();
    } catch (err) {
      setMessage("❌ Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const couleurPriorite = {
    haute:   { bg: "#fef2f2", border: "#fecaca", text: "#ef4444" },
    normale: { bg: "#fff7ed", border: "#fed7aa", text: "#f97316" },
    basse:   { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280" },
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
      height: "100vh", backgroundColor: "#f9fafb",
      overflow: "hidden",
    }}>

      {/* Navbar */}
      <Navbar />

      {/* En-tête page */}
      <div style={{
        backgroundColor: "white", padding: "1rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2E5E3E" }}>
            🔔 Notifications
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.1rem" }}>
            {count} notification(s) — filtre : {filtreStatut || "toutes"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
          {user?.role === "manager" && (
            <button
              onClick={handleGenerer}
              disabled={isGenerating}
              style={{
                padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                backgroundColor: "#2E5E3E", border: "none",
                cursor: isGenerating ? "not-allowed" : "pointer",
                fontSize: "0.8rem", color: "white", fontWeight: 600,
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating ? "Génération..." : "⚡ Générer rappels"}
            </button>
          )}
        </div>
      </div>

      {/* Message flash */}
      {message && (
        <div style={{
          backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`,
          color: message.startsWith("✅") ? "#166534" : "#dc2626",
          padding: "0.6rem 1.5rem", fontSize: "0.85rem", fontWeight: 500,
          flexShrink: 0,
        }}>
          {message}
        </div>
      )}

      {/* Filtres */}
      <div style={{
        padding: "0.75rem 1.5rem", backgroundColor: "white",
        borderBottom: "1px solid #f3f4f6",
        display: "flex", gap: "0.5rem", flexWrap: "wrap",
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
              padding: "0.35rem 0.75rem", borderRadius: "1rem",
              border: "1px solid",
              borderColor: filtreStatut === value ? "#2E5E3E" : "#e5e7eb",
              backgroundColor: filtreStatut === value ? "#2E5E3E" : "white",
              color: filtreStatut === value ? "white" : "#374151",
              cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenu scrollable */}
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
        {!isLoading && notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📭</div>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Aucune notification pour ce filtre.
            </p>
            {user?.role === "manager" && (
              <button
                onClick={handleGenerer}
                style={{
                  marginTop: "1rem", padding: "0.6rem 1.2rem",
                  borderRadius: "0.5rem", backgroundColor: "#2E5E3E",
                  border: "none", color: "white", cursor: "pointer",
                  fontSize: "0.85rem", fontWeight: 600,
                }}
              >
                ⚡ Générer les rappels maintenant
              </button>
            )}
          </div>
        )}

        {/* Liste des notifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {notifications.map((n) => {
            const couleur  = couleurPriorite[n.priorite] || couleurPriorite.basse;
            const enRetard = n.est_en_retard;

            return (
              <div key={n.id} style={{
                backgroundColor: couleur.bg,
                border: `1px solid ${enRetard ? "#ef4444" : couleur.border}`,
                borderRadius: "0.75rem", padding: "1rem",
                position: "relative",
              }}>

                {/* Badge en retard */}
                {enRetard && (
                  <span style={{
                    position: "absolute", top: "-8px", right: "12px",
                    backgroundColor: "#ef4444", color: "white",
                    fontSize: "0.65rem", fontWeight: 700,
                    padding: "0.15rem 0.5rem", borderRadius: "1rem",
                  }}>
                    EN RETARD
                  </span>
                )}

                {/* En-tête notification */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: "0.5rem",
                }}>
                  <div>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700,
                      color: couleur.text, textTransform: "uppercase",
                    }}>
                      ● {n.priorite}
                    </span>
                    <p style={{
                      fontSize: "0.88rem", fontWeight: 600,
                      color: "#1f2937", marginTop: "0.15rem",
                    }}>
                      {n.message || "Notification"}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "0.75rem", color: "#6b7280",
                    flexShrink: 0, marginLeft: "0.5rem",
                  }}>
                    {formatDate(n.date_echeance)}
                  </span>
                </div>

                {/* Type intervention */}
                {n.type_intervention_nom && (
                  <p style={{
                    fontSize: "0.78rem", color: "#2E5E3E",
                    fontWeight: 600, marginBottom: "0.25rem",
                  }}>
                    🌿 {n.type_intervention_nom}
                  </p>
                )}

                {/* Parcelle */}
                {n.parcelle_nom && (
                  <p style={{
                    fontSize: "0.78rem", color: "#6b7280",
                    marginBottom: "0.5rem",
                  }}>
                    📐 {n.parcelle_nom}
                  </p>
                )}

                {/* Boutons d'action — managers seulement */}
                {user?.role === "manager" && n.statut === "en_attente" && (
                  <div style={{
                    display: "flex", gap: "0.4rem", marginTop: "0.75rem",
                  }}>
                    <button
                      onClick={() => handleTraiter(n.id)}
                      style={{
                        flex: 2, padding: "0.4rem 0.5rem",
                        borderRadius: "0.4rem",
                        backgroundColor: "#2E5E3E", color: "white",
                        border: "none", cursor: "pointer",
                        fontSize: "0.78rem", fontWeight: 600,
                      }}
                    >
                      ✅ Traiter
                    </button>
                    <button
                      onClick={() => handleReporter(n.id)}
                      style={{
                        flex: 1, padding: "0.4rem 0.5rem",
                        borderRadius: "0.4rem", backgroundColor: "white",
                        border: "1px solid #e5e7eb", cursor: "pointer",
                        fontSize: "0.78rem", color: "#374151",
                      }}
                    >
                      ⏸️
                    </button>
                    <button
                      onClick={() => handleIgnorer(n.id)}
                      style={{
                        flex: 1, padding: "0.4rem 0.5rem",
                        borderRadius: "0.4rem", backgroundColor: "white",
                        border: "1px solid #e5e7eb", cursor: "pointer",
                        fontSize: "0.78rem", color: "#6b7280",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Statut si pas en attente */}
                {n.statut !== "en_attente" && (
                  <span style={{
                    fontSize: "0.75rem", color: "#6b7280",
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