import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { getParcelles } from "../../api/parcelles";
import useMapStore from "../../store/mapStore";
import { theme } from "../../styles/theme";

const COULEURS_STATUT = {
  active:     theme.colors.success,
  en_repos:   theme.colors.warning,
  abandonnee: theme.colors.textMuted,
};

export default function ParcelleLayer({ map }) {
  const selectionnerParcelle = useMapStore((state) => state.selectionnerParcelle);
  const parcelleSelectionnee = useMapStore((state) => state.parcelleSelectionnee);
  const couchesActives       = useMapStore((state) => state.couchesActives);

  // ── Charge et affiche les parcelles ──
  useEffect(() => {
    if (!map) return;

    let popup = null;

    const ajouterCouches = async () => {
      try {
        const geojson = await getParcelles();
        console.log("Parcelles reçues:", geojson?.features?.length);

        // GeoFeatureModelSerializer exclut le champ "id" des properties
        // (il n'apparaît qu'au niveau racine de chaque Feature). MapLibre ne
        // lit que les properties via ["get","id"] → on le recopie ici.
        const geojsonCorrige = {
          ...geojson,
          features: geojson.features.map(f => ({
            ...f,
            properties: { ...f.properties, id: f.properties.id ?? f.id },
          })),
        };

        // Nettoie les couches existantes
        ["parcelles-selected", "parcelles-border", "parcelles-fill"].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource("parcelles-source")) {
          map.removeSource("parcelles-source");
        }

        // Source
        map.addSource("parcelles-source", {
          type: "geojson",
          data: geojsonCorrige,
        });

        // ── Couche remplissage ──
        map.addLayer({
          id:     "parcelles-fill",
          type:   "fill",
          source: "parcelles-source",
          paint: {
            "fill-color": [
              "case",
              ["==", ["get", "type_parcelle"], "ferme"],   "#dc2626",
              ["==", ["get", "type_parcelle"], "zone"],    "#3b82f6",
              ["==", ["get", "statut"], "active"],         "#22c55e",
              ["==", ["get", "statut"], "en_repos"],       "#f97316",
              ["==", ["get", "statut"], "abandonnee"],     "#6b7280",
              "#6b7280",
            ],
            "fill-opacity": [
              "case",
              ["==", ["get", "type_parcelle"], "ferme"],   0.05,
              ["==", ["get", "type_parcelle"], "zone"],    0.1,
              0.4,
            ],
          },
        });

        // ── Couche bordure ──
        map.addLayer({
          id:     "parcelles-border",
          type:   "line",
          source: "parcelles-source",
          paint: {
            "line-color": [
              "case",
              ["==", ["get", "type_parcelle"], "ferme"],   "#dc2626",
              ["==", ["get", "type_parcelle"], "zone"],    "#3b82f6",
              ["==", ["get", "statut"], "active"],         "#22c55e",
              ["==", ["get", "statut"], "en_repos"],       "#f97316",
              ["==", ["get", "statut"], "abandonnee"],     "#6b7280",
              "#6b7280",
            ],
            "line-width": [
              "case",
              ["==", ["get", "type_parcelle"], "ferme"],   3,
              ["==", ["get", "type_parcelle"], "zone"],    2,
              2,
            ],
          },
        });

        // ── Couche surbrillance sélection ──
        map.addLayer({
          id:     "parcelles-selected",
          type:   "line",
          source: "parcelles-source",
          paint: {
            "line-color":   "#B08D57",
            "line-width":   4,
            "line-opacity": 1,
          },
          filter: ["==", ["get", "id"], -1],
        });

        // ── Popup au survol ──
        map.on("mouseenter", "parcelles-fill", (e) => {
          if (!e.features.length) return;
          map.getCanvas().style.cursor = "pointer";

          const props = e.features[0].properties;
          const coords = e.lngLat;

          const typeLabel = {
            ferme:    "Ferme",
            zone:     "Zone",
            parcelle: "Parcelle",
          }[props.type_parcelle] || "Parcelle";

          const statutLabel = {
            active:     "Active",
            en_repos:   "En repos",
            abandonnee: "Abandonnée",
          }[props.statut] || props.statut;

          const statutCouleur = COULEURS_STATUT[props.statut] || theme.colors.textMuted;

          const html = `
            <div style="font-family:${theme.font.family};min-width:180px;padding:4px;">
              <div style="background:${theme.colors.primary};color:white;padding:8px 12px;
                margin:-12px -12px 10px -12px;border-radius:6px 6px 0 0;
                font-weight:600;font-size:14px;">
                ${typeLabel} — ${props.nom}
              </div>
              <table style="width:100%;font-size:13px;border-collapse:collapse;">
                <tr>
                  <td style="color:${theme.colors.textSecondary};padding:3px 0;">Statut</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">
                    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;
                      background:${statutCouleur};margin-right:5px;"></span>${statutLabel}
                  </td>
                </tr>
                <tr>
                  <td style="color:${theme.colors.textSecondary};padding:3px 0;">Superficie</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">
                    ${props.superficie_ha ?? "—"} ha
                  </td>
                </tr>
                ${props.proprietaire ? `
                <tr>
                  <td style="color:${theme.colors.textSecondary};padding:3px 0;">Propriétaire</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${props.proprietaire}</td>
                </tr>` : ""}
              </table>
            </div>
          `;

          if (popup) popup.remove();
          popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: "260px",
            offset: 10,
          })
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map);
        });

        map.on("mouseleave", "parcelles-fill", () => {
          map.getCanvas().style.cursor = "";
          if (popup) { popup.remove(); popup = null; }
        });

        // ── Clic → sélectionne la parcelle ──
        map.on("click", "parcelles-fill", (e) => {
          if (!e.features.length) return;
          const feature = e.features[0];

          selectionnerParcelle(feature);

          // Surbrillance
          const id = feature.properties?.id ?? feature.id ?? null;
          if (id !== null) {
            map.setFilter("parcelles-selected", ["==", ["get", "id"], id]);
          }

          // Zoom
          const coords = feature.geometry.coordinates[0];
          const lons = coords.map(c => c[0]);
          const lats = coords.map(c => c[1]);
          map.fitBounds([
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ], { padding: 80, duration: 800 });

          e.originalEvent.stopPropagation();
        });

      } catch (err) {
        console.error("Erreur chargement parcelles :", err);
      }
    };

    if (map.isStyleLoaded()) {
      ajouterCouches();
    } else {
      map.on("load", ajouterCouches);
    }

    return () => {
      ["parcelles-selected", "parcelles-border", "parcelles-fill"].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("parcelles-source")) {
        map.removeSource("parcelles-source");
      }
      if (popup) popup.remove();
    };
  }, [map]);

  // ── Visibilité selon couchesActives ──
  useEffect(() => {
    if (!map || !map.getLayer("parcelles-fill")) return;

    if (couchesActives.length === 0) {
      map.setFilter("parcelles-fill",   ["==", ["get", "id"], -999]);
      map.setFilter("parcelles-border", ["==", ["get", "id"], -999]);
    } else {
      map.setFilter("parcelles-fill",   ["in", ["get", "id"], ["literal", couchesActives]]);
      map.setFilter("parcelles-border", ["in", ["get", "id"], ["literal", couchesActives]]);
    }
  }, [map, couchesActives]);

  // ── Surbrillance selon parcelleSelectionnee ──
  useEffect(() => {
    if (!map || !map.getLayer("parcelles-selected")) return;

    if (parcelleSelectionnee) {
      const id = parcelleSelectionnee.properties?.id
              ?? parcelleSelectionnee.id
              ?? null;
      map.setFilter(
        "parcelles-selected",
        ["==", ["get", "id"], id !== null && id !== undefined ? id : -1]
      );
    } else {
      map.setFilter("parcelles-selected", ["==", ["get", "id"], -1]);
    }
  }, [map, parcelleSelectionnee]);

  return null;
}