import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2 } from "lucide-react";
import { getNotificationsEnAttente } from "../../api/notifications";
import { theme } from "../../styles/theme";

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
    haute:   theme.colors.danger,
    normale: theme.colors.warning,
    basse:   theme.colors.textMuted,
  };

  return (
    <div style={{ position: "relative" }}>

      {/* Bouton cloche */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none",
          cursor: "pointer", width: 32, height: 32,
          borderRadius: theme.radius.sm,
          color: "white",
        }}
        title="Notifications"
      >
        <Bell size={17} />
        {/* Badge compteur */}
        {count > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            backgroundColor: theme.colors.danger, color: "white",
            borderRadius: "50%", fontSize: "10px",
            fontWeight: 700, minWidth: 16, height: 16,
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
            width: 320, backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.lg,
            border: `1px solid ${theme.colors.border}`,
            zIndex: 50, overflow: "hidden",
            fontFamily: theme.font.family, color: theme.colors.text,
          }}>

            {/* En-tête dropdown */}
            <div style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${theme.colors.border}`,
              display: "flex", justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontWeight: 700, fontSize: theme.font.size.base, color: theme.colors.text,
              }}>
                <Bell size={15} color={theme.colors.primary} /> Notifications
              </span>
              {count > 0 && (
                <span style={{
                  backgroundColor: "transparent", color: theme.colors.danger,
                  border: `1px solid ${theme.colors.danger}`,
                  fontSize: theme.font.size.xs, fontWeight: 600,
                  padding: "2px 8px", borderRadius: theme.radius.lg
                }}>
                  {count} en attente
                </span>
              )}
            </div>

            {/* Liste des 5 dernières */}
            {notifications.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: 24, textAlign: "center",
                color: theme.colors.textMuted, fontSize: theme.font.size.sm,
              }}>
                <CheckCircle2 size={20} color={theme.colors.success} />
                Aucune notification en attente
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <div key={n.id} style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${theme.colors.border}`,
                    cursor: "pointer",
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.colors.bg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/notifications");
                    }}
                  >
                    {/* Priorité + date */}
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      marginBottom: 4
                    }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: theme.font.size.xs, fontWeight: 600,
                        color: couleurPriorite[n.priorite] || theme.colors.textMuted,
                        textTransform: "uppercase"
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: couleurPriorite[n.priorite] || theme.colors.textMuted,
                        }} />
                        {n.priorite}
                      </span>
                      <span style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                        {formatDate(n.date_echeance)}
                      </span>
                    </div>
                    {/* Message */}
                    <p style={{
                      fontSize: theme.font.size.sm, color: theme.colors.textSecondary,
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
              padding: "10px 16px",
              borderTop: `1px solid ${theme.colors.border}`,
              textAlign: "center"
            }}>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/notifications");
                }}
                style={{
                  background: "none", border: "none",
                  color: theme.colors.primary, cursor: "pointer",
                  fontSize: theme.font.size.sm, fontWeight: 600,
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
