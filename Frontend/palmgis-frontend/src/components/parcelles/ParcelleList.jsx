import { useState, useEffect } from "react";
import { getParcelles } from "../../api/parcelles";
import { getPalms } from "../../api/palms";
import useMapStore from "../../store/mapStore";
import useAuthStore from "../../store/authStore";

export default function ParcelleList({
  onShowImport,
  onShowImportPalms,
}) {
  const user                 = useAuthStore((state) => state.user);
  const selectionnerParcelle = useMapStore((state) => state.selectionnerParcelle);
  const zoomSurParcelle      = useMapStore((state) => state.zoomSurParcelle);
  const couchesActives       = useMapStore((state) => state.couchesActives);
  const toggleCouche         = useMapStore((state) => state.toggleCouche);
  const setCouchesActives    = useMapStore((state) => state.setCouchesActives);

  const [parcelles, setParcelles]     = useState([]);
  const [nbPalms, setNbPalms]         = useState({});  // { parcelleId: nb }
  const [isLoading, setIsLoading]     = useState(true);
  const [recherche, setRecherche]     = useState("");

  useEffect(() => {
    async function charger() {
      setIsLoading(true);
      try {
        const data = await getParcelles();
        const features = data.features || [];
        setParcelles(features);

       

        // Compte les palmiers par parcelle
        const counts = {};
        await Promise.all(
          features.map(async (f) => {
            const id = f.properties.id || f.id;
            try {
              const palms = await getPalms({ parcelle: id });
              counts[id] = palms.features?.length || 0;
            } catch {
              counts[id] = 0;
            }
          })
        );
        setNbPalms(counts);

      } catch (err) {
        console.error("Erreur chargement parcelles:", err);
      } finally {
        setIsLoading(false);
      }
    }
    charger();
  }, []);

  const parcellesFiltrees = parcelles.filter(f =>
    f.properties.nom?.toLowerCase().includes(recherche.toLowerCase())
  );

  const statutCouleur = {
    active:     "#22c55e",
    en_repos:   "#f97316",
    abandonnee: "#6b7280",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* En-tête */}
      <div style={{
        padding: "0.75rem 1rem",
        borderBottom: "1px solid #f3f4f6",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "0.5rem",
        }}>
          <h2 style={{
            fontWeight: "bold", color: "#374151", fontSize: "0.9rem"
          }}>
            📋 Parcelles
          </h2>

          {/* Boutons import */}
          {user?.role === "manager" && (
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                onClick={onShowImport}
                title="Importer parcelles"
                style={{
                  padding: "0.3rem 0.5rem", borderRadius: "0.4rem",
                  backgroundColor: "#2E5E3E", color: "white",
                  border: "none", cursor: "pointer", fontSize: "0.75rem",
                }}
              >
                📂
              </button>
              <button
                onClick={onShowImportPalms}
                title="Importer palmiers"
                style={{
                  padding: "0.3rem 0.5rem", borderRadius: "0.4rem",
                  backgroundColor: "#f0fdf4", color: "#2E5E3E",
                  border: "1px solid #bbf7d0",
                  cursor: "pointer", fontSize: "0.75rem",
                }}
              >
                🌴
              </button>
            </div>
          )}
        </div>

        {/* Recherche */}
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une parcelle..."
          style={{
            width: "100%", padding: "0.4rem 0.6rem",
            borderRadius: "0.4rem", border: "1px solid #e5e7eb",
            fontSize: "0.8rem", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>

        {isLoading ? (
          <p style={{
            textAlign: "center", color: "#9ca3af",
            fontSize: "0.82rem", padding: "1rem"
          }}>
            Chargement...
          </p>
        ) : parcellesFiltrees.length === 0 ? (
          <p style={{
            textAlign: "center", color: "#9ca3af",
            fontSize: "0.82rem", padding: "1rem"
          }}>
            Aucune parcelle trouvée
          </p>
        ) : (
          parcellesFiltrees.map((feature) => {
            const p  = feature.properties;
            const id = p.id || feature.id;
            const active = couchesActives.includes(id);

            return (
              <div
                key={id}
                style={{
                  display: "flex", alignItems: "center",
                  gap: "0.5rem", padding: "0.6rem 0.5rem",
                  borderRadius: "0.5rem", marginBottom: "0.3rem",
                  backgroundColor: "white",
                  border: "1px solid #f3f4f6",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}
              >
                {/* Case à cocher */}
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleCouche(id)}
                  onClick={e => e.stopPropagation()}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                />

                {/* Infos parcelle */}
                <div
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={() => {
                    selectionnerParcelle(feature);
                    // Zoom sur la parcelle
                    if (feature.bbox) {
                      zoomSurParcelle(feature.bbox);
                    }
                  }}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{
                      fontWeight: 600, fontSize: "0.85rem",
                      color: "#1f2937",
                    }}>
                      {p.nom}
                    </span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600,
                      color: statutCouleur[p.statut] || "#6b7280",
                    }}>
                      ● {p.statut === "active" ? "Active"
                        : p.statut === "en_repos" ? "En repos"
                        : "Abandonnée"}
                    </span>
                  </div>
                  <div style={{
                    display: "flex", gap: "0.75rem",
                    marginTop: "0.2rem",
                  }}>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                      📐 {p.superficie_ha} ha
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                      🌴 {nbPalms[id] ?? "..."} palmiers
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}