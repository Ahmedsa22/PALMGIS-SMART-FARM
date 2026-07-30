import { useState } from "react";
import { updatePalm } from "../../api/palms";

export default function PalmEditForm({ palm, onSuccess, onCancel }) {
  const p = palm.properties;

  const [variete, setVariete]       = useState(p.variete || "");
  const [age, setAge]               = useState(p.age || "A");
  const [sexe, setSexe]             = useState(p.sexe || "M");
  const [etatSante, setEtatSante]   = useState(p.etat_sante || "B");
  const [etatSite, setEtatSite]     = useState(p.etat_site || "ISO");
  const [ligne, setLigne]           = useState(p.ligne || "");
  const [numero, setNumero]         = useState(p.numero || "");
  const [codeLocal, setCodeLocal]   = useState(p.code_local || "");
  const [description, setDescription] = useState(p.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updatePalm(p.id, {
        variete,
        age,
        sexe,
        etat_sante: etatSante,
        etat_site:  etatSite,
        ligne,
        numero,
        code_local: codeLocal,
        description,
        nombre_rejets: nombreRejets !== "" ? parseInt(nombreRejets) : null,

      });
      onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0] ||
        "Erreur lors de la modification."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.5rem",
    borderRadius: "0.4rem", border: "1px solid #d1d5db",
    fontSize: "0.82rem", boxSizing: "border-box",
    backgroundColor: "white",
  };

  const labelStyle = {
    display: "block", fontSize: "0.75rem",
    fontWeight: 600, color: "#374151", marginBottom: "0.2rem",
  };

  const rowStyle = {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem", marginBottom: "0.75rem",
  };

  const [nombreRejets, setNombreRejets] = useState(
  p.nombre_rejets ?? ""
  );

  return (
    <div style={{ padding: "1rem" }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem",
      }}>
        <div>
          <p style={{
            fontSize: "0.7rem", color: "#9ca3af",
            textTransform: "uppercase", fontWeight: 600,
          }}>
            Modifier
          </p>
          <h2 style={{
            fontSize: "1rem", fontWeight: "bold", color: "#2E5E3E",
          }}>
            🌴 {p.code_uni}
          </h2>
        </div>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "none",
            cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af",
          }}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}
        style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "0.25rem" }}
      >

        {/* État sanitaire + État site */}
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>État sanitaire</label>
            <select value={etatSante} onChange={(e) => setEtatSante(e.target.value)} style={inputStyle}>
              <option value="B">✅ Bon</option>
              <option value="MO">⚠️ Moyen</option>
              <option value="MA">🔴 Mauvais</option>
              <option value="MR">💀 Mort</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>État site</label>
            <select value={etatSite} onChange={(e) => setEtatSite(e.target.value)} style={inputStyle}>
              <option value="ISO">Isolé</option>
              <option value="TOF">Touffes</option>
              <option value="V">Vide</option>
            </select>
          </div>
        </div>

        {/* Sexe + Âge */}
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>Sexe</label>
            <select value={sexe} onChange={(e) => setSexe(e.target.value)} style={inputStyle}>
              <option value="M">Mâle</option>
              <option value="F">Femelle</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Âge</label>
            <select value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle}>
              <option value="JP">Jeune</option>
              <option value="A">Adulte</option>
              <option value="V">Vieux</option>
            </select>
          </div>
        </div>

        {/* Variété */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Variété</label>
          <input
            type="text"
            value={variete}
            onChange={(e) => setVariete(e.target.value)}
            placeholder="Ex: NJD, SAIR, BSTN..."
            style={inputStyle}
          />
        </div>

        {/* Ligne + Numéro */}
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>Ligne</label>
            <input
              type="text"
              value={ligne}
              onChange={(e) => setLigne(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Numéro</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Code local */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>Code local</label>
          <input
            type="text"
            value={codeLocal}
            onChange={(e) => setCodeLocal(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Observations</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notes sur ce palmier..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Nombre de rejets — uniquement pour les touffes */}
        {etatSite === "TOF" && (
        <div style={{ marginBottom: "0.75rem" }}>
            <label style={labelStyle}>
            Nombre de rejets
            <span style={{
                fontSize: "0.7rem", color: "#6b7280",
                fontWeight: 400, marginLeft: "0.4rem"
            }}>
                (touffes uniquement)
            </span>
            </label>
            <input
            type="number"
            value={nombreRejets}
            onChange={(e) => setNombreRejets(e.target.value)}
            min="0"
            max="50"
            placeholder="Ex: 3"
            style={inputStyle}
            />
        </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{
            backgroundColor: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: "0.4rem", padding: "0.5rem",
            marginBottom: "0.75rem", fontSize: "0.8rem", color: "#dc2626",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onCancel}
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
            disabled={isSubmitting}
            style={{
              flex: 2, padding: "0.6rem", borderRadius: "0.4rem",
              backgroundColor: isSubmitting ? "#9ca3af" : "#2E5E3E",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "0.82rem", color: "white", fontWeight: 600,
            }}
          >
            {isSubmitting ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </div>

      </form>
    </div>
  );
}