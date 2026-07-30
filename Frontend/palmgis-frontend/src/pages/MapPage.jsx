import { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import MapContainer from "../components/map/MapContainer";
import useMapStore from "../store/mapStore";
import useAuthStore from "../store/authStore";
import InterventionForm from "../components/interventions/InterventionForm";
import InterventionList from "../components/interventions/InterventionList";
import ParcelleImport from "../components/parcelles/ParcelleImport";
import MapLegend from "../components/map/MapLegend";
import ParcelleEditForm from "../components/parcelles/ParcelleEditForm";
import PalmEditForm from "../components/palms/PalmEditForm";
import PalmImport from "../components/palms/PalmImport";
import ParcelleList from "../components/parcelles/ParcelleList";




export default function MapPage() {
  const sidebarOuverte = useMapStore((state) => state.sidebarOuverte);
  const [legendeVisible, setLegendeVisible] = useState(true);


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

          {/* Bouton flottant pour toggle : */}
          <button
            onClick={() => setLegendeVisible(!legendeVisible)}
            style={{
              position: "absolute",
              bottom: "2rem",
              right: legendeVisible ? "185px" : "0.75rem",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "0.3rem 0.5rem",
              cursor: "pointer",
              zIndex: 11,
              fontSize: "0.75rem",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              transition: "right 0.3s ease",
            }}
          >
            {legendeVisible ? "◀ Légende" : "▶"}
          </button>
          <MapLegend visible={legendeVisible} />
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
  const [showEditParcelle, setShowEditParcelle] = useState(false);  
  const [showEditPalm, setShowEditPalm]         = useState(false); 
  const [showImportPalms, setShowImportPalms] = useState(false);


  // Reset formulaire quand on change de sélection
  useEffect(() => {
    setShowForm(false);
    setShowHistorique(false); 
    setShowImport(false); 
    setShowEditParcelle(false);  
    setShowEditPalm(false); 
    setShowImportPalms(false);

  }, [parcelleSelectionnee, palmSelectionne]);


  // ── Formulaire édition parcelle ──
  if (showEditParcelle) {
    return (
      <ParcelleEditForm
        parcelle={parcelleSelectionnee}
        onSuccess={() => {
          setShowEditParcelle(false);
          window.location.reload(); // recharge la carte
        }}
        onCancel={() => setShowEditParcelle(false)}
      />
    );
  }

  // ── Formulaire édition palmier ──
  if (showEditPalm) {
    return (
      <PalmEditForm
        palm={palmSelectionne}
        onSuccess={() => {
          setShowEditPalm(false);
          window.location.reload(); // recharge la carte
        }}
        onCancel={() => setShowEditPalm(false)}
      />
    );
  }

  //
  if (showImportPalms) {
  return (
    <PalmImport
      onSuccess={() => {
        setShowImportPalms(false);
        window.location.reload();
      }}
      onCancel={() => setShowImportPalms(false)}
    />
  );
}

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
        

        <button
          onClick={() => {
            useMapStore.getState().reinitialiserSelection();
          }}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            background: "none", border: "none",
            cursor: "pointer", fontSize: "0.78rem",
            color: "#6b7280", marginBottom: "0.75rem",
            padding: "0.25rem 0",
          }}
        >
          ← Retour aux parcelles
      </button>

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
            ...(p.etat_site === "TOF"
              ? [{ label: "Nombre de rejets", value: p.nombre_rejets ?? "Non renseigné" }]
              : []
            ),
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
            <button onClick={() => setShowEditPalm(true)} style={{
              padding: "0.6rem", borderRadius: "0.5rem",
              backgroundColor: "#f0fdf4", color: "#2E5E3E",
              border: "1px solid #bbf7d0", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 600,
            }}>
              ✏️ Modifier le palmier
            </button>

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
        

        <button
          onClick={() => {
            useMapStore.getState().reinitialiserSelection();
          }}
          style={{
            display: "flex", alignItems: "center", gap: "0.3rem",
            background: "none", border: "none",
            cursor: "pointer", fontSize: "0.78rem",
            color: "#6b7280", marginBottom: "0.75rem",
            padding: "0.25rem 0",
          }}
        >
          ← Retour aux parcelles
      </button>
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
            <button onClick={() => setShowEditParcelle(true)} style={{
              padding: "0.6rem", borderRadius: "0.5rem",
              backgroundColor: "#f0fdf4", color: "#2E5E3E",
              border: "1px solid #bbf7d0", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 600,
            }}>
              ✏️ Modifier la parcelle
            </button>
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
return (
   <ParcelleList
    onShowImport={() => setShowImport(true)}
    onShowImportPalms={() => setShowImportPalms(true)}
  />
);
}