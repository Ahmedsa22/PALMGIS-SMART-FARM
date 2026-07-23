import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/authStore";

/**
 * Composant de protection des routes.
 *
 * Si l'utilisateur est authentifié  → affiche la page demandée (Outlet)
 * Si l'utilisateur n'est pas connecté → redirige vers /login
 *
 * Utilisé dans App.jsx pour grouper toutes les routes protégées :
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/map" element={<MapPage />} />
 *   ...
 * </Route>
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}