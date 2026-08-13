import { theme } from "../../styles/theme";

// Badge de statut : point coloré + libellé, sans fond coloré (règle design SIG)
export default function StatusBadge({ label, color }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: theme.font.size.xs,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontWeight: 600,
      color: theme.colors.textSecondary,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        backgroundColor: color, flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

// Étiquette de type (parcelle/ferme/zone...) avec bordure fine, pas de fond plein
export function TypeBadge({ label, color }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: theme.font.size.xs,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontWeight: 600,
      color,
      border: `1px solid ${color}`,
      borderRadius: theme.radius.sm,
      padding: "2px 6px",
    }}>
      {label}
    </span>
  );
}

export function SectionTitle({ children, style }) {
  return (
    <p style={{
      fontSize: theme.font.size.xs,
      textTransform: "uppercase",
      letterSpacing: "1px",
      color: theme.colors.textMuted,
      fontWeight: 600,
      ...style,
    }}>
      {children}
    </p>
  );
}

export function AttributeRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 32,
      padding: "4px 0",
      borderBottom: `1px solid ${theme.colors.border}`,
      gap: 12,
    }}>
      <span style={{ fontSize: theme.font.size.sm, color: theme.colors.textSecondary }}>
        {label}
      </span>
      <span style={{
        fontSize: theme.font.size.sm, fontWeight: 600,
        color: theme.colors.text, textAlign: "right",
      }}>
        {value}
      </span>
    </div>
  );
}
