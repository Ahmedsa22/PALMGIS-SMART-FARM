import api from "./axios";

/**
 * Récupère la liste de tous les palmiers.
 * Retourne du GeoJSON (FeatureCollection) — directement
 * exploitable par MapLibre pour afficher les points sur la carte.
 *
 * @param {Object} params - filtres optionnels :
 *   - parcelle    : id de la parcelle (ex: { parcelle: 12 })
 *   - etat_sante  : "B", "MO", "MA", "MR"
 *   - variete     : nom de la variété
 */
export async function getPalms(params = {}) {
  const response = await api.get("/palms/", { params });
  return response.data;
}

/**
 * Récupère les palmiers d'une parcelle précise.
 * Raccourci pratique pour éviter de passer { parcelle: id }
 * à chaque fois depuis la carte.
 *
 * @param {number} parcelleId
 */
export async function getPalmsByParcelle(parcelleId) {
  const response = await api.get("/palms/", {
    params: { parcelle: parcelleId },
  });
  return response.data;
}

/**
 * Récupère un palmier par son ID.
 *
 * @param {number} id
 */
export async function getPalmById(id) {
  const response = await api.get(`/palms/${id}/`);
  return response.data;
}

/**
 * Crée un nouveau palmier.
 * Réservé aux managers.
 * La parcelle englobante est calculée automatiquement
 * côté Django via geom__contains — pas besoin de la
 * fournir manuellement.
 *
 * @param {Object} data - {
 *   geom        : { type: "Point", coordinates: [lon, lat] },
 *   age         : "JP" | "A" | "V",
 *   etat_site   : "ISO" | "TOF",
 *   etat_sante  : "B" | "MO" | "MA" | "MR",
 *   sexe        : "M" | "F",
 *   variete     : string,
 *   ligne       : string,
 *   numero      : string,
 *   code_uni    : string,
 *   code_local  : string,
 *   description : string
 * }
 */
export async function createPalm(data) {
  const response = await api.post("/palms/", data);
  return response.data;
}

/**
 * Met à jour un palmier existant (modification partielle).
 * Utile pour changer l'état sanitaire depuis la carte
 * sans renvoyer toute la géométrie.
 *
 * @param {number} id
 * @param {Object} data - champs à modifier
 */
export async function updatePalm(id, data) {
  const response = await api.patch(`/palms/${id}/`, data);
  return response.data;
}

/**
 * Supprime un palmier.
 * Réservé aux managers.
 *
 * @param {number} id
 */
export async function deletePalm(id) {
  const response = await api.delete(`/palms/${id}/`);
  return response.data;
}

/**
 * Importe des palmiers depuis un fichier Shapefile (.zip) ou GeoJSON.
 *
 * @param {File} file
 * @param {Function} onProgress
 */
export async function importPalms(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/palms/import/", formData, {
    headers: { "Content-Type": undefined },
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