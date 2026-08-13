import { useState } from "react";
import { Search, X } from "lucide-react";
import { theme } from "../../styles/theme";

export default function MapFilters({ onFiltresChange }) {
  const [ouvert, setOuvert]         = useState(false);
  const [etatSante, setEtatSante]   = useState([]);
  const [etatSite, setEtatSite]     = useState([]);
  const [sexe, setSexe]             = useState([]);
  const [age, setAge]               = useState([]);
  const [variete, setVariete]       = useState("");

  const ETATS_SANTE = [
    { code: "B",  label: "Bon",     couleur: theme.colors.santeBon },
    { code: "MO", label: "Moyen",   couleur: theme.colors.santeMoyen },
    { code: "MA", label: "Mauvais", couleur: theme.colors.santeMauvais },
    { code: "MR", label: "Mort",    couleur: theme.colors.santeMort },
  ];

  const ETATS_SITE = [
    { code: "ISO", label: "Isolé"   },
    { code: "TOF", label: "Touffes" },
    { code: "V",   label: "Vide"    },
  ];

  const SEXES = [
    { code: "M", label: "Mâle"    },
    { code: "F", label: "Femelle" },
  ];

  const AGES = [
    { code: "JP", label: "Jeune"  },
    { code: "A",  label: "Adulte" },
    { code: "V",  label: "Vieux"  },
  ];

  function toggleValeur(liste, setListe, valeur, nomChamp) {
    const nouvelle = liste.includes(valeur)
      ? liste.filter(v => v !== valeur)
      : [...liste, valeur];

    setListe(nouvelle);

    // Construit les filtres avec la nouvelle valeur directement
    const nouveauxFiltres = {
      etatSante: nomChamp === "etatSante" ? nouvelle : etatSante,
      etatSite:  nomChamp === "etatSite"  ? nouvelle : etatSite,
      sexe:      nomChamp === "sexe"      ? nouvelle : sexe,
      age:       nomChamp === "age"       ? nouvelle : age,
      variete,
    };

    onFiltresChange?.(nouveauxFiltres);
  }

  function reset() {
    setEtatSante([]);
    setEtatSite([]);
    setSexe([]);
    setAge([]);
    setVariete("");
    onFiltresChange?.({
      etatSante: [], etatSite: [], sexe: [], age: [], variete: ""
    });
  }

  const nbFiltresActifs =
    etatSante.length + etatSite.length +
    sexe.length + age.length + (variete ? 1 : 0);

  return (
    <div style={{
      position: "absolute",
      top: 12,
      left: 12,
      zIndex: 10,
      fontFamily: theme.font.family,
    }}>

      {/* Bouton toggle */}
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${nbFiltresActifs > 0 ? theme.colors.primary : theme.colors.border}`,
          borderRadius: theme.radius.md, padding: "8px 12px",
          cursor: "pointer", fontSize: theme.font.size.sm, fontWeight: 600,
          color: nbFiltresActifs > 0 ? theme.colors.primary : theme.colors.textSecondary,
          boxShadow: theme.shadow.sm,
        }}
      >
        <Search size={14} />
        Filtres
        {nbFiltresActifs > 0 && (
          <span style={{
            backgroundColor: theme.colors.primary, color: "white",
            borderRadius: "50%", fontSize: "10px",
            minWidth: 18, height: 18,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: 700,
          }}>
            {nbFiltresActifs}
          </span>
        )}
      </button>

      {/* Panneau de filtres */}
      {ouvert && (
        <div style={{
          marginTop: 8,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.md,
          border: `1px solid ${theme.colors.border}`,
          padding: 16,
          minWidth: 240,
        }}>

          {/* En-tête */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12,
          }}>
            <p style={{
              fontSize: theme.font.size.xs, fontWeight: 700,
              color: theme.colors.textMuted, textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              Filtres palmiers
            </p>
            {nbFiltresActifs > 0 && (
              <button
                onClick={reset}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: theme.font.size.xs, color: theme.colors.danger,
                  background: "none", border: "none",
                  cursor: "pointer", fontWeight: 600,
                }}
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>

          {/* État sanitaire */}
          <Section titre="État sanitaire">
            {ETATS_SANTE.map(({ code, label, couleur }) => (
              <CheckItem
                key={code}
                label={label}
                couleur={couleur}
                actif={etatSante.includes(code)}
                onClick={() => toggleValeur(
                  etatSante, setEtatSante, code, "etatSante"
                )}
              />
            ))}
          </Section>

          {/* État site */}
          <Section titre="État du site">
            {ETATS_SITE.map(({ code, label }) => (
              <CheckItem
                key={code}
                label={label}
                actif={etatSite.includes(code)}
                onClick={() => toggleValeur(
                  etatSite, setEtatSite, code, "etatSite"
                )}
              />
            ))}
          </Section>

          {/* Sexe */}
          <Section titre="Sexe">
            {SEXES.map(({ code, label }) => (
              <CheckItem
                key={code}
                label={label}
                actif={sexe.includes(code)}
                onClick={() => toggleValeur(sexe, setSexe, code, "sexe" )}
              />
            ))}
          </Section>

          {/* Âge */}
          <Section titre="Âge">
            {AGES.map(({ code, label }) => (
              <CheckItem
                key={code}
                label={label}
                actif={age.includes(code)}
                onClick={() => toggleValeur(age, setAge, code, "age")}
              />
            ))}
          </Section>

          {/* Variété */}
          <Section titre="Variété">
            <input
              type="text"
              value={variete}
              onChange={(e) => {
                setVariete(e.target.value);
                onFiltresChange?.({
                  etatSante,
                  etatSite,
                  sexe,
                  age,
                  variete: e.target.value,  // valeur fraîche directement
                });
              }}
              placeholder="Ex: NJD, SAIR, BSTN..."
              style={{
                width: "100%", padding: "8px 10px",
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.borderStrong}`,
                fontSize: theme.font.size.sm,
                boxSizing: "border-box",
                outline: "none",
                fontFamily: theme.font.family,
              }}
            />
          </Section>

        </div>
      )}
    </div>
  );
}

function Section({ titre, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        fontSize: "10px", fontWeight: 700,
        color: theme.colors.textMuted, textTransform: "uppercase",
        letterSpacing: "0.6px", marginBottom: 6,
      }}>
        {titre}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function CheckItem({ label, couleur, actif, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: theme.radius.lg,
        border: `1px solid ${actif ? (couleur || theme.colors.primary) : theme.colors.border}`,
        backgroundColor: actif ? (couleur || theme.colors.primary) : theme.colors.surface,
        color: actif ? "white" : theme.colors.textSecondary,
        cursor: "pointer", fontSize: theme.font.size.xs, fontWeight: 600,
      }}
    >
      {couleur && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          backgroundColor: actif ? "white" : couleur,
          flexShrink: 0,
        }} />
      )}
      {label}
    </button>
  );
}
