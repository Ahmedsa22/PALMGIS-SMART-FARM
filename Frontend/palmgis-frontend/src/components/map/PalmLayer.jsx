import { useEffect } from "react";
import { getPalmsByParcelle } from "../../api/palms";
import useMapStore from "../../store/mapStore";
import maplibregl from "maplibre-gl"; 

// Couleurs selon l'état sanitaire
const COULEURS_SANTE = {
  B:  "#22c55e",  // vert — Bon
  MO: "#f97316",  // orange — Moyen
  MA: "#ef4444",  // rouge — Mauvais
  MR: "#1f2937",  // noir — Mort
};

export default function PalmLayer({ map }) {
  const parcelleSelectionnee = useMapStore(
    (state) => state.parcelleSelectionnee
  );
  const selectionnerPalm = useMapStore(
    (state) => state.selectionnerPalm
  );

  useEffect(() => {
    if (!map || !parcelleSelectionnee) return;

    const parcelleId = parcelleSelectionnee.properties?.id ||
                       parcelleSelectionnee.properties?.parcelle;

    if (!parcelleId) return;

    let sourceAjoutee = false;

    const ajouterCouches = async () => {
      try {
        // Charge les palmiers de la parcelle sélectionnée
        const geojson = await getPalmsByParcelle(parcelleId);
        console.log("✅ Palmiers reçus :", geojson.features?.length);

        // Déplace l'id dans properties
        const geojsonCorrige = {
          ...geojson,
          features: geojson.features.map(f => ({
            ...f,
            properties: { ...f.properties, id: f.id }
          }))
        };

        // Retire les couches existantes si on change de parcelle
        ["palms-selected", "palms-layer"].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource("palms-source")) {
          map.removeSource("palms-source");
        }

        // Ajoute la source
        map.addSource("palms-source", {
          type: "geojson",
          data: geojsonCorrige,
        });
        sourceAjoutee = true;

        // Couche des points palmiers
        map.addLayer({
          id: "palms-layer",
          type: "circle",
          source: "palms-source",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              12, 4,   // zoom 12 → rayon 4px
              15, 8,   // zoom 15 → rayon 8px
              18, 12,  // zoom 18 → rayon 12px
            ],
            "circle-color": [
              "match", ["get", "etat_sante"],
              "B",  COULEURS_SANTE.B,
              "MO", COULEURS_SANTE.MO,
              "MA", COULEURS_SANTE.MA,
              "MR", COULEURS_SANTE.MR,
              "#6b7280",
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Couche de surbrillance (palmier sélectionné)
        map.addLayer({
          id: "palms-selected",
          type: "circle",
          source: "palms-source",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              12, 8,
              15, 14,
              18, 20,
            ],
            "circle-color": "#B08D57",   // doré
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
          filter: ["==", ["get", "id"], -1],
        });

        // Clic sur un palmier
        // Clic sur un palmier → popup + sélection
        // Référence au popup pour pouvoir le fermer au mouseleave
        let popup = null;

        // Survol → affiche le popup
        map.on("mouseenter", "palms-layer", (e) => {
            if (!e.features.length) return;

            map.getCanvas().style.cursor = "pointer";

            const feature = e.features[0];
            const props   = feature.properties;
            const coords  = feature.geometry.coordinates.slice();

            const etatSante = {
                B: "✅ Bon", MO: "⚠️ Moyen",
                MA: "🔴 Mauvais", MR: "💀 Mort"
            }[props.etat_sante] || props.etat_sante;

            const etatSite = {
                ISO: "Isolé", TOF: "Touffes", V: "Vide"
            }[props.etat_site] || props.etat_site;

            const age = {
                JP: "Jeune", A: "Adulte", V: "Vieux"
            }[props.age] || props.age;

            const sexe = props.sexe === "M" ? "Mâle" : "Femelle";

            const html = `
                <div style="
                font-family: system-ui, sans-serif;
                min-width: 200px;
                padding: 4px;
                ">
                <div style="
                    background: #2E5E3E;
                    color: white;
                    padding: 8px 12px;
                    margin: -12px -12px 10px -12px;
                    border-radius: 6px 6px 0 0;
                    font-weight: bold;
                    font-size: 14px;
                ">
                    🌴 ${props.code_uni || "Palmier"}
                </div>
                <table style="width:100%; font-size:13px; border-collapse:collapse;">
                    <tr>
                    <td style="color:#6b7280; padding:3px 0;">Code local</td>
                    <td style="font-weight:600; padding:3px 0 3px 8px;">
                        ${props.code_local || "—"}
                    </td>
                    </tr>
                    <tr>
                    <td style="color:#6b7280; padding:3px 0;">Ligne / N°</td>
                    <td style="font-weight:600; padding:3px 0 3px 8px;">
                        ${props.ligne || "—"} / ${props.numero || "—"}
                    </td>
                    </tr>
                    <tr>
                    <td style="color:#6b7280; padding:3px 0;">Variété</td>
                    <td style="font-weight:600; padding:3px 0 3px 8px;">
                        ${props.variete || "Non renseignée"}
                    </td>
                    </tr>
                    <tr>
                    <td style="color:#6b7280; padding:3px 0;">Sexe</td>
                    <td style="font-weight:600; padding:3px 0 3px 8px;">
                        ${sexe}
                    </td>
                    </tr>
                    <tr>
                    <td style="color:#6b7280; padding:3px 0;">Âge</td>
                    <td style="font-weight:600; padding:3px 0 3px 8px;">
                        ${age}
                    </td>
                    </tr>
                    <tr>
                    <td style="color:#6b7280; padding:3px 0;">État sanitaire</td>
                    <td style="font-weight:600; padding:3px 0 3px 8px;">
                        ${etatSante}
                    </td>
                    </tr>
                    <tr>
                    <td style="color:#6b7280; padding:3px 0;">État site</td>
                    <td style="font-weight:600; padding:3px 0 3px 8px;">
                        ${etatSite}
                    </td>
                    </tr>
                </table>
                </div>
            `;

            // Ferme l'ancien popup s'il existe
            if (popup) popup.remove();

            // Crée le nouveau popup
            popup = new maplibregl.Popup({
                closeButton: false,   // pas de croix — il disparaît au mouseleave
                closeOnClick: false,
                maxWidth: "280px",
                offset: 12,
            })
                .setLngLat(coords)
                .setHTML(html)
                .addTo(map);

            // Test immédiat — vérifie que l'événement mouseenter se déclenche
            map.on("mouseenter", "palms-layer", (e) => {
            console.log("🖱️ Survol palmier :", e.features[0]?.properties);
            // ... reste du code
            });
            });

        // Quitte le point → ferme le popup
        map.on("mouseleave", "palms-layer", () => {
        map.getCanvas().style.cursor = "";
        if (popup) {
            popup.remove();
            popup = null;
        }
        });

        // Clic → sélectionne le palmier (garde la surbrillance dorée)
        map.on("click", "palms-layer", (e) => {
        if (!e.features.length) return;
        const feature = e.features[0];
        selectionnerPalm(feature);
        map.setFilter("palms-selected", [
            "==", ["get", "id"], feature.properties.id
        ]);
        e.stopPropagation();
        });

        // Curseur pointer au survol
        map.on("mouseenter", "palms-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "palms-layer", () => {
          map.getCanvas().style.cursor = "";
        });

      } catch (err) {
        console.error("❌ Erreur chargement palmiers :", err);
      }
    };

    if (map.isStyleLoaded()) {
      ajouterCouches();
    } else {
      map.on("load", ajouterCouches);
    }

    // Nettoyage quand la parcelle change
    return () => {
      ["palms-selected", "palms-layer"].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("palms-source")) {
        map.removeSource("palms-source");
      }
    };

  }, [map, parcelleSelectionnee]); // ← recharge quand la parcelle change

  return null;
}