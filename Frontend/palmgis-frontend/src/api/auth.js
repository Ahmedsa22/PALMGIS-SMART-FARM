import api from "./axios";

/**
 * Connecte l'utilisateur.
 * dj-rest-auth attend les champs "username" et "password".
 * En cas de succès, Django pose automatiquement les cookies
 * httpOnly (access + refresh token) — rien à stocker manuellement.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise} données utilisateur retournées par Django
 */
export async function login(username, password) {
  const response = await api.post("/auth/login/", { username, password });
  return response.data;
}

/**
 * Déconnecte l'utilisateur.
 * dj-rest-auth supprime les cookies côté serveur.
 * Après cet appel, tous les cookies JWT sont invalidés.
 *
 * @returns {Promise}
 */
export async function logout() {
  const response = await api.post("/auth/logout/");
  return response.data;
}

/**
 * Récupère les informations de l'utilisateur actuellement connecté.
 * Utilisé au démarrage de l'app pour vérifier si la session
 * est toujours valide (cookie non expiré) et récupérer
 * le username et le rôle (manager/viewer).
 *
 * @returns {Promise} { id, username, email, role, first_name, last_name }
 */
export async function getMe() {
  const response = await api.get("/users/me/");
  return response.data;
}