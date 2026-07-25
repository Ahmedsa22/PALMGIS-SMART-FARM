import { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import MapContainer from "../components/map/MapContainer";
import useMapStore from "../store/mapStore";
import useAuthStore from "../store/authStore";
import InterventionForm from "../components/interventions/InterventionForm";
import InterventionList from "../components/interventions/InterventionList";
import ParcelleImport from "../components/parcelles/ParcelleImport";


export default function MapPage() {
  const sidebarOuverte = useMapStore((state) => state.sidebarOuverte);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
    }}>

      <Navbar />

      <div style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}>

        {/* Sidebar */}
        <aside style={{
          width: sidebarOuverte ? "320px" : "0px",
          minWidth: sidebarOuverte ? "320px" : "0px",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 300ms ease, min-width 300ms ease",
          backgroundColor: "white",
          borderRight: "1px solid #e5e7eb",
          overflowY: "auto",
        }}>
          <SidebarContent />
        </aside>

        {/* Zone carte — prend tout l'espace restant */}
        <main style={{
          flex: 1,
          position: "relative",
          minHeight: 0,
          minWidth: 0,
        }}>
          <MapContainer />
        </main>

      </div>
    </div>
  );
}

function SidebarContent() {
  const parcelleSelectionnee = useMapStore(
    (state) => state.parcelleSelectionnee
  );
  const palmSelectionne = useMapStore(
    (state) => state.palmSelectionne
  );
  const user = useAuthStore((state) => state.user);

  const [showForm, setShowForm] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false); 
  const [showImport, setShowImport] = useState(false);


  // Reset formulaire quand on change de sélection
  useEffect(() => {
    setShowForm(false);
    setShowHistorique(false); 
    setShowImport(false); 
  }, [parcelleSelectionnee, palmSelectionne]);


  // ─── Import des parcelles ───
  if (showImport) {
  return (
    <ParcelleImport
      onSuccess={() => {
        setShowImport(false);
        window.location.reload(); // recharge la carte après import
      }}
      onCancel={() => setShowImport(false)}
    />
  );
}
  // ─── Formulaire d'intervention ───
  if (showForm) {
    return (
      <InterventionForm
        parcelle={parcelleSelectionnee}
        palm={palmSelectionne}
        onSuccess={() => setShowForm(false)}
        onCancel={() => setShowForm(false)}
      />
    );
  }
  
  // ─── Historique des interventions ───
  if (showHistorique) {
    return (
      <InterventionList
        parcelle={parcelleSelectionnee}
        palm={palmSelectionne}
        onClose={() => setShowHistorique(false)}
      />
    );
  }
  // ─── Vue 3 — Palmier sélectionné ───
  if (palmSelectionne) {
    const p = palmSelectionne.properties;

    const etatSante = {
      B: "✅ Bon", MO: "⚠️ Moyen",
      MA: "🔴 Mauvais", MR: "💀 Mort"
    }[p.etat_sante] || p.etat_sante;

    const etatSite = {
      ISO: "Isolé", TOF: "Touffes", V: "Vide"
    }[p.etat_site] || p.etat_site;

    const age = {
      JP: "Jeune", A: "Adulte", V: "Vieux"
    }[p.age] || p.age;

    return (
      <div style={{ padding: "1rem" }}>

        {/* En-tête */}
        <p style={{
          fontSize: "0.7rem", color: "#9ca3af",
          textTransform: "uppercase", fontWeight: 600,
          letterSpacing: "0.05em", marginBottom: "0.25rem"
        }}>
          Palmier
        </p>
        <h2 style={{
          fontSize: "1.1rem", fontWeight: "bold",
          color: "#2E5E3E", marginBottom: "1rem"
        }}>
          🌴 {p.code_uni}
        </h2>

        {/* Infos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "Code local",     value: p.code_local || "—" },
            { label: "Ligne / N°",     value: `${p.ligne} / ${p.numero}` },
            { label: "Variété",        value: p.variete || "Non renseignée" },
            { label: "Sexe",           value: p.sexe === "M" ? "Mâle" : "Femelle" },
            { label: "Âge",            value: age },
            { label: "État sanitaire", value: etatSante },
            { label: "État site",      value: etatSite },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "0.4rem 0",
              borderBottom: "1px solid #f3f4f6",
            }}>
              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {label}
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 600,
                             color: "#1f2937", textAlign: "right" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Boutons — managers seulement */}
        {user?.role === "manager" && (
          <div style={{
            display: "flex", flexDirection: "column",
            gap: "0.5rem", marginTop: "1rem"
          }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "0.6rem", borderRadius: "0.5rem",
                backgroundColor: "#2E5E3E", color: "white",
                border: "none", cursor: "pointer",
                fontSize: "0.85rem", fontWeight: 600,
              }}
            >
              ➕ Nouvelle intervention
            </button>
            <button style={{
              padding: "0.6rem", borderRadius: "0.5rem",
              backgroundColor: "#f3f4f6", color: "#374151",
              border: "1px solid #e5e7eb", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 600,
            }} onClick={() => setShowHistorique(true)} >
              📋 Historique interventions
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Vue 2 — Parcelle sélectionnée ───
  if (parcelleSelectionnee) {
    const p = parcelleSelectionnee.properties;

    const statut = {
      active:     "✅ Active",
      en_repos:   "⏸️ En repos",
      abandonnee: "❌ Abandonnée",
    }[p.statut] || p.statut;

    return (
      <div style={{ padding: "1rem" }}>

        {/* En-tête */}
        <p style={{
          fontSize: "0.7rem", color: "#9ca3af",
          textTransform: "uppercase", fontWeight: 600,
          letterSpacing: "0.05em", marginBottom: "0.25rem"
        }}>
          Parcelle
        </p>
        <h2 style={{
          fontSize: "1.1rem", fontWeight: "bold",
          color: "#2E5E3E", marginBottom: "1rem"
        }}>
          📐 {p.nom}
        </h2>

        {/* Infos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: "Statut",       value: statut },
            { label: "Superficie",   value: `${p.superficie_ha} ha` },
            { label: "Périmètre",    value: `${Math.round(p.perimetre_m)} m` },
            { label: "Propriétaire", value: p.proprietaire || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "0.4rem 0",
              borderBottom: "1px solid #f3f4f6",
            }}>
              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {label}
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 600,
                             color: "#1f2937" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Boutons — managers seulement */}
        {user?.role === "manager" && (
          <div style={{
            display: "flex", flexDirection: "column",
            gap: "0.5rem", marginTop: "1rem"
          }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "0.6rem", borderRadius: "0.5rem",
                backgroundColor: "#2E5E3E", color: "white",
                border: "none", cursor: "pointer",
                fontSize: "0.85rem", fontWeight: 600,
              }}
            >
              ➕ Nouvelle intervention
            </button>
            <button style={{
              padding: "0.6rem", borderRadius: "0.5rem",
              backgroundColor: "#f3f4f6", color: "#374151",
              border: "1px solid #e5e7eb", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 600,
            }} onClick={() => setShowHistorique(true)} >
              📋 Historique
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Vue 1 — Rien de sélectionné ───
  // ─── Vue 1 — Rien de sélectionné ───
  return (
    <div style={{ padding: "1rem" }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "0.5rem"
      }}>
        <h2 style={{
          fontWeight: "bold", color: "#374151", fontSize: "0.95rem"
        }}>
          📋 Parcelles
        </h2>
        {user?.role === "manager" && (
          <button
            onClick={() => setShowImport(true)}
            style={{
              padding: "0.3rem 0.6rem", borderRadius: "0.4rem",
              backgroundColor: "#2E5E3E", color: "white",
              border: "none", cursor: "pointer",
              fontSize: "0.75rem", fontWeight: 600,
            }}
          >
            📂 Importer
          </button>
        )}
      </div>
      <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        Cliquez sur une parcelle sur la carte pour voir ses détails.
      </p>
    </div>
  );
}