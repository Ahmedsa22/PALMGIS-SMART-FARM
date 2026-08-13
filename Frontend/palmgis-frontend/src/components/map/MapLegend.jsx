import { TreePalm, LandPlot } from "lucide-react";
import { theme } from "../../styles/theme";

export default function MapLegend({ visible }) {
  if (!visible) return null;

  const etats = [
    { label: "Bon état",   couleur: theme.colors.santeBon,    code: "B"  },
    { label: "Moyen",      couleur: theme.colors.santeMoyen,  code: "MO" },
    { label: "Mauvais",    couleur: theme.colors.santeMauvais, code: "MA" },
    { label: "Mort",       couleur: theme.colors.santeMort,   code: "MR" },
    { label: "Vide",       couleur: theme.colors.textMuted,   code: "AB" },
  ];

  const types = [
    { label: "Ferme",      couleur: theme.colors.typeFerme, style: "dashed" },
    { label: "Zone",       couleur: theme.colors.typeZone,  style: "dashed" },
    { label: "Active",     couleur: theme.colors.success,   style: "solid"  },
    { label: "En repos",   couleur: theme.colors.warning,   style: "solid"  },
    { label: "Abandonnée", couleur: theme.colors.textMuted, style: "solid"  },
  ];

  return (
    <div style={{
      position: "absolute",
      bottom: "2rem",
      right: "0.75rem",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadow.md,
      border: `1px solid ${theme.colors.border}`,
      padding: 16,
      zIndex: 10,
      minWidth: 170,
      fontFamily: theme.font.family,
    }}>

      {/* Titre */}
      <p style={legendTitleStyle}>
        <TreePalm size={12} /> État sanitaire
      </p>

      {/* Palmiers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {etats.map(({ label, couleur, code }) => (
          <div key={code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: couleur, flexShrink: 0,
            }} />
            <span style={{ fontSize: theme.font.size.sm, color: theme.colors.textSecondary }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, backgroundColor: theme.colors.border, marginBottom: 12 }} />

      {/* Titre parcelles */}
      <p style={legendTitleStyle}>
        <LandPlot size={12} /> Parcelles
      </p>

      {/* Types parcelles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {types.map(({ label, couleur, style }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 14, height: 6,
              backgroundColor: style === "dashed" ? "transparent" : couleur,
              border: `2px ${style} ${couleur}`,
              borderRadius: 2,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: theme.font.size.sm, color: theme.colors.textSecondary }}>
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

const legendTitleStyle = {
  display: "flex", alignItems: "center", gap: 6,
  fontSize: theme.font.size.xs, fontWeight: 700,
  color: theme.colors.textMuted, textTransform: "uppercase",
  letterSpacing: "1px", marginBottom: 8,
};
