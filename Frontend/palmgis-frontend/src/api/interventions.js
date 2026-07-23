import api from "./axios";

/**
 * Récupère la liste des types d'intervention paramétrables.
 * (Irrigations, Pollinisation, Récolte, etc.)
 * Utilisé pour remplir les listes déroulantes du formulaire
 * de saisie d'intervention.
 *
 * @param {Object} params - filtres optionnels (ex: { actif: true })
 */
export async function getTypesIntervention(params = {}) {
  const response = await api.get("/types-intervention/", { params });
  return response.data;
}

/**
 * Récupère un type d'intervention par son ID.
 *
 * @param {number} id
 */
export async function getTypeInterventionById(id) {
  const response = await api.get(`/types-intervention/${id}/`);
  return response.data;
}

/**
 * Récupère la liste des interventions.
 *
 * @param {Object} params - filtres optionnels :
 *   - parcelle          : id de la parcelle
 *   - palm              : id du palmier
 *   - type_intervention : id du type
 *   - date_intervention_after  : date de début (format YYYY-MM-DD)
 *   - date_intervention_before : date de fin
 */
export async function getInterventions(params = {}) {
  const response = await api.get("/interventions/", { params });
  return response.data;
}

/**
 * Récupère les interventions d'une parcelle précise.
 * Raccourci pour afficher l'historique dans la sidebar.
 *
 * @param {number} parcelleId
 */
export async function getInterventionsByParcelle(parcelleId) {
  const response = await api.get("/interventions/", {
    params: { parcelle: parcelleId },
  });
  return response.data;
}

/**
 * Récupère les interventions d'un palmier précis.
 *
 * @param {number} palmId
 */
export async function getInterventionsByPalm(palmId) {
  const response = await api.get("/interventions/", {
    params: { palm: palmId },
  });
  return response.data;
}

/**
 * Récupère une intervention par son ID.
 *
 * @param {number} id
 */
export async function getInterventionById(id) {
  const response = await api.get(`/interventions/${id}/`);
  return response.data;
}

/**
 * Crée une nouvelle intervention.
 * Réservé aux managers.
 * L'opérateur est assigné automatiquement côté Django
 * (perform_create → operateur = request.user).
 *
 * @param {Object} data - {
 *   type_intervention  : id du TypeIntervention,
 *   parcelle           : id de la Parcelle (obligatoire si palm absent),
 *   palm               : id du Palm (optionnel),
 *   date_intervention  : "2026-07-22T08:00:00",
 *   quantite           : 150.5,
 *   description        : string
 * }
 */
export async function createIntervention(data) {
  const response = await api.post("/interventions/", data);
  return response.data;
}

/**
 * Met à jour une intervention existante (modification partielle).
 *
 * @param {number} id
 * @param {Object} data - champs à modifier
 */
export async function updateIntervention(id, data) {
  const response = await api.patch(`/interventions/${id}/`, data);
  return response.data;
}

/**
 * Supprime une intervention.
 * Réservé aux managers.
 *
 * @param {number} id
 */
export async function deleteIntervention(id) {
  const response = await api.delete(`/interventions/${id}/`);
  return response.data;
}

/**
 * Uploade une pièce jointe sur une intervention existante.
 *
 * @param {number} interventionId
 * @param {File} fichier
 */
export async function uploadPieceJointe(interventionId, fichier) {
  const formData = new FormData();
  formData.append("fichier", fichier);

  const response = await api.post(
    `/interventions/${interventionId}/pieces-jointes/`,
    formData,
    {
      headers: { "Content-Type": undefined },
    }
  );

  return response.data;
}