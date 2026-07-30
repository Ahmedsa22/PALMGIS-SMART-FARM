import { useState, useRef } from "react";
import { importPalms } from "../../api/palms";

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
    <div style={{ padding: "1rem" }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem",
      }}>
        <h2 style={{ fontWeight: "bold", color: "#2E5E3E", fontSize: "0.95rem" }}>
          🌴 Importer des palmiers
        </h2>
        <button onClick={onCancel} style={{
          background: "none", border: "none",
          cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af",
        }}>✕</button>
      </div>

      {/* Info */}
      <div style={{
        backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: "0.5rem", padding: "0.6rem 0.75rem",
        marginBottom: "1rem", fontSize: "0.78rem", color: "#166534",
      }}>
        <strong>Structure attendue :</strong><br />
        Champs : id, parcelle, ligne, num, code_local,
        variete, sexe, etat_sante, date, code_uni<br />
        SRID : EPSG:26192 (reprojection automatique → 4326)<br />
        ⚡ Si un palmier existe déjà (même code_uni) → mis à jour
      </div>

      {/* Zone drop */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${fichier ? "#2E5E3E" : "#d1d5db"}`,
          borderRadius: "0.75rem", padding: "1.5rem",
          textAlign: "center", cursor: "pointer",
          backgroundColor: fichier ? "#f0fdf4" : "#f9fafb",
          marginBottom: "1rem",
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
            <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>✅</div>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2E5E3E" }}>
              {fichier.name}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem" }}>
              {(fichier.size / 1024).toFixed(1)} Ko
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>📁</div>
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Cliquez pour sélectionner le fichier
            </p>
          </div>
        )}
      </div>

      {/* Progression */}
      {isUploading && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.3rem",
          }}>
            <span>Import en cours...</span>
            <span>{progression}%</span>
          </div>
          <div style={{
            height: "6px", backgroundColor: "#e5e7eb",
            borderRadius: "3px", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", backgroundColor: "#2E5E3E",
              width: `${progression}%`, transition: "width 0.3s ease",
              borderRadius: "3px",
            }} />
          </div>
        </div>
      )}

      {/* Résultat */}
      {resultat && (
        <div style={{
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: "0.5rem", padding: "0.75rem",
          marginBottom: "1rem", fontSize: "0.82rem",
        }}>
          <p style={{ fontWeight: 700, color: "#166534", marginBottom: "0.3rem" }}>
            ✅ Import terminé
          </p>
          <p style={{ color: "#166534" }}>
            {resultat.created} créé(s) · {resultat.updated} mis à jour
            · sur {resultat.total_features} total
          </p>
          {resultat.errors?.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <p style={{ color: "#dc2626", fontWeight: 600 }}>
                ⚠️ {resultat.errors.length} erreur(s)
              </p>
              {resultat.errors.slice(0, 3).map((e, i) => (
                <p key={i} style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                  • {e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "0.5rem", padding: "0.6rem",
          marginBottom: "1rem", fontSize: "0.8rem", color: "#dc2626",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Boutons */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "0.6rem", borderRadius: "0.4rem",
          backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
          cursor: "pointer", fontSize: "0.85rem",
          color: "#374151", fontWeight: 600,
        }}>
          Annuler
        </button>
        <button
          onClick={handleUpload}
          disabled={!fichier || isUploading}
          style={{
            flex: 2, padding: "0.6rem", borderRadius: "0.4rem",
            backgroundColor: !fichier || isUploading ? "#9ca3af" : "#2E5E3E",
            border: "none",
            cursor: !fichier || isUploading ? "not-allowed" : "pointer",
            fontSize: "0.85rem", color: "white", fontWeight: 600,
          }}
        >
          {isUploading ? `Import... ${progression}%` : "📤 Importer"}
        </button>
      </div>
    </div>
  );
}