import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TreePalm, AlertTriangle } from "lucide-react";
import useAuthStore from "../store/authStore";
import { theme } from "../styles/theme";

export default function LoginPage() {
  const navigate = useNavigate();

  // Récupère ce dont on a besoin depuis le store
  const login          = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const error          = useAuthStore((state) => state.error);
  const clearError     = useAuthStore((state) => state.clearError);

  // État local du formulaire
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Si l'utilisateur est déjà connecté (cookie encore valide),
   * on le redirige directement vers /map sans afficher le formulaire.
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/map", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Efface l'erreur quand l'utilisateur commence à retaper.
   */
  useEffect(() => {
    if (error) clearError();
  }, [username, password]);

  /**
   * Soumission du formulaire.
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) return;

    setIsSubmitting(true);

    const succes = await login(username, password);

    if (succes) {
      navigate("/map", { replace: true });
    }

    setIsSubmitting(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: theme.colors.primary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      fontFamily: theme.font.family,
    }}>

      <div style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadow.lg,
        width: "100%",
        maxWidth: 400,
        padding: 32,
      }}>

        {/* En-tête */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: theme.radius.md,
            backgroundColor: theme.colors.primaryLight,
            color: theme.colors.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <TreePalm size={26} />
          </div>
          <h1 style={{ fontSize: theme.font.size.xxl, fontWeight: 700, color: theme.colors.text }}>
            PalmGIS Smart Farm
          </h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: 4, fontSize: theme.font.size.sm }}>
            Connectez-vous pour accéder à la plateforme
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <div>
            <label htmlFor="username" style={labelStyle}>
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre identifiant"
              disabled={isSubmitting}
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={isSubmitting}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              borderLeft: `3px solid ${theme.colors.danger}`,
              backgroundColor: "#FEF2F2",
              color: theme.colors.danger,
              padding: "10px 12px",
              fontSize: theme.font.size.sm,
              borderRadius: theme.radius.sm,
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !username.trim() || !password.trim()}
            style={{
              width: "100%",
              backgroundColor: theme.colors.primary,
              color: "white",
              fontWeight: 600,
              padding: "10px 14px",
              borderRadius: theme.radius.md,
              border: "none",
              cursor: isSubmitting ? "default" : "pointer",
              opacity: (isSubmitting || !username.trim() || !password.trim()) ? 0.5 : 1,
              fontSize: theme.font.size.base,
            }}
          >
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </button>

        </form>

        <p style={{
          textAlign: "center", color: theme.colors.textMuted,
          fontSize: theme.font.size.xs, marginTop: 28,
        }}>
          PalmGIS Smart Farm © 2026
        </p>

      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: theme.font.size.sm,
  fontWeight: 600,
  color: theme.colors.textSecondary,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: `1px solid ${theme.colors.borderStrong}`,
  borderRadius: theme.radius.md,
  fontSize: theme.font.size.base,
  backgroundColor: theme.colors.surface,
  outline: "none",
};
