import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { getPalmsByParcelle } from "../../api/palms";
import useMapStore from "../../store/mapStore";



const COULEURS_SANTE = {
  B:  "#22c55e",
  MO: "#f97316",
  MA: "#ef4444",
  MR: "#1f2937",
};




function appliquerFiltres(map, filtres) {
 

  if (!map.getLayer("palms-layer")) return;

  const conditions = ["all"];

  if (filtres.etatSante?.length > 0) {
    conditions.push(["in", ["get", "etat_sante"], ["literal", filtres.etatSante]]);
  }
  if (filtres.etatSite?.length > 0) {
    conditions.push(["in", ["get", "etat_site"], ["literal", filtres.etatSite]]);
  }
  if (filtres.sexe?.length > 0) {
    conditions.push(["in", ["get", "sexe"], ["literal", filtres.sexe]]);
  }
  if (filtres.age?.length > 0) {
    conditions.push(["in", ["get", "age"], ["literal", filtres.age]]);
  }
  if (filtres.variete) {
    conditions.push(["==", ["get", "variete"], filtres.variete]);
  }

  const filtre = conditions.length > 1 ? conditions : null;
  map.setFilter("palms-layer", filtre);
}



export default function PalmLayer({ map, filtres = {} }) {
  const parcelleSelectionnee = useMapStore(
    (state) => state.parcelleSelectionnee
  );
  const selectionnerPalm = useMapStore(
    (state) => state.selectionnerPalm
  );
  const couchesActives = useMapStore((state) => state.couchesActives);


  useEffect(() => {
    if (!map || !map.getLayer("palms-layer")) return;

    const parcelleId =
      parcelleSelectionnee?.properties?.id ||
      parcelleSelectionnee?.properties?.parcelle;

    if (!parcelleId) return;

    const visible = couchesActives.includes(parcelleId);
    map.setLayoutProperty(
      "palms-layer",
      "visibility",
      visible ? "visible" : "none"
    );
    map.setLayoutProperty(
      "palms-selected",
      "visibility",
      visible ? "visible" : "none"
    );
  }, [map, couchesActives, parcelleSelectionnee]);


  const filtresRef = useRef(filtres);

  // ── Met à jour la ref et applique si la couche existe déjà ──
  useEffect(() => {
    filtresRef.current = filtres;
    if (map && map.getLayer("palms-layer")) {
      appliquerFiltres(map, filtres);
    }
  }, [map, filtres]);



  // ── Charge les palmiers quand la parcelle change ──
  useEffect(() => {
    if (!map || !parcelleSelectionnee) return;

    const parcelleId =
      parcelleSelectionnee.properties?.id ||
      parcelleSelectionnee.properties?.parcelle;

    if (!parcelleId) return;

    let popup = null;

    const ajouterCouches = async () => {
      try {
        const geojson = await getPalmsByParcelle(parcelleId);
        console.log("✅ Palmiers reçus :", geojson.features?.length);

        const geojsonCorrige = {
          ...geojson,
          features: geojson.features.map(f => ({
            ...f,
            properties: { ...f.properties, id: f.id }
          }))
        };

        ["palms-selected", "palms-layer"].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource("palms-source")) {
          map.removeSource("palms-source");
        }

        map.addSource("palms-source", {
          type: "geojson",
          data: geojsonCorrige,
        });

        map.addLayer({
          id: "palms-layer",
          type: "circle",
          source: "palms-source",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              12, 4,
              15, 8,
              18, 12,
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
            "circle-color": "#B08D57",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
          filter: ["==", ["get", "id"], -1],
        });

        // ← Applique les filtres depuis la ref
        appliquerFiltres(map, filtresRef.current);

        // ── Popup au survol ──
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
            <div style="font-family:system-ui,sans-serif;min-width:200px;padding:4px;">
              <div style="background:#2E5E3E;color:white;padding:8px 12px;
                margin:-12px -12px 10px -12px;border-radius:6px 6px 0 0;
                font-weight:bold;font-size:14px;">
                🌴 ${props.code_uni || "Palmier"}
              </div>
              <table style="width:100%;font-size:13px;border-collapse:collapse;">
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">Code local</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${props.code_local || "—"}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">Ligne / N°</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${props.ligne || "—"} / ${props.numero || "—"}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">Variété</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${props.variete || "Non renseignée"}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">Sexe</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${sexe}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">Âge</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${age}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">État sanitaire</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${etatSante}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">État site</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${etatSite}</td>
                </tr>
                ${props.etat_site === "TOF" ? `
                <tr>
                  <td style="color:#6b7280;padding:3px 0;">Nb rejets</td>
                  <td style="font-weight:600;padding:3px 0 3px 8px;">${props.nombre_rejets ?? "—"}</td>
                </tr>` : ""}
              </table>
            </div>
          `;

          if (popup) popup.remove();
          popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: "280px",
            offset: 12,
          })
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map);
        });

        map.on("mouseleave", "palms-layer", () => {
          map.getCanvas().style.cursor = "";
          if (popup) { popup.remove(); popup = null; }
        });

        map.on("click", "palms-layer", (e) => {
          if (!e.features.length) return;
          const feature = e.features[0];
          selectionnerPalm(feature);
          map.setFilter("palms-selected", [
            "==", ["get", "id"], feature.properties.id
          ]);
          e.stopPropagation();
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

    return () => {
      ["palms-selected", "palms-layer"].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource("palms-source")) {
        map.removeSource("palms-source");
      }
      if (popup) popup.remove();
    };
  }, [map, parcelleSelectionnee]);

  

  return null;
}