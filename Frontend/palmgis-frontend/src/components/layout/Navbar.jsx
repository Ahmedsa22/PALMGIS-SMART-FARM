import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu, TreePalm, Map, Wrench, LayoutDashboard, Users, LogOut,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useMapStore from "../../store/mapStore";
import NotificationBadge from "../notifications/NotificationBadge";
import { theme } from "../../styles/theme";

const NAV_ITEMS = [
  { path: "/map",           label: "Carte",         icon: Map },
  { path: "/interventions", label: "Interventions", icon: Wrench },
  { path: "/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useAuthStore((state) => state.user);
  const logout    = useAuthStore((state) => state.logout);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const items = [
    ...NAV_ITEMS,
    ...(user?.role === "manager"
      ? [{ path: "/users", label: "Utilisateurs", icon: Users }]
      : []),
  ];

  return (
    <nav style={{
        height: "56px",
        backgroundColor: theme.colors.primary,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
        zIndex: 10,
        fontFamily: theme.font.family,
        }}>

      {/* Gauche — logo + bouton sidebar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        <button
          onClick={toggleSidebar}
          title="Ouvrir / fermer le panneau"
          style={iconButtonStyle}
        >
          <Menu size={18} />
        </button>

        <div
          onClick={() => navigate("/map")}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <TreePalm size={20} />
          <span style={{ fontWeight: 700, fontSize: theme.font.size.lg, letterSpacing: "0.2px" }}>
            PalmGIS Smart Farm
          </span>
        </div>
      </div>

      {/* Centre — navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: "100%" }}>
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            active={location.pathname.startsWith(path)}
            onClick={() => navigate(path)}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Droite — utilisateur + notifications + déconnexion */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

        <NotificationBadge />

        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: theme.font.size.sm, fontWeight: 600, lineHeight: 1.2 }}>
            {user?.username}
          </p>
        </div>

        <span style={{
          fontSize: theme.font.size.xs,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: theme.radius.sm,
          border: `1px solid ${user?.role === "manager" ? theme.colors.accent : "rgba(255,255,255,0.35)"}`,
          color: user?.role === "manager" ? theme.colors.accent : "rgba(255,255,255,0.85)",
        }}>
          {user?.role === "manager" ? "Manager" : "Viewer"}
        </span>

        <button
          onClick={handleLogout}
          title="Déconnexion"
          style={iconButtonStyle}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

const iconButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  padding: 0,
  border: "none",
  borderRadius: theme.radius.sm,
  background: "transparent",
  color: "white",
  cursor: "pointer",
};

function NavLink({ onClick, active, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: "100%",
        padding: "0 14px",
        border: "none",
        borderBottom: active ? `2px solid ${theme.colors.accent}` : "2px solid transparent",
        background: "transparent",
        color: active ? "white" : "rgba(255,255,255,0.75)",
        fontSize: theme.font.size.sm,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
