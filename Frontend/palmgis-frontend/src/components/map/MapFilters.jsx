import { useState } from "react";

export default function MapFilters({ onFiltresChange }) {
  const [ouvert, setOuvert]         = useState(false);
  const [etatSante, setEtatSante]   = useState([]);
  const [etatSite, setEtatSite]     = useState([]);
  const [sexe, setSexe]             = useState([]);
  const [age, setAge]               = useState([]);
  const [variete, setVariete]       = useState("");

  const ETATS_SANTE = [
    { code: "B",  label: "Bon",     couleur: "#22c55e" },
    { code: "MO", label: "Moyen",   couleur: "#f97316" },
    { code: "MA", label: "Mauvais", couleur: "#ef4444" },
    { code: "MR", label: "Mort",    couleur: "#1f2937" },
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

    // ✅ Construit les filtres avec la nouvelle valeur directement
    const nouveauxFiltres = {
      etatSante: nomChamp === "etatSante" ? nouvelle : etatSante,
      etatSite:  nomChamp === "etatSite"  ? nouvelle : etatSite,
      sexe:      nomChamp === "sexe"      ? nouvelle : sexe,
      age:       nomChamp === "age"       ? nouvelle : age,
      variete,
    };

    onFiltresChange?.(nouveauxFiltres);
  }

  function appliquer(filtres) {
    onFiltresChange?.(filtres);
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
      top: "0.75rem",
      left: "0.75rem",
      zIndex: 10,
    }}>

      {/* Bouton toggle */}
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          backgroundColor: "white",
          border: `2px solid ${nbFiltresActifs > 0 ? "#2E5E3E" : "#e5e7eb"}`,
          borderRadius: "0.6rem", padding: "0.5rem 0.75rem",
          cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
          color: nbFiltresActifs > 0 ? "#2E5E3E" : "#374151",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        🔍 Filtres
        {nbFiltresActifs > 0 && (
          <span style={{
            backgroundColor: "#2E5E3E", color: "white",
            borderRadius: "50%", fontSize: "0.65rem",
            minWidth: "18px", height: "18px",
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
          marginTop: "0.5rem",
          backgroundColor: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          border: "1px solid #e5e7eb",
          padding: "1rem",
          minWidth: "240px",
        }}>

          {/* En-tête */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "0.75rem",
          }}>
            <p style={{
              fontSize: "0.78rem", fontWeight: 700,
              color: "#2E5E3E", textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Filtres palmiers
            </p>
            {nbFiltresActifs > 0 && (
              <button
                onClick={reset}
                style={{
                  fontSize: "0.72rem", color: "#ef4444",
                  background: "none", border: "none",
                  cursor: "pointer", fontWeight: 600,
                }}
              >
                ✕ Réinitialiser
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
                  variete: e.target.value,  // ← valeur fraîche directement
                });
              }}
              placeholder="Ex: NJD, SAIR, BSTN..."
              style={{
                width: "100%", padding: "0.4rem 0.6rem",
                borderRadius: "0.4rem",
                border: "1px solid #d1d5db",
                fontSize: "0.8rem",
                boxSizing: "border-box",
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
    <div style={{ marginBottom: "0.75rem" }}>
      <p style={{
        fontSize: "0.7rem", fontWeight: 700,
        color: "#6b7280", textTransform: "uppercase",
        letterSpacing: "0.04em", marginBottom: "0.4rem",
      }}>
        {titre}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
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
        display: "flex", alignItems: "center", gap: "0.3rem",
        padding: "0.25rem 0.6rem", borderRadius: "1rem",
        border: `1px solid ${actif ? (couleur || "#2E5E3E") : "#e5e7eb"}`,
        backgroundColor: actif ? (couleur || "#2E5E3E") : "white",
        color: actif ? "white" : "#374151",
        cursor: "pointer", fontSize: "0.78rem", fontWeight: 500,
        transition: "all 0.15s",
      }}
    >
      {couleur && (
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          backgroundColor: actif ? "white" : couleur,
          flexShrink: 0,
        }} />
      )}
      {label}
    </button>
  );
}