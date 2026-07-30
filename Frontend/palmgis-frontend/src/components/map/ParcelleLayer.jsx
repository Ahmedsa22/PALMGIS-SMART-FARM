import { useEffect } from "react";
import { getParcelles } from "../../api/parcelles";
import useMapStore from "../../store/mapStore";
import maplibregl from "maplibre-gl"; 

const COULEURS_STATUT = {
  active:     "#22c55e",
  en_repos:   "#f97316",
  abandonnee: "#6b7280",
};

export default function ParcelleLayer({ map }) {
  const selectionnerParcelle = useMapStore(
    (state) => state.selectionnerParcelle
  );

  useEffect(() => {
    if (!map) return;

    let sourceAjoutee = false;

    const ajouterCouches = async () => {
      try {
        const geojson = await getParcelles();
        

        // Déplace l'id dans properties pour que MapLibre puisse le lire
        const geojsonCorrige = {
          ...geojson,
          features: geojson.features.map(f => ({
            ...f,
            properties: {
              ...f.properties,
              id: f.id,
            }
          }))
        };

        // Avant d'ajouter la source, vérifie qu'elle n'existe pas déjà
        

        if (!map.getSource("parcelles-source")) {
        map.addSource("parcelles-source", {
            type: "geojson",
            data: geojsonCorrige,
        });
        sourceAjoutee = true;
        }

        if (!map.getLayer("parcelles-fill")) {

        map.addLayer({
          id: "parcelles-fill",
          type: "fill",
          source: "parcelles-source",
          paint: {
            "fill-color": [
              "match", ["get", "statut"],
              "active",     COULEURS_STATUT.active,
              "en_repos",   COULEURS_STATUT.en_repos,
              "abandonnee", COULEURS_STATUT.abandonnee,
              "#6b7280",
            ],
            "fill-opacity": 0.35,
          },
        });
        }


        if (!map.getLayer("parcelles-border")) {

        map.addLayer({
          id: "parcelles-border",
          type: "line",
          source: "parcelles-source",
          paint: {
            "line-color": [
              "match", ["get", "statut"],
              "active",     COULEURS_STATUT.active,
              "en_repos",   COULEURS_STATUT.en_repos,
              "abandonnee", COULEURS_STATUT.abandonnee,
              "#6b7280",
            ],
            "line-width": 2,
          },
        });
        }



        if (!map.getLayer("parcelles-selected")) {

        map.addLayer({
          id: "parcelles-selected",
          type: "fill",
          source: "parcelles-source",
          paint: {
            "fill-color": "#B08D57",
            "fill-opacity": 0.5,
          },
          filter: ["==", ["get", "id"], -1],
        });
        }

        


        // Clic sur une parcelle
        map.on("click", "parcelles-fill", (e) => {
          if (!e.features.length) return;
          const feature = e.features[0];
          selectionnerParcelle(feature);
          map.setFilter("parcelles-selected", [
            "==", ["get", "id"], feature.properties.id
          ]);
        });

        // Curseur pointer au survol
        map.on("mouseenter", "parcelles-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "parcelles-fill", () => {
          map.getCanvas().style.cursor = "";
        });

        // Clic en dehors → désélectionner
        map.on("click", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["parcelles-fill"],
          });
          if (!features.length) {
            map.setFilter("parcelles-selected", [
              "==", ["get", "id"], -1
            ]);
          }
        });

      } catch (err) {
        console.error("❌ Erreur chargement parcelles :", err);
      }
    };

    if (map.isStyleLoaded()) {
      ajouterCouches();
    } else {
      map.on("load", ajouterCouches);
    }

    return () => {
      if (map && sourceAjoutee) {
        ["parcelles-selected", "parcelles-border", "parcelles-fill"]
          .forEach(id => {
            if (map.getLayer(id)) map.removeLayer(id);
          });
        if (map.getSource("parcelles-source")) {
          map.removeSource("parcelles-source");
        }
      }
    };
  }, [map]);


  const couchesActives = useMapStore((state) => state.couchesActives);

  useEffect(() => {
    if (!map || !map.getLayer("parcelles-fill")) return;

    // Pour chaque feature, filtre selon couchesActives
    if (couchesActives.length === 0) {
      // Aucune couche active → cache tout
      map.setFilter("parcelles-fill",     ["==", ["get", "id"], ""]);
      map.setFilter("parcelles-border",   ["==", ["get", "id"], ""]);
      map.setFilter("parcelles-selected", ["==", ["get", "id"], -1]);
    } else {
      // Affiche uniquement les parcelles dont l'id est dans couchesActives
      const filtre = ["in", ["get", "id"], ["literal", couchesActives]];
      map.setFilter("parcelles-fill",   filtre);
      map.setFilter("parcelles-border", filtre);
    }
}, [map, couchesActives]);

  return null;
}