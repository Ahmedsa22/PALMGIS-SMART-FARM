import { useState } from "react";
import { TreePalm, X, AlertTriangle, Info } from "lucide-react";
import { updatePalm } from "../../api/palms";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";
import { SectionTitle } from "../ui/Badge";

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
        age:        etatSite === "V" ? null : age,
        sexe:       etatSite === "V" ? null : sexe,
        etat_sante: etatSante,
        etat_site:  etatSite,
        ligne,
        numero,
        code_local: codeLocal,
        description,
        nombre_rejets: etatSite === "TOF" && nombreRejets !== ""
          ? parseInt(nombreRejets) : null,
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

  const [nombreRejets, setNombreRejets] = useState(
  p.nombre_rejets ?? ""
  );

  return (
    <div style={{ padding: 16 }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <div>
          <SectionTitle style={{ marginBottom: 4 }}>Modifier</SectionTitle>
          <h2 style={{
            fontSize: theme.font.size.base, fontWeight: 700, color: theme.colors.text,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <TreePalm size={16} color={theme.colors.primary} /> {p.code_uni}
          </h2>
        </div>
        <button onClick={onCancel} style={closeButtonStyle}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}
        style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}
      >

        {/* État sanitaire + État site */}
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>État sanitaire</label>
            <select value={etatSante} onChange={(e) => setEtatSante(e.target.value)} style={inputStyle}>
              <option value="B">Bon</option>
              <option value="MO">Moyen</option>
              <option value="MA">Mauvais</option>
              <option value="MR">Mort</option>
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


        {/* Sexe + Âge — cachés si site vide */}
        {etatSite !== "V" ? (
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Sexe</label>
              <select
                value={sexe}
                onChange={e => setSexe(e.target.value)}
                style={inputStyle}
              >
                <option value="M">Mâle</option>
                <option value="F">Femelle</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Âge</label>
              <select
                value={age}
                onChange={e => setAge(e.target.value)}
                style={inputStyle}
              >
                <option value="JP">Jeune</option>
                <option value="A">Adulte</option>
                <option value="V">Vieux</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={infoBoxStyle}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            Site vide — sexe et âge non applicables
          </div>
        )}

        {/* Variété */}
        <div style={{ marginBottom: 12 }}>
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
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Code local</label>
          <input
            type="text"
            value={codeLocal}
            onChange={(e) => setCodeLocal(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
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
        <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>
            Nombre de rejets
            <span style={{
                fontSize: "10px", color: theme.colors.textMuted,
                fontWeight: 400, marginLeft: 6,
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
          <div style={errorBoxStyle}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="button" variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} style={{ flex: 2 }}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

      </form>
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

const rowStyle = {
  display: "grid", gridTemplateColumns: "1fr 1fr",
  gap: 8, marginBottom: 12,
};

const closeButtonStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "none",
  cursor: "pointer", color: theme.colors.textMuted,
  width: 28, height: 28,
};

const infoBoxStyle = {
  display: "flex", alignItems: "flex-start", gap: 6,
  backgroundColor: theme.colors.bg,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.sm,
  padding: "8px 10px",
  fontSize: theme.font.size.xs,
  color: theme.colors.textSecondary,
  marginBottom: 12,
};

const errorBoxStyle = {
  display: "flex", alignItems: "flex-start", gap: 6,
  borderLeft: `3px solid ${theme.colors.danger}`,
  backgroundColor: "#FEF2F2",
  borderRadius: theme.radius.sm,
  padding: "8px 10px",
  marginBottom: 12, fontSize: theme.font.size.xs, color: theme.colors.danger,
};
