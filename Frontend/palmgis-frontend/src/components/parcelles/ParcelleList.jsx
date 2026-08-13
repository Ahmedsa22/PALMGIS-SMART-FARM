import { useState, useEffect } from "react";
import { LandPlot, TreePalm, Upload, Search } from "lucide-react";
import { getParcelles } from "../../api/parcelles";
import { getPalms } from "../../api/palms";
import useMapStore from "../../store/mapStore";
import useAuthStore from "../../store/authStore";
import { theme } from "../../styles/theme";
import { SectionTitle } from "../ui/Badge";

const STATUT_LABELS = {
  active:     "Active",
  en_repos:   "En repos",
  abandonnee: "Abandonnée",
};
const STATUT_COLORS = {
  active:     theme.colors.success,
  en_repos:   theme.colors.warning,
  abandonnee: theme.colors.textMuted,
};

const TYPE_LABELS = { ferme: "Ferme", zone: "Zone", parcelle: "Parcelle" };

export default function ParcelleList({
  onShowImport,
  onShowImportPalms,
}) {
  const user                 = useAuthStore((state) => state.user);
  const selectionnerParcelle = useMapStore((state) => state.selectionnerParcelle);
  const zoomSurParcelle      = useMapStore((state) => state.zoomSurParcelle);
  const couchesActives       = useMapStore((state) => state.couchesActives);
  const toggleCouche         = useMapStore((state) => state.toggleCouche);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* En-tête */}
      <div style={{
        padding: 16,
        borderBottom: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 10,
        }}>
          <SectionTitle>Parcelles</SectionTitle>

          {/* Boutons import */}
          {user?.role === "manager" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={onShowImportPalms}
                title="Importer palmiers"
                style={iconButtonStyle}
              >
                <TreePalm size={14} />
              </button>
              <button
                onClick={onShowImport}
                title="Importer parcelles"
                style={{ ...iconButtonStyle, backgroundColor: theme.colors.primary, color: "white", borderColor: theme.colors.primary }}
              >
                <Upload size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Recherche */}
        <div style={{ position: "relative" }}>
          <Search size={14} color={theme.colors.textMuted} style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          }} />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une parcelle..."
            style={{
              width: "100%", padding: "8px 10px 8px 30px",
              borderRadius: theme.radius.md, border: `1px solid ${theme.colors.borderStrong}`,
              fontSize: theme.font.size.sm, boxSizing: "border-box",
              outline: "none", fontFamily: theme.font.family,
            }}
          />
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {isLoading ? (
          <p style={emptyStateStyle}>Chargement...</p>
        ) : parcellesFiltrees.length === 0 ? (
          <p style={emptyStateStyle}>Aucune parcelle trouvée</p>
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
                  gap: 10, padding: "8px 16px",
                  borderBottom: `1px solid ${theme.colors.border}`,
                  cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.colors.bg}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                {/* Case à cocher */}
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleCouche(id)}
                  onClick={e => e.stopPropagation()}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                />

                <LandPlot size={14} color={theme.colors.textMuted} style={{ flexShrink: 0 }} />

                {/* Infos parcelle */}
                <div
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={() => {
                    selectionnerParcelle(feature);
                    if (feature.bbox) {
                      zoomSurParcelle(feature.bbox);
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontWeight: 600, fontSize: theme.font.size.sm,
                      color: theme.colors.text,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {p.nom}
                    </span>
                    {p.type_parcelle && (
                      <span style={{
                        fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px",
                        color: theme.colors.textMuted, flexShrink: 0,
                      }}>
                        {TYPE_LABELS[p.type_parcelle] || p.type_parcelle}
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 2,
                  }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: theme.font.size.xs, color: theme.colors.textSecondary,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        backgroundColor: STATUT_COLORS[p.statut] || theme.colors.textMuted,
                      }} />
                      {STATUT_LABELS[p.statut] || p.statut}
                    </span>
                    <span style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                      {nbPalms[id] ?? "…"} palmiers
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

const iconButtonStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.surface,
  color: theme.colors.textSecondary,
  border: `1px solid ${theme.colors.border}`,
  cursor: "pointer",
};

const emptyStateStyle = {
  textAlign: "center", color: theme.colors.textMuted,
  fontSize: theme.font.size.sm, padding: 24,
};
