import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Pencil, Plus, History, FileDown, Satellite,
  Trash2, LandPlot, TreePalm,
} from "lucide-react";
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
import CarteForm from "../components/reports/CarteForm";
import RemoteSensingPanel from "../components/remotesensing/RemoteSensingPanel";
import { deleteParcelle } from "../api/parcelles";
import { deletePalm }     from "../api/palms";
import { theme } from "../styles/theme";
import Button from "../components/ui/Button";
import { SectionTitle, AttributeRow, TypeBadge } from "../components/ui/Badge";

export default function MapPage() {
  const sidebarOuverte = useMapStore((state) => state.sidebarOuverte);
  const [legendeVisible, setLegendeVisible] = useState(true);


  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      fontFamily: theme.font.family,
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
          backgroundColor: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`,
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

          {/* Bouton flottant pour toggle légende */}
          <button
            onClick={() => setLegendeVisible(!legendeVisible)}
            style={{
              position: "absolute",
              bottom: "2rem",
              right: legendeVisible ? "185px" : "0.75rem",
              display: "flex", alignItems: "center", gap: 4,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding: "6px 8px",
              cursor: "pointer",
              zIndex: 11,
              fontSize: theme.font.size.xs,
              fontWeight: 600,
              color: theme.colors.textSecondary,
              boxShadow: theme.shadow.sm,
              transition: "right 0.3s ease",
            }}
          >
            {legendeVisible ? <><ChevronLeft size={14} /> Légende</> : <ChevronRight size={14} />}
          </button>
          <MapLegend visible={legendeVisible} />
        </main>

      </div>
    </div>
  );
}

const STATUT_LABELS = {
  active:     "Active",
  en_repos:   "En repos",
  abandonnee: "Abandonnée",
};
const STATUT_COLORS = {
  active:     theme.colors.success,
  en_repos:   theme.colors.warning,
  abandonnee: theme.colors.textMuted,
};

const SANTE_LABELS = { B: "Bon", MO: "Moyen", MA: "Mauvais", MR: "Mort" };
const SANTE_COLORS = {
  B:  theme.colors.santeBon,
  MO: theme.colors.santeMoyen,
  MA: theme.colors.santeMauvais,
  MR: theme.colors.santeMort,
};

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        background: "none", border: "none",
        cursor: "pointer", fontSize: theme.font.size.xs,
        color: theme.colors.textSecondary, marginBottom: 12,
        padding: "4px 0", fontWeight: 600,
      }}
    >
      <ChevronLeft size={14} /> Retour aux parcelles
    </button>
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
  const [showCarteForm, setShowCarteForm] = useState(false);
  const [showRemoteSensing, setShowRemoteSensing] = useState(false);



  // Reset formulaire quand on change de sélection
  useEffect(() => {
    setShowForm(false);
    setShowHistorique(false);
    setShowImport(false);
    setShowEditParcelle(false);
    setShowEditPalm(false);
    setShowImportPalms(false);
    setShowCarteForm(false);
    setShowRemoteSensing(false);


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





 if (showCarteForm) {
    return (
      <CarteForm
        parcelle={parcelleSelectionnee}
        onCancel={() => setShowCarteForm(false)}
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

  // ─── Vue 4 — Remote Sensing ───

  if (showRemoteSensing) {
  return (
    <RemoteSensingPanel
      parcelle={parcelleSelectionnee}
      onCancel={() => setShowRemoteSensing(false)}
    />
  );
}
  // ─── Vue 3 — Palmier sélectionné ───
  if (palmSelectionne) {
    const p = palmSelectionne.properties;

    const etatSante = SANTE_LABELS[p.etat_sante] || p.etat_sante;

    const etatSite = {
      ISO: "Isolé", TOF: "Touffes", V: "Vide"
    }[p.etat_site] || p.etat_site;

    const age = {
      JP: "Jeune", A: "Adulte", V: "Vieux"
    }[p.age] || p.age;

    return (
      <div style={{ padding: 16 }}>

        <BackButton onClick={() => useMapStore.getState().reinitialiserSelection()} />

        {/* En-tête */}
        <SectionTitle style={{ marginBottom: 4 }}>Palmier</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <h2 style={{
            fontSize: theme.font.size.lg, fontWeight: 700,
            color: theme.colors.text, display: "flex", alignItems: "center", gap: 6,
          }}>
            <TreePalm size={16} color={theme.colors.primary} /> {p.code_uni}
          </h2>
          <TypeBadge label={etatSante} color={SANTE_COLORS[p.etat_sante] || theme.colors.textMuted} />
        </div>

        {/* Infos */}
        <div style={{ display: "flex", flexDirection: "column" }}>
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
            <AttributeRow key={label} label={label} value={value} />
          ))}
        </div>

        {/* Boutons — managers seulement */}
        {user?.role === "manager" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            <Button variant="secondary" icon={Pencil} onClick={() => setShowEditPalm(true)}>
              Modifier le palmier
            </Button>

            <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
              Nouvelle intervention
            </Button>

            <Button variant="secondary" icon={History} onClick={() => setShowHistorique(true)}>
              Historique interventions
            </Button>

            <Button
              variant="danger"
              icon={Trash2}
              onClick={async () => {
                const code = palmSelectionne.properties?.code_uni || "ce palmier";
                if (!window.confirm(`Supprimer le palmier "${code}" ?`)) return;
                try {
                  await deletePalm(palmSelectionne.properties?.id || palmSelectionne.id);
                  useMapStore.getState().selectionnerParcelle(parcelleSelectionnee);
                  window.location.reload();
                } catch (err) {
                  alert("Erreur lors de la suppression.");
                }
              }}
            >
              Supprimer le palmier
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── Vue 2 — Parcelle sélectionnée ───
  if (parcelleSelectionnee) {
    const p = parcelleSelectionnee.properties;

    const statutLabel = STATUT_LABELS[p.statut] || p.statut;

    return (
      <div style={{ padding: 16 }}>

        <BackButton onClick={() => useMapStore.getState().reinitialiserSelection()} />

        {/* En-tête */}
        <SectionTitle style={{ marginBottom: 4 }}>Parcelle</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <h2 style={{
            fontSize: theme.font.size.lg, fontWeight: 700,
            color: theme.colors.text, display: "flex", alignItems: "center", gap: 6,
          }}>
            <LandPlot size={16} color={theme.colors.primary} /> {p.nom}
          </h2>
          <TypeBadge label={statutLabel} color={STATUT_COLORS[p.statut] || theme.colors.textMuted} />
        </div>

        {/* Infos */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { label: "Statut",       value: statutLabel },
            { label: "Superficie",   value: `${p.superficie_ha} ha` },
            { label: "Périmètre",    value: `${Math.round(p.perimetre_m)} m` },
            { label: "Propriétaire", value: p.proprietaire || "—" },
          ].map(({ label, value }) => (
            <AttributeRow key={label} label={label} value={value} />
          ))}
        </div>

        {/* Boutons — managers seulement */}
        {user?.role === "manager" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            <Button variant="secondary" icon={Pencil} onClick={() => setShowEditParcelle(true)}>
              Modifier la parcelle
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
              Nouvelle intervention
            </Button>
            <Button variant="secondary" icon={History} onClick={() => setShowHistorique(true)}>
              Historique
            </Button>
            <Button variant="secondary" icon={FileDown} onClick={() => setShowCarteForm(true)}>
              Générer carte PDF
            </Button>
            <Button variant="secondary" icon={Satellite} onClick={() => setShowRemoteSensing(true)}>
              Indices spectraux
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={async () => {
                const parcelleId = p.id || parcelleSelectionnee?.id;
                if (!window.confirm(`Supprimer la parcelle "${p.nom}" et tous ses palmiers ?`)) return;
                try {
                  await deleteParcelle(parcelleId);
                  useMapStore.getState().reinitialiserSelection();
                  window.location.reload();
                } catch (err) {
                  alert("Erreur lors de la suppression.");
                  console.log(err)
                }
              }}
            >
              Supprimer la parcelle
            </Button>
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
