import { useState, useRef } from "react";
import { importParcelles } from "../../api/parcelles";

export default function ParcelleImport({ onSuccess, onCancel }) {
  const [fichier, setFichier]           = useState(null);
  const [progression, setProgression]   = useState(0);
  const [isUploading, setIsUploading]   = useState(false);
  const [resultat, setResultat]         = useState(null);
  const [error, setError]               = useState(null);
  const inputRef                        = useRef(null);

  function handleFichierChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifie le format
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".zip") && !ext.endsWith(".geojson") && !ext.endsWith(".json")) {
      setError("Format non supporté. Utilisez un .zip (Shapefile) ou .geojson");
      setFichier(null);
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
    setProgression(0);

    try {
      const data = await importParcelles(fichier, (percent) => {
        setProgression(percent);
      });

      setResultat(data);

      // Recharge les parcelles après 2s si succès
      if (data.created > 0) {
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
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

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFichierChange(fakeEvent);
    }
  }

  return (
    <div style={{ padding: "1rem" }}>

      {/* En-tête */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1rem"
      }}>
        <h2 style={{ fontWeight: "bold", color: "#2E5E3E", fontSize: "0.95rem" }}>
          📂 Importer des parcelles
        </h2>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "none",
            cursor: "pointer", fontSize: "1.2rem", color: "#9ca3af"
          }}
        >
          ✕
        </button>
      </div>

      {/* Info format */}
      <div style={{
        backgroundColor: "#eff6ff", border: "1px solid #bfdbfe",
        borderRadius: "0.5rem", padding: "0.6rem 0.75rem",
        marginBottom: "1rem", fontSize: "0.78rem", color: "#1e40af"
      }}>
        <strong>Formats acceptés :</strong><br />
        • <strong>.zip</strong> contenant .shp + .shx + .dbf + .prj<br />
        • <strong>.geojson</strong> en WGS84 (EPSG:4326)<br />
        • Shapefile en <strong>EPSG:26192</strong> → reprojection automatique
      </div>

      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${fichier ? "#2E5E3E" : "#d1d5db"}`,
          borderRadius: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: fichier ? "#f0fdf4" : "#f9fafb",
          transition: "all 0.2s",
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
            <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "0.4rem" }}>
              Cliquez pour changer de fichier
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>📁</div>
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Glissez votre fichier ici
            </p>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.2rem" }}>
              ou cliquez pour parcourir
            </p>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {isUploading && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.3rem"
          }}>
            <span>Upload en cours...</span>
            <span>{progression}%</span>
          </div>
          <div style={{
            height: "6px", backgroundColor: "#e5e7eb",
            borderRadius: "3px", overflow: "hidden"
          }}>
            <div style={{
              height: "100%", backgroundColor: "#2E5E3E",
              width: `${progression}%`,
              transition: "width 0.3s ease",
              borderRadius: "3px",
            }} />
          </div>
        </div>
      )}

      {/* Résultat succès */}
      {resultat && (
        <div style={{
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: "0.5rem", padding: "0.75rem",
          marginBottom: "1rem", fontSize: "0.82rem"
        }}>
          <p style={{ fontWeight: 700, color: "#166534", marginBottom: "0.3rem" }}>
            ✅ Import terminé
          </p>
          <p style={{ color: "#166534" }}>
            {resultat.created} parcelle(s) importée(s) sur {resultat.total_features}
          </p>
          {resultat.errors?.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <p style={{ color: "#dc2626", fontWeight: 600 }}>
                ⚠️ {resultat.errors.length} erreur(s) :
              </p>
              {resultat.errors.slice(0, 3).map((e, i) => (
                <p key={i} style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                  • {e}
                </p>
              ))}
              {resultat.errors.length > 3 && (
                <p style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                  ... et {resultat.errors.length - 3} autre(s)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "0.5rem", padding: "0.6rem 0.75rem",
          marginBottom: "1rem", fontSize: "0.8rem", color: "#dc2626"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Boutons */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: "0.6rem",
            borderRadius: "0.4rem",
            backgroundColor: "#f3f4f6",
            border: "1px solid #e5e7eb",
            cursor: "pointer", fontSize: "0.85rem",
            color: "#374151", fontWeight: 600,
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleUpload}
          disabled={!fichier || isUploading}
          style={{
            flex: 2, padding: "0.6rem",
            borderRadius: "0.4rem",
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