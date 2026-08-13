import { useState, useRef } from "react";
import { Upload, X, FileUp, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { importPalms } from "../../api/palms";
import { theme } from "../../styles/theme";
import Button from "../ui/Button";

export default function PalmImport({ onSuccess, onCancel }) {
  const [fichier, setFichier]         = useState(null);
  const [progression, setProgression] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [resultat, setResultat]       = useState(null);
  const [error, setError]             = useState(null);
  const inputRef                      = useRef(null);

  function handleFichierChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".zip") && !ext.endsWith(".geojson")) {
      setError("Format non supporté. Utilisez un .zip ou .geojson");
      return;
    }
    setError(null);
    setResultat(null);
    setProgression(0);
    setFichier(file);
  }

  async function handleUpload() {
    if (!fichier) return;
    setIsUploading(true);
    setError(null);
    setResultat(null);

    try {
      const data = await importPalms(fichier, (p) => setProgression(p));
      setResultat(data);
      if (data.created > 0 || data.updated > 0) {
        setTimeout(() => onSuccess?.(), 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Erreur lors de l'import."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <h2 style={{
          display: "flex", alignItems: "center", gap: 6,
          fontWeight: 700, color: theme.colors.text, fontSize: theme.font.size.base,
        }}>
          <Upload size={16} color={theme.colors.primary} /> Importer des palmiers
        </h2>
        <button onClick={onCancel} style={closeButtonStyle}>
          <X size={18} />
        </button>
      </div>

      {/* Info */}
      <div style={infoBoxStyle}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Structure attendue :</strong><br />
          Champs : id, parcelle, ligne, num, code_local,
          variete, sexe, etat_sante, date, code_uni<br />
          SRID : EPSG:26192 (reprojection automatique → 4326)<br />
          Si un palmier existe déjà (même code_uni) → mis à jour
        </span>
      </div>

      {/* Zone drop */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${fichier ? theme.colors.primary : theme.colors.borderStrong}`,
          borderRadius: theme.radius.lg, padding: 24,
          textAlign: "center", cursor: "pointer",
          backgroundColor: fichier ? theme.colors.primaryLight : theme.colors.bg,
          marginBottom: 16,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.geojson,.json"
          onChange={handleFichierChange}
          style={{ display: "none" }}
        />
        {fichier ? (
          <div>
            <CheckCircle2 size={24} color={theme.colors.success} style={{ marginBottom: 6 }} />
            <p style={{ fontSize: theme.font.size.sm, fontWeight: 600, color: theme.colors.text }}>
              {fichier.name}
            </p>
            <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginTop: 2 }}>
              {(fichier.size / 1024).toFixed(1)} Ko
            </p>
          </div>
        ) : (
          <div>
            <FileUp size={24} color={theme.colors.textMuted} style={{ marginBottom: 6 }} />
            <p style={{ fontSize: theme.font.size.sm, color: theme.colors.textSecondary }}>
              Cliquez pour sélectionner le fichier
            </p>
          </div>
        )}
      </div>

      {/* Progression */}
      {isUploading && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: theme.font.size.xs, color: theme.colors.textSecondary, marginBottom: 4,
          }}>
            <span>Import en cours...</span>
            <span>{progression}%</span>
          </div>
          <div style={{
            height: 6, backgroundColor: theme.colors.border,
            borderRadius: 3, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", backgroundColor: theme.colors.primary,
              width: `${progression}%`, transition: "width 0.3s ease",
              borderRadius: 3,
            }} />
          </div>
        </div>
      )}

      {/* Résultat */}
      {resultat && (
        <div style={successBoxStyle}>
          <p style={{
            display: "flex", alignItems: "center", gap: 6,
            fontWeight: 700, color: theme.colors.success, marginBottom: 4,
          }}>
            <CheckCircle2 size={14} /> Import terminé
          </p>
          <p style={{ color: theme.colors.success, fontSize: theme.font.size.sm }}>
            {resultat.created} créé(s) · {resultat.updated} mis à jour
            · sur {resultat.total_features} total
          </p>
          {resultat.errors?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{
                display: "flex", alignItems: "center", gap: 4,
                color: theme.colors.danger, fontWeight: 600, fontSize: theme.font.size.xs,
              }}>
                <AlertTriangle size={12} /> {resultat.errors.length} erreur(s)
              </p>
              {resultat.errors.slice(0, 3).map((e, i) => (
                <p key={i} style={{ color: theme.colors.danger, fontSize: theme.font.size.xs }}>
                  • {e}
                </p>
              ))}
            </div>
          )}
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
        <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
          Annuler
        </Button>
        <Button
          variant="primary"
          icon={Upload}
          onClick={handleUpload}
          disabled={!fichier || isUploading}
          style={{ flex: 2 }}
        >
          {isUploading ? `Import... ${progression}%` : "Importer"}
        </Button>
      </div>
    </div>
  );
}

const closeButtonStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "none",
  cursor: "pointer", color: theme.colors.textMuted,
  width: 28, height: 28,
};

const infoBoxStyle = {
  display: "flex", alignItems: "flex-start", gap: 8,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md, padding: "10px 12px",
  marginBottom: 16, fontSize: theme.font.size.xs, color: theme.colors.textSecondary,
  lineHeight: 1.6,
};

const successBoxStyle = {
  border: `1px solid ${theme.colors.border}`,
  borderLeft: `3px solid ${theme.colors.success}`,
  backgroundColor: "#F0FDF4",
  borderRadius: theme.radius.sm, padding: 12,
  marginBottom: 16,
};

const errorBoxStyle = {
  display: "flex", alignItems: "flex-start", gap: 6,
  borderLeft: `3px solid ${theme.colors.danger}`,
  backgroundColor: "#FEF2F2",
  borderRadius: theme.radius.sm,
  padding: "8px 10px",
  marginBottom: 16, fontSize: theme.font.size.xs, color: theme.colors.danger,
};
