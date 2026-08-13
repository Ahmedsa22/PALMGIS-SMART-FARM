import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Plus, ChevronLeft, X, CheckCircle2, AlertTriangle,
  ArrowUp, ArrowDown, Ban, Check,
} from "lucide-react";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import Navbar from "../components/layout/Navbar";
import { theme } from "../styles/theme";
import Button from "../components/ui/Button";

export default function UsersPage() {
  const navigate = useNavigate();
  const user     = useAuthStore((state) => state.user);

  const [users, setUsers]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage]     = useState(null);

  // États modal ajout
  const [showAjout, setShowAjout]     = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole]         = useState("viewer");
  const [isCreating, setIsCreating]   = useState(false);

  async function charger() {
    setIsLoading(true);
    try {
      const resp = await api.get("/users/");
      setUsers(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "manager") {
      navigate("/map");
      return;
    }
    charger();
  }, []);

  async function handleChangerRole(userId, nouveauRole) {
    try {
      await api.patch(`/users/${userId}/role/`, { role: nouveauRole });
      setMessage({ type: "success", text: "Rôle mis à jour" });
      charger();
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleToggleActif(userId, isActive) {
    try {
      await api.patch(`/users/${userId}/role/`, { is_active: !isActive });
      setMessage({ type: "success", text: `Compte ${!isActive ? "activé" : "désactivé"}` });
      charger();
    } catch (err) {
      setMessage({ type: "error", text: "Erreur" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleCreerUtilisateur(e) {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    try {
      await api.post("/auth/registration/", {
        username:  newUsername,
        email:     newEmail,
        password1: newPassword,
        password2: newPassword,
      });

      // Si manager → change le rôle immédiatement
      if (newRole === "manager") {
        const resp = await api.get("/users/");
        const created = resp.data.find(u => u.username === newUsername);
        if (created) {
          await api.patch(`/users/${created.id}/role/`, { role: "manager" });
        }
      }

      setMessage({ type: "success", text: `Utilisateur ${newUsername} créé avec succès` });
      setShowAjout(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("viewer");
      charger();
    } catch (err) {
      const data = err.response?.data;
      const msg  = data
        ? Object.values(data).flat().join(" ")
        : "Erreur lors de la création.";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", backgroundColor: theme.colors.bg,
      overflow: "hidden", fontFamily: theme.font.family,
    }}>
      <Navbar />

      {/* En-tête */}
      <div style={{
        backgroundColor: theme.colors.surface, padding: "16px 24px",
        borderBottom: `1px solid ${theme.colors.border}`,
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <h1 style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: theme.font.size.lg, fontWeight: 700, color: theme.colors.text,
          }}>
            <Users size={18} color={theme.colors.primary} /> Gestion des utilisateurs
          </h1>
          <p style={{ fontSize: theme.font.size.sm, color: theme.colors.textMuted, marginTop: 2 }}>
            {users.length} utilisateur(s)
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="primary" icon={Plus} fullWidth={false} onClick={() => setShowAjout(true)}>
            Ajouter
          </Button>
          <Button variant="secondary" icon={ChevronLeft} fullWidth={false} onClick={() => navigate("/map")}>
            Carte
          </Button>
        </div>
      </div>

      {/* Message flash */}
      {message && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          backgroundColor: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
          borderLeft: `3px solid ${message.type === "success" ? theme.colors.success : theme.colors.danger}`,
          color: message.type === "success" ? theme.colors.success : theme.colors.danger,
          padding: "10px 24px", fontSize: theme.font.size.sm,
          fontWeight: 500, flexShrink: 0,
        }}>
          {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Liste utilisateurs */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {isLoading ? (
          <p style={{ textAlign: "center", color: theme.colors.textMuted, padding: 32 }}>
            Chargement...
          </p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: "center", color: theme.colors.textMuted, padding: 32 }}>
            Aucun autre utilisateur.
          </p>
        ) : (
          <div style={{
            overflowX: "auto", backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg,
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.size.sm }}>
              <thead>
                <tr>
                  {["Utilisateur", "Rôle", "Statut", "Email", "Inscrit le", "Actions"].map(col => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.colors.bg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{u.username}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: theme.font.size.xs, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.5px",
                        color: theme.colors.textSecondary,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: u.role === "manager" ? theme.colors.accent : theme.colors.info,
                        }} />
                        {u.role === "manager" ? "Manager" : "Viewer"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: theme.font.size.xs, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.5px",
                        color: u.is_active ? theme.colors.success : theme.colors.danger,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: u.is_active ? theme.colors.success : theme.colors.danger,
                        }} />
                        {u.is_active ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: theme.colors.textMuted }}>
                      {u.email || "—"}
                    </td>
                    <td style={{ ...tdStyle, color: theme.colors.textMuted, whiteSpace: "nowrap" }}>
                      {u.date_joined}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleChangerRole(
                            u.id,
                            u.role === "manager" ? "viewer" : "manager"
                          )}
                          style={u.role === "manager" ? dangerActionStyle : primaryActionStyle}
                        >
                          {u.role === "manager" ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                          {u.role === "manager" ? "Viewer" : "Manager"}
                        </button>

                        <button
                          onClick={() => handleToggleActif(u.id, u.is_active)}
                          style={u.is_active ? dangerActionStyle : primaryActionStyle}
                        >
                          {u.is_active ? <Ban size={11} /> : <Check size={11} />}
                          {u.is_active ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ajout utilisateur */}
      {showAjout && (
        <>
          <div
            onClick={() => setShowAjout(false)}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(15,23,42,0.5)", zIndex: 40,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.lg,
            border: `1px solid ${theme.colors.border}`,
            padding: 24,
            width: 360,
            zIndex: 50,
            fontFamily: theme.font.family,
          }}>

            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 20,
            }}>
              <h2 style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: theme.font.size.base, fontWeight: 700, color: theme.colors.text,
              }}>
                <Plus size={16} color={theme.colors.primary} /> Nouvel utilisateur
              </h2>
              <button onClick={() => setShowAjout(false)} style={closeButtonStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreerUtilisateur}>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  required
                  placeholder="Ex: ahmed"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ahmed@gmail.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Mot de passe *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Rôle</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "viewer",  label: "Viewer"  },
                    { value: "manager", label: "Manager" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewRole(value)}
                      style={{
                        flex: 1, padding: "8px",
                        borderRadius: theme.radius.md,
                        border: `1px solid ${newRole === value ? theme.colors.primary : theme.colors.border}`,
                        backgroundColor: newRole === value ? theme.colors.primary : theme.colors.surface,
                        color: newRole === value ? "white" : theme.colors.textSecondary,
                        cursor: "pointer", fontSize: theme.font.size.sm, fontWeight: 600,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Button type="button" variant="secondary" onClick={() => setShowAjout(false)} style={{ flex: 1 }}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={isCreating} style={{ flex: 2 }}>
                  {isCreating ? "Création..." : "Créer"}
                </Button>
              </div>

            </form>
          </div>
        </>
      )}

    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px",
  borderRadius: theme.radius.md, border: `1px solid ${theme.colors.borderStrong}`,
  fontSize: theme.font.size.sm, boxSizing: "border-box",
  backgroundColor: theme.colors.surface, outline: "none",
  fontFamily: theme.font.family,
};

const labelStyle = {
  display: "block", fontSize: theme.font.size.xs,
  fontWeight: 600, color: theme.colors.textSecondary, marginBottom: 4,
};

const closeButtonStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "none",
  cursor: "pointer", color: theme.colors.textMuted,
  width: 28, height: 28,
};

const thStyle = {
  padding: "10px 12px", textAlign: "left",
  fontSize: "11px", fontWeight: 600,
  color: theme.colors.textMuted, textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: `1px solid ${theme.colors.border}`,
};

const tdStyle = {
  padding: "10px 12px", color: theme.colors.text,
};

const actionButtonBase = {
  display: "flex", alignItems: "center", gap: 4,
  padding: "4px 8px", borderRadius: theme.radius.sm,
  cursor: "pointer", fontSize: theme.font.size.xs, fontWeight: 600,
  backgroundColor: "transparent",
};

const primaryActionStyle = {
  ...actionButtonBase,
  border: `1px solid ${theme.colors.success}`,
  color: theme.colors.success,
};

const dangerActionStyle = {
  ...actionButtonBase,
  border: `1px solid ${theme.colors.danger}`,
  color: theme.colors.danger,
};
