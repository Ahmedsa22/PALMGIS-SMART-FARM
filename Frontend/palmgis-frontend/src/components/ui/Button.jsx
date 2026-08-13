import { useState } from "react";
import { theme } from "../../styles/theme";

const VARIANTS = {
  primary: {
    backgroundColor: theme.colors.primary,
    hoverBackgroundColor: theme.colors.primaryHover,
    color: "white",
    border: "none",
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    hoverBackgroundColor: theme.colors.bg,
    color: theme.colors.textSecondary,
    border: `1px solid ${theme.colors.border}`,
  },
  danger: {
    backgroundColor: "transparent",
    hoverBackgroundColor: "#FEF2F2",
    color: theme.colors.danger,
    border: `1px solid ${theme.colors.danger}`,
  },
};

export default function Button({
  variant = "secondary",
  icon: Icon,
  children,
  style,
  fullWidth = true,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.secondary;

  return (
    <button
      {...rest}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: fullWidth ? "100%" : "auto",
        padding: "8px 14px",
        borderRadius: theme.radius.md,
        fontWeight: 600,
        fontSize: theme.font.size.sm,
        fontFamily: theme.font.family,
        cursor: rest.disabled ? "default" : "pointer",
        opacity: rest.disabled ? 0.5 : 1,
        backgroundColor: hover && !rest.disabled ? v.hoverBackgroundColor : v.backgroundColor,
        color: v.color,
        border: v.border,
        transition: "background-color 120ms ease",
        ...style,
      }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
