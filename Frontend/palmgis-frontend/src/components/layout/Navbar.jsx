import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useMapStore from "../../store/mapStore";
import NotificationBadge from "../notifications/NotificationBadge";


export default function Navbar() {
  const navigate  = useNavigate();
  const user      = useAuthStore((state) => state.user);
  const logout    = useAuthStore((state) => state.logout);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav style={{
        height: "56px",
        backgroundColor: "#2E5E3E",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        flexShrink: 0,
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        zIndex: 10,
        }}>

      {/* Gauche — logo + bouton sidebar */}
      <div className="flex items-center gap-3">

        {/* Bouton toggle sidebar */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-primary-600 transition"
          title="Ouvrir / fermer le panneau"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor"
               viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo et nom */}
        <div className="flex items-center gap-2 cursor-pointer"
             onClick={() => navigate("/map")}>
          <span className="text-xl">🌴</span>
          <span className="font-bold text-base hidden sm:block">
            PalmGIS Smart Farm
          </span>
        </div>

      </div>

      {/* Centre — navigation */}
    
      <div className="hidden md:flex items-center gap-1">
        <NavLink onClick={() => navigate("/map")}>
          🗺️ Carte
        </NavLink>
        <NavLink onClick={() => navigate("/interventions")}>
          📋 Interventions
        </NavLink>
        <NavLink onClick={() => navigate("/dashboard")}>
          📊 Dashboard
        </NavLink>
        {/* ⚠️ PAS de NavLink autour de NotificationBadge */}
        {/* Dans Navbar.jsx, dans les liens de navigation */}
      {user?.role === "manager" && (
        <NavLink onClick={() => navigate("/users")}>
          👥 Utilisateurs
        </NavLink>
      )}
      </div>

      {/* Droite — utilisateur + notifications + déconnexion */}
      <div className="flex items-center gap-3">

        {/* NotificationBadge directement ici, pas dans un NavLink */}
        <NotificationBadge />

        {/* Infos utilisateur */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold leading-tight">
            {user?.username}
          </p>
          <p className="text-xs text-primary-200 leading-tight">
            {user?.role === "manager" ? "Gestionnaire" : "Consultant"}
          </p>
        </div>

        {/* Badge rôle */}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${user?.role === "manager"
            ? "bg-accent text-white"
            : "bg-primary-300 text-primary-800"
          }`}>
          {user?.role === "manager" ? "Manager" : "Viewer"}
        </span>

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          className="text-xs bg-primary-600 hover:bg-primary-700
                    px-3 py-1.5 rounded-lg transition font-medium"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

/**
 * Composant interne — lien de navigation dans la Navbar.
 * Extrait pour éviter la répétition des classes Tailwind.
 */
function NavLink({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="text-sm px-3 py-1.5 rounded-lg hover:bg-primary-600
                 transition font-medium"
    >
      {children}
    </button>
  );
}