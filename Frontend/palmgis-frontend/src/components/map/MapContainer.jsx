import { useEffect, useRef, useState } from "react";  
import maplibregl from "maplibre-gl";
import useMapStore from "../../store/mapStore";
import ParcelleLayer from "./ParcelleLayer"; 
import PalmLayer from "./PalmLayer"; 

export default function MapContainer() {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const setMapRef       = useMapStore((state) => state.setMapRef);
  const [mapPret, setMapPret] = useState(false);       // ← ajoute cet état

  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "google-satellite": {
            type: "raster",
            tiles: [
              "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
              "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
              "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
              "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            ],
            tileSize: 256,
            attribution: "© Google",
            maxzoom: 21,
          },
        },
        layers: [{
          id: "google-satellite-layer",
          type: "raster",
          source: "google-satellite",
        }],
      },
      center: [-5.8368, 30.3322],
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    // ← Déclenche le rendu de ParcelleLayer quand la carte est prête
    map.on("load", () => {
      
      setMapPret(true);
    });

    mapRef.current = map;
    setMapRef(map);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapRef(null);
    };
  }, []);

  return (
    <>
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: "100%",
        }}
      />
      {/* ← Monte ParcelleLayer seulement quand la carte est prête */}
      {mapPret && mapRef.current && (
        <>
          <ParcelleLayer map={mapRef.current} />
          <PalmLayer map={mapRef.current} />
        </>
      )}
    </>
  );
}