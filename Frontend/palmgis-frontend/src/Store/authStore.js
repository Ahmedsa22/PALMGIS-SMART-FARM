import { create } from "zustand";
import { login as loginApi, logout as logoutApi, getMe } from "../api/auth";

/**
 * Store Zustand pour la gestion de l'authentification.
 *
 * Contient :
 * - Les infos de l'utilisateur connecté (username, role)
 * - Le statut de chargement initial (pour éviter un flash de /login)
 * - Les actions login / logout / checkAuth
 */
const useAuthStore = create((set) => ({

  // ─────────────────────────────────────────────
  // ÉTAT
  // ─────────────────────────────────────────────

  user: null,              // { id, username, email, role, first_name, last_name }
  isAuthenticated: false,  // true si l'utilisateur est connecté
  isLoading: true,         // true pendant la vérification initiale du cookie
  error: null,             // message d'erreur de login

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────

  /**
   * Connecte l'utilisateur.
   * Appelle POST /api/auth/login/ → Django pose les cookies JWT.
   * En cas de succès, stocke les infos utilisateur dans le store.
   *
   * @param {string} username
   * @param {string} password
   * @returns {boolean} true si succès, false si échec
   */
  login: async (username, password) => {
    set({ error: null });

    try {
      const data = await loginApi(username, password);

      set({
        user: {
          id:         data.user.pk,
          username:   data.user.username,
          email:      data.user.email,
          role:       data.user.role,
          first_name: data.user.first_name,
          last_name:  data.user.last_name,
        },
        isAuthenticated: true,
        error: null,
      });

      return true;

    } catch (err) {
      const message =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        "Identifiants incorrects.";

      set({ error: message, isAuthenticated: false, user: null });
      return false;
    }
  },

  /**
   * Déconnecte l'utilisateur.
   * Appelle POST /api/auth/logout/ → Django invalide les cookies.
   * Vide le store local.
   */
  logout: async () => {
    try {
      await logoutApi();
    } catch {
      // On vide le store même si le serveur ne répond pas
    } finally {
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  /**
   * Vérifie si la session est encore active au démarrage de l'app.
   * Appelée une seule fois dans App.jsx au montage du composant.
   *
   * Si le cookie JWT est encore valide → l'utilisateur reste connecté.
   * Si le cookie est expiré → isAuthenticated reste false → redirect /login.
   */
  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const user = await getMe();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

    } catch {
      // Cookie expiré ou absent → pas d'erreur affichée, juste déconnecté
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Efface le message d'erreur de login.
   * Appelée quand l'utilisateur commence à retaper ses identifiants.
   */
  clearError: () => set({ error: null }),

}));

export default useAuthStore;
