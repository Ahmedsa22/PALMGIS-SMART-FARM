import axios from "axios";
import { getCSRFToken } from "../utils/csrf";

/**
 * Instance Axios partagée par toute l'application.
 * Tous les appels API passent par cette instance —
 * jamais d'import direct d'axios dans les composants.
 */
const api = axios.create({
  baseURL: "/api",       // proxy Vite redirige vers http://localhost:8000/api
  withCredentials: true, // envoie les cookies httpOnly à chaque requête
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// ─────────────────────────────────────────────
// INTERCEPTEUR 1 — Requêtes sortantes
// Ajoute automatiquement le token CSRF sur toutes
// les requêtes qui modifient des données
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const methodesEcriture = ["post", "put", "patch", "delete"];

    if (methodesEcriture.includes(config.method?.toLowerCase())) {
      const csrfToken = getCSRFToken();

      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// INTERCEPTEUR 2 — Réponses entrantes
// Si Django répond 401 (non authentifié),
// redirige automatiquement vers /login
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Évite une boucle infinie si on est déjà sur /login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;