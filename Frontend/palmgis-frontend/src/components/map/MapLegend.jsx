export default function MapLegend({ visible }) {
  if (!visible) return null;

  const etats = [
    { label: "Bon état",   couleur: "#22c55e", code: "B"  },
    { label: "Moyen",      couleur: "#f97316", code: "MO" },
    { label: "Mauvais",    couleur: "#ef4444", code: "MA" },
    { label: "Mort",       couleur: "#1f2937", code: "MR" },
    { label: "Vide",       couleur: "#6b7280", code: "AB" },
  ];

  const statuts = [
    { label: "Active",     couleur: "#22c55e" },
    { label: "En repos",   couleur: "#f97316" },
    { label: "Abandonnée", couleur: "#6b7280" },
  ];

  const types = [
    { label: "Ferme",    couleur: "#dc2626", style: "dashed" },
    { label: "Zone",     couleur: "#3b82f6", style: "dashed" },
    { label: "Active",   couleur: "#22c55e", style: "solid"  },
    { label: "En repos", couleur: "#f97316", style: "solid"  },
    { label: "Abandonnee", couleur: "#6b7280", style: "solid" },
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


      {/* Types parcelles */}
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.35rem",
        marginTop: "0.75rem",
      }}>
        {types.map(({ label, couleur, style }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
            <div style={{
              width: "14px", height: "8px",
              backgroundColor: couleur,
              border: `2px ${style} ${couleur}`,
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
