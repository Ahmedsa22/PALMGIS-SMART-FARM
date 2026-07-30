import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useAuthStore from "./store/authStore";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import InterventionsPage from "./pages/InterventionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import DashboardPage from "./pages/DashboardPage";


// Instance React Query — gère le cache de tous les appels API
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,           // réessaie 1 fois en cas d'échec avant d'afficher l'erreur
      staleTime: 1000 * 60 * 5, // données considérées fraîches pendant 5 minutes
    },
  },
});

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  /**
   * Au démarrage de l'app, vérifie si la session est encore active.
   * checkAuth() appelle GET /api/users/me/ :
   * - Cookie valide   → isAuthenticated = true → l'utilisateur reste connecté
   * - Cookie expiré   → isAuthenticated = false → ProtectedRoute redirige vers /login
   */
  useEffect(() => {
    checkAuth();
  }, []); // [] = s'exécute une seule fois au montage

  // Pendant la vérification du cookie, affiche un écran de chargement
  // pour éviter un flash de la page /login
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🌴</div>
          <p className="text-white text-xl font-semibold">
            PalmGIS Smart Farm
          </p>
          <p className="text-primary-200 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* Route publique — accessible sans être connecté */}
          <Route path="/login" element={<LoginPage />} />

          {/* Routes protégées — redirigent vers /login si non connecté */}
          <Route element={<ProtectedRoute />}>
            <Route path="/map"           element={<MapPage />} />
            <Route path="/interventions" element={<InterventionsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Redirection par défaut */}
          <Route path="/"  element={<Navigate to="/map" replace />} />
          <Route path="*"  element={<Navigate to="/map" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}