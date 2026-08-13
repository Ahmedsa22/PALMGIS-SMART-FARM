import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/authStore";
import Navbar from "../components/layout/Navbar";

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
      setMessage("✅ Rôle mis à jour");
      charger();
    } catch (err) {
      setMessage("❌ Erreur lors de la mise à jour");
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleToggleActif(userId, isActive) {
    try {
      await api.patch(`/users/${userId}/role/`, { is_active: !isActive });
      setMessage(`✅ Compte ${!isActive ? "activé" : "désactivé"}`);
      charger();
    } catch (err) {
      setMessage("❌ Erreur");
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

      setMessage(`✅ Utilisateur ${newUsername} créé avec succès`);
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
      setMessage(`❌ ${msg}`);
    } finally {
      setIsCreating(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.5rem",
    borderRadius: "0.4rem", border: "1px solid #d1d5db",
    fontSize: "0.82rem", boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block", fontSize: "0.78rem",
    fontWeight: 600, color: "#374151", marginBottom: "0.2rem",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", backgroundColor: "#f9fafb",
      overflow: "hidden",
    }}>
      <Navbar />

      {/* En-tête */}
      <div style={{
        backgroundColor: "white", padding: "1rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2E5E3E" }}>
            👥 Gestion des utilisateurs
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.1rem" }}>
            {users.length} utilisateur(s)
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowAjout(true)}
            style={{
              padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
              backgroundColor: "#2E5E3E", border: "none",
              cursor: "pointer", fontSize: "0.8rem",
              color: "white", fontWeight: 600,
            }}
          >
            ➕ Ajouter
          </button>
          <button
            onClick={() => navigate("/map")}
            style={{
              padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
              backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
              cursor: "pointer", fontSize: "0.8rem", color: "#374151",
            }}
          >
            ← Carte
          </button>
        </div>
      </div>

      {/* Message flash */}
      {message && (
        <div style={{
          backgroundColor: message.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${message.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`,
          color: message.startsWith("✅") ? "#166534" : "#dc2626",
          padding: "0.6rem 1.5rem", fontSize: "0.85rem",
          fontWeight: 500, flexShrink: 0,
        }}>
          {message}
        </div>
      )}

      {/* Liste utilisateurs */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
            Chargement...
          </p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
            Aucun autre utilisateur.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {users.map(u => (
              <div key={u.id} style={{
                backgroundColor: "white",
                borderRadius: "0.75rem", padding: "1rem",
                border: `1px solid ${u.is_active ? "#e5e7eb" : "#fecaca"}`,
                display: "flex", justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1f2937" }}>
                      {u.username}
                    </span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600,
                      padding: "0.15rem 0.5rem", borderRadius: "1rem",
                      backgroundColor: u.role === "manager" ? "#f0fdf4" : "#eff6ff",
                      color: u.role === "manager" ? "#166534" : "#1e40af",
                    }}>
                      {u.role === "manager" ? "⚙️ Manager" : "👁️ Viewer"}
                    </span>
                    {!u.is_active && (
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 600,
                        padding: "0.15rem 0.5rem", borderRadius: "1rem",
                        backgroundColor: "#fef2f2", color: "#dc2626",
                      }}>
                        Désactivé
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem" }}>
                    {u.email || "Pas d'email"} — Inscrit le {u.date_joined}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => handleChangerRole(
                      u.id,
                      u.role === "manager" ? "viewer" : "manager"
                    )}
                    style={{
                      padding: "0.4rem 0.6rem", borderRadius: "0.4rem",
                      backgroundColor: u.role === "manager" ? "#fef2f2" : "#f0fdf4",
                      border: `1px solid ${u.role === "manager" ? "#fecaca" : "#bbf7d0"}`,
                      color: u.role === "manager" ? "#dc2626" : "#166534",
                      cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                    }}
                  >
                    {u.role === "manager" ? "⬇️ Viewer" : "⬆️ Manager"}
                  </button>

                  <button
                    onClick={() => handleToggleActif(u.id, u.is_active)}
                    style={{
                      padding: "0.4rem 0.6rem", borderRadius: "0.4rem",
                      backgroundColor: u.is_active ? "#fef2f2" : "#f0fdf4",
                      border: `1px solid ${u.is_active ? "#fecaca" : "#bbf7d0"}`,
                      color: u.is_active ? "#dc2626" : "#166534",
                      cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                    }}
                  >
                    {u.is_active ? "🚫 Désactiver" : "✅ Activer"}
                  </button>
                </div>
              </div>
            ))}
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
              backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            padding: "1.5rem",
            width: "360px",
            zIndex: 50,
          }}>

            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "1.25rem",
            }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#2E5E3E" }}>
                ➕ Nouvel utilisateur
              </h2>
              <button
                onClick={() => setShowAjout(false)}
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerUtilisateur}>

              <div style={{ marginBottom: "0.75rem" }}>
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

              <div style={{ marginBottom: "0.75rem" }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ahmed@gmail.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
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

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Rôle</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[
                    { value: "viewer",  label: "👁️ Viewer"  },
                    { value: "manager", label: "⚙️ Manager" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewRole(value)}
                      style={{
                        flex: 1, padding: "0.5rem",
                        borderRadius: "0.4rem",
                        border: `2px solid ${newRole === value ? "#2E5E3E" : "#e5e7eb"}`,
                        backgroundColor: newRole === value ? "#2E5E3E" : "white",
                        color: newRole === value ? "white" : "#374151",
                        cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAjout(false)}
                  style={{
                    flex: 1, padding: "0.6rem", borderRadius: "0.4rem",
                    backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
                    cursor: "pointer", fontSize: "0.82rem",
                    color: "#374151", fontWeight: 600,
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    flex: 2, padding: "0.6rem", borderRadius: "0.4rem",
                    backgroundColor: isCreating ? "#9ca3af" : "#2E5E3E",
                    border: "none", color: "white",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    fontSize: "0.82rem", fontWeight: 600,
                  }}
                >
                  {isCreating ? "Création..." : "✅ Créer"}
                </button>
              </div>

            </form>
          </div>
        </>
      )}

    </div>
  );
}