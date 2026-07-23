import api from "./axios";

/**
 * Récupère la liste des règles de notification paramétrables.
 * (ex: "Irriguer toutes les parcelles tous les 7 jours")
 *
 * @param {Object} params - filtres optionnels (ex: { actif: true })
 */
export async function getReglesNotification(params = {}) {
  const response = await api.get("/regles-notification/", { params });
  return response.data;
}

/**
 * Crée une nouvelle règle de notification.
 * Réservé aux managers.
 *
 * @param {Object} data - {
 *   nom               : string,
 *   type_intervention : id du TypeIntervention,
 *   parcelle          : id de la Parcelle (null = règle globale),
 *   delai_jours       : number,
 *   actif             : boolean
 * }
 */
export async function createRegleNotification(data) {
  const response = await api.post("/regles-notification/", data);
  return response.data;
}

/**
 * Met à jour une règle de notification.
 *
 * @param {number} id
 * @param {Object} data
 */
export async function updateRegleNotification(id, data) {
  const response = await api.patch(`/regles-notification/${id}/`, data);
  return response.data;
}

/**
 * Supprime une règle de notification.
 *
 * @param {number} id
 */
export async function deleteRegleNotification(id) {
  const response = await api.delete(`/regles-notification/${id}/`);
  return response.data;
}

/**
 * Récupère la liste des notifications.
 *
 * @param {Object} params - filtres optionnels :
 *   - statut          : "en_attente" | "traitee" | "reportee" | "ignoree"
 *   - priorite        : "haute" | "normale" | "basse"
 *   - parcelle        : id de la parcelle
 *   - date_echeance   : date (format YYYY-MM-DD)
 */
export async function getNotifications(params = {}) {
  const response = await api.get("/notifications/", { params });
  return response.data;
}

/**
 * Récupère uniquement les notifications en attente.
 * Utilisé pour le badge de comptage dans la Navbar.
 */
export async function getNotificationsEnAttente() {
  const response = await api.get("/notifications/", {
    params: { statut: "en_attente" },
  });
  return response.data;
}

/**
 * Récupère une notification par son ID.
 *
 * @param {number} id
 */
export async function getNotificationById(id) {
  const response = await api.get(`/notifications/${id}/`);
  return response.data;
}

/**
 * Traite une notification :
 * - Marque la notification comme "traitee"
 * - Crée automatiquement une Intervention liée côté Django
 * - Retourne la notification mise à jour + l'intervention créée
 * Réservé aux managers.
 *
 * @param {number} id - id de la notification à traiter
 */
export async function traiterNotification(id) {
  const response = await api.post(`/notifications/${id}/traiter/`);
  return response.data;
}

/**
 * Reporte une notification (statut → "reportee").
 *
 * @param {number} id
 */
export async function reporterNotification(id) {
  const response = await api.patch(`/notifications/${id}/`, {
    statut: "reportee",
  });
  return response.data;
}

/**
 * Ignore une notification (statut → "ignoree").
 *
 * @param {number} id
 */
export async function ignorerNotification(id) {
  const response = await api.patch(`/notifications/${id}/`, {
    statut: "ignoree",
  });
  return response.data;
}

/**
 * Déclenche la génération automatique des notifications
 * manquantes pour toutes les parcelles, en appelant
 * le service côté Django (services.generer_notifications()).
 * Réservé aux managers.
 *
 * @returns {{ created: number, skipped: number }}
 */
export async function genererNotifications() {
  const response = await api.post("/notifications/generer/");
  return response.data;
}