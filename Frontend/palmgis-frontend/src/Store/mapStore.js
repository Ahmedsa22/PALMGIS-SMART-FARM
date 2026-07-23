import { create } from "zustand";

/**
 * Store Zustand pour la gestion de l'état de la carte.
 *
 * Contient :
 * - La parcelle actuellement sélectionnée (clic sur la carte ou la liste)
 * - Le palmier actuellement sélectionné
 * - La couche active (parcelles, palmiers)
 * - L'état du panneau latéral (ouvert/fermé)
 */
const useMapStore = create((set) => ({

  // ─────────────────────────────────────────────
  // ÉTAT
  // ─────────────────────────────────────────────

  parcelleSelectionnee: null,  // objet GeoJSON Feature de la parcelle cliquée
  palmSelectionne: null,       // objet GeoJSON Feature du palmier cliqué
  coucheActive: "parcelles",   // "parcelles" | "palms"
  sidebarOuverte: true,        // panneau latéral visible ou masqué
  mapRef: null,                // référence à l'instance MapLibre (pour zoom/flyTo)

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────

  /**
   * Sélectionne une parcelle.
   * Réinitialise le palmier sélectionné (on change de contexte).
   * Ouvre automatiquement la sidebar si elle était fermée.
   *
   * @param {Object} parcelle - Feature GeoJSON de la parcelle
   */
  selectionnerParcelle: (parcelle) =>
    set({
      parcelleSelectionnee: parcelle,
      palmSelectionne: null,      // reset du palmier quand on change de parcelle
      sidebarOuverte: true,
    }),

  /**
   * Sélectionne un palmier.
   * Ouvre automatiquement la sidebar.
   *
   * @param {Object} palm - Feature GeoJSON du palmier
   */
  selectionnerPalm: (palm) =>
    set({
      palmSelectionne: palm,
      sidebarOuverte: true,
    }),

  /**
   * Réinitialise la sélection (clic en dehors d'une parcelle/palmier).
   */
  reinitialiserSelection: () =>
    set({
      parcelleSelectionnee: null,
      palmSelectionne: null,
    }),

  /**
   * Change la couche active affichée sur la carte.
   * Quand on passe à "palms", les palmiers de la parcelle
   * sélectionnée sont chargés automatiquement.
   *
   * @param {string} couche - "parcelles" | "palms"
   */
  setCoucheActive: (couche) => set({ coucheActive: couche }),

  /**
   * Ouvre ou ferme le panneau latéral.
   */
  toggleSidebar: () =>
    set((state) => ({ sidebarOuverte: !state.sidebarOuverte })),

  /**
   * Stocke la référence à l'instance MapLibre.
   * Permet aux composants extérieurs à la carte de déclencher
   * des actions cartographiques (zoom, flyTo, etc.)
   *
   * @param {Object} map - instance MapLibre GL JS
   */
  setMapRef: (map) => set({ mapRef: map }),

  /**
   * Zoome sur une parcelle depuis la liste (sidebar).
   * Utilise mapRef pour appeler flyTo de MapLibre.
   *
   * @param {Array} bbox - [minLon, minLat, maxLon, maxLat]
   */
  zoomSurParcelle: (bbox) =>
    set((state) => {
      if (state.mapRef) {
        state.mapRef.fitBounds(bbox, {
          padding: 80,
          duration: 800,   // animation fluide de 800ms
        });
      }
      return {};  // pas de changement d'état, juste un effet de bord
    }),

}));

export default useMapStore;