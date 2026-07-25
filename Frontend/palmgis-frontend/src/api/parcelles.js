import api from "./axios";

/**
 * Récupère la liste de toutes les parcelles.
 * Retourne du GeoJSON (FeatureCollection) — directement
 * exploitable par MapLibre pour afficher les polygones sur la carte.
 *

 * Récupère une parcelle par son ID.
 *
 * @param {number} id
 */
export async function getParcelles(params = {}) {
  const response = await api.get("/parcelles/", { params });

  // L'API est paginée — le GeoJSON est dans response.data.results
  return response.data.results;  // ← retourne directement le FeatureCollection
}

/**
 * Crée une nouvelle parcelle.
 * Réservé aux managers (IsManagerOrReadOnly côté Django).
 *
 * @param {Object} data - { nom, geom (GeoJSON), statut, proprietaire, description }
 */
export async function createParcelle(data) {
  const response = await api.post("/parcelles/", data);
  return response.data;
}

/**
 * Met à jour une parcelle existante.
 *
 * @param {number} id
 * @param {Object} data - champs à modifier
 */
export async function updateParcelle(id, data) {
  const response = await api.patch(`/parcelles/${id}/`, data);
  return response.data;
}

/**
 * Supprime une parcelle.
 * Réservé aux managers.
 *
 * @param {number} id
 */
export async function deleteParcelle(id) {
  const response = await api.delete(`/parcelles/${id}/`);
  return response.data;
}

/**
 * Importe des parcelles depuis un fichier Shapefile (.zip) ou GeoJSON.
 * Envoie le fichier en multipart/form-data.
 * Réservé aux managers.
 *
 * @param {File} file - fichier sélectionné par l'utilisateur
 * @param {Function} onProgress - callback de progression (0-100)
 */
export async function importParcelles(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);  // ← clé "file" obligatoire

  const response = await api.post("/parcelles/import/", formData, {
    headers: {
      "Content-Type": undefined,  // ← laisse le navigateur générer le boundary
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percent);
      }
    },
  });

  return response.data;
  
}