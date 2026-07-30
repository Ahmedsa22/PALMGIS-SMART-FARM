export default function MapLegend({ visible }) {
  if (!visible) return null;

  const etats = [
    { label: "Bon état",   couleur: "#22c55e", code: "B"  },
    { label: "Moyen",      couleur: "#f97316", code: "MO" },
    { label: "Mauvais",    couleur: "#ef4444", code: "MA" },
    { label: "Mort",       couleur: "#1f2937", code: "MR" },
  ];

  const statuts = [
    { label: "Active",     couleur: "#22c55e" },
    { label: "En repos",   couleur: "#f97316" },
    { label: "Abandonnée", couleur: "#6b7280" },
  ];

  return (
    <div style={{
      position: "absolute",
      bottom: "2rem",
      right: "0.75rem",
      backgroundColor: "white",
      borderRadius: "0.75rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      padding: "0.75rem 1rem",
      zIndex: 10,
      minWidth: "160px",
      border: "1px solid #e5e7eb",
    }}>

      {/* Titre */}
      <p style={{
        fontSize: "0.7rem", fontWeight: 700,
        color: "#2E5E3E", textTransform: "uppercase",
        letterSpacing: "0.05em", marginBottom: "0.6rem",
      }}>
        🌴 État sanitaire
      </p>

      {/* Palmiers */}
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.35rem",
        marginBottom: "0.75rem",
      }}>
        {etats.map(({ label, couleur, code }) => (
          <div key={code} style={{
            display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
            <div style={{
              width: "12px", height: "12px",
              borderRadius: "50%",
              backgroundColor: couleur,
              border: "1.5px solid white",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.78rem", color: "#374151" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Séparateur */}
      <div style={{
        height: "1px", backgroundColor: "#f3f4f6",
        marginBottom: "0.6rem",
      }} />

      {/* Titre parcelles */}
      <p style={{
        fontSize: "0.7rem", fontWeight: 700,
        color: "#2E5E3E", textTransform: "uppercase",
        letterSpacing: "0.05em", marginBottom: "0.5rem",
      }}>
        📐 Parcelles
      </p>

      {/* Statuts parcelles */}
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.35rem"
      }}>
        {statuts.map(({ label, couleur }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
            <div style={{
              width: "14px", height: "8px",
              backgroundColor: couleur,
              opacity: 0.5,
              border: `2px solid ${couleur}`,
              borderRadius: "2px",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.78rem", color: "#374151" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
