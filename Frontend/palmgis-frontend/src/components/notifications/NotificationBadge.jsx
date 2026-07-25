import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationsEnAttente } from "../../api/notifications";

export default function NotificationBadge() {
  const navigate            = useNavigate();
  const [count, setCount]   = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown]   = useState(false);

  async function charger() {
    try {
      const data = await getNotificationsEnAttente();
      const liste = data.results?.features ||
                    data.results ||
                    data.features ||
                    data || [];
      // Si c'est paginé classique (pas GeoJSON)
      if (data.count !== undefined) {
        setCount(data.count);
        setNotifications(
          Array.isArray(data.results) ? data.results.slice(0, 5) : []
        );
      } else {
        setCount(Array.isArray(liste) ? liste.length : 0);
        setNotifications(Array.isArray(liste) ? liste.slice(0, 5) : []);
      }
    } catch (err) {
      console.error("Erreur notifications :", err);
    }
  }

  // Charge au montage + toutes les 5 minutes
  useEffect(() => {
    charger();
    const interval = setInterval(charger, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-MA", {
      day: "2-digit", month: "2-digit"
    });
  };

  const couleurPriorite = {
    haute:   "#ef4444",
    normale: "#f97316",
    basse:   "#6b7280",
  };

  return (
    <div style={{ position: "relative" }}>

      {/* Bouton cloche */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: "relative",
          background: "none", border: "none",
          cursor: "pointer", padding: "0.4rem",
          borderRadius: "0.4rem",
          color: "white", fontSize: "1.2rem",
        }}
        title="Notifications"
      >
        🔔
        {/* Badge compteur */}
        {count > 0 && (
          <span style={{
            position: "absolute", top: "-2px", right: "-2px",
            backgroundColor: "#ef4444", color: "white",
            borderRadius: "50%", fontSize: "0.65rem",
            fontWeight: 700, minWidth: "18px", height: "18px",
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: "0 3px",
          }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Overlay transparent pour fermer au clic extérieur */}
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40
            }}
          />

          {/* Panel dropdown */}
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            width: "320px", backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            border: "1px solid #e5e7eb",
            zIndex: 50, overflow: "hidden",
          }}>

            {/* En-tête dropdown */}
            <div style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #f3f4f6",
              display: "flex", justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{
                fontWeight: 700, fontSize: "0.9rem", color: "#2E5E3E"
              }}>
                🔔 Notifications
              </span>
              {count > 0 && (
                <span style={{
                  backgroundColor: "#fef2f2", color: "#ef4444",
                  fontSize: "0.75rem", fontWeight: 600,
                  padding: "0.15rem 0.5rem", borderRadius: "1rem"
                }}>
                  {count} en attente
                </span>
              )}
            </div>

            {/* Liste des 5 dernières */}
            {notifications.length === 0 ? (
              <div style={{
                padding: "1.5rem", textAlign: "center",
                color: "#9ca3af", fontSize: "0.85rem"
              }}>
                ✅ Aucune notification en attente
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #f9fafb",
                    cursor: "pointer",
                  }}
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/notifications");
                    }}
                  >
                    {/* Priorité + date */}
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      marginBottom: "0.25rem"
                    }}>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600,
                        color: couleurPriorite[n.priorite] || "#6b7280",
                        textTransform: "uppercase"
                      }}>
                        ● {n.priorite}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                        {formatDate(n.date_echeance)}
                      </span>
                    </div>
                    {/* Message */}
                    <p style={{
                      fontSize: "0.82rem", color: "#374151",
                      margin: 0, lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {n.message || n.regle_nom || "Notification"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Lien voir tout */}
            <div style={{
              padding: "0.6rem 1rem",
              borderTop: "1px solid #f3f4f6",
              textAlign: "center"
            }}>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/notifications");
                }}
                style={{
                  background: "none", border: "none",
                  color: "#2E5E3E", cursor: "pointer",
                  fontSize: "0.82rem", fontWeight: 600,
                }}
              >
                Voir toutes les notifications →
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}