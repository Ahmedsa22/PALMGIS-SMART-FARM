export const theme = {
  colors: {
    primary:       "#1B4332",   // vert forêt foncé
    primaryHover:  "#14532d",
    primaryLight:  "#D8F3DC",
    accent:        "#B08D57",   // doré désert
    bg:            "#F8FAF9",   // fond app
    surface:       "#FFFFFF",
    border:        "#E2E8F0",
    borderStrong:  "#CBD5E1",
    text:          "#0F172A",
    textSecondary: "#475569",
    textMuted:     "#94A3B8",
    success:       "#16A34A",
    warning:       "#EA580C",
    danger:        "#DC2626",
    info:          "#2563EB",
    // États sanitaires (carto)
    santeBon:      "#16A34A",
    santeMoyen:    "#EA580C",
    santeMauvais:  "#DC2626",
    santeMort:     "#1E293B",
    // Types de parcelles (carto)
    typeFerme:     "#DC2626",
    typeZone:      "#2563EB",
  },
  radius:  { sm: "4px", md: "6px", lg: "8px" },
  shadow:  {
    sm: "0 1px 2px rgba(15,23,42,0.06)",
    md: "0 2px 8px rgba(15,23,42,0.08)",
    lg: "0 8px 24px rgba(15,23,42,0.12)",
  },
  font: {
    family: "'Inter', system-ui, -apple-system, sans-serif",
    size: { xs: "11px", sm: "12.5px", base: "14px", lg: "16px", xl: "18px", xxl: "22px" },
  },
};
