import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getParcelles } from "../api/parcelles";
import { getPalms } from "../api/palms";
import { getInterventions } from "../api/interventions";
import { getNotifications } from "../api/notifications";
import Navbar from "../components/layout/Navbar";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      setIsLoading(true);
      try {
        const [parcelles, palms, interventions, notifications] =
          await Promise.all([
            getParcelles(),
            getPalms(),
            getInterventions(),
            getNotifications({ statut: "en_attente" }),
          ]);

        // Palmiers par état sanitaire
        const features = palms.features || [];
        const parEtat = {
          B:  features.filter(f => f.properties.etat_sante === "B").length,
          MO: features.filter(f => f.properties.etat_sante === "MO").length,
          MA: features.filter(f => f.properties.etat_sante === "MA").length,
          MR: features.filter(f => f.properties.etat_sante === "MR").length,
        };

        // Palmiers par sexe
        const males   = features.filter(f => f.properties.sexe === "M").length;
        const femelles = features.filter(f => f.properties.sexe === "F").length;

        // Palmiers par âge
        const parAge = {
          JP: features.filter(f => f.properties.age === "JP").length,
          A:  features.filter(f => f.properties.age === "A").length,
          V:  features.filter(f => f.properties.age === "V").length,
        };

        // Interventions par type (10 dernières)
        const listeInterventions = Array.isArray(interventions.results)
          ? interventions.results
          : [];

        // Superficie totale
        const parcelleFeats = parcelles.features || [];
        const superficieTotale = parcelleFeats.reduce((acc, f) => {
          return acc + (parseFloat(f.properties.superficie_ha) || 0);
        }, 0);

        setStats({
          nbParcelles:       parcelleFeats.length,
          nbPalms:           features.length,
          superficieTotale:  superficieTotale.toFixed(2),
          nbNotifications:   notifications.count || 0,
          nbInterventions:   interventions.count || 0,
          parEtat,
          parAge,
          males,
          femelles,
          dernieresInterventions: listeInterventions.slice(0, 5),
        });

      } catch (err) {
        console.error("Erreur dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    charger();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-MA", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", backgroundColor: "#f9fafb",
      overflow: "hidden",
    }}>
      <Navbar />

      {/* En-tête */}
      <div style={{
        backgroundColor: "white", padding: "1rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexShrink: 0,
      }}>
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2E5E3E" }}>
          📊 Tableau de bord
        </h1>
        <button
          onClick={() => navigate("/map")}
          style={{
            padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
            backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
            cursor: "pointer", fontSize: "0.8rem", color: "#374151",
          }}
        >
          ← Carte
        </button>
      </div>

      {/* Contenu scrollable */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "1.5rem", minHeight: 0,
      }}>

        {isLoading ? (
          <p style={{
            textAlign: "center", color: "#9ca3af",
            padding: "3rem", fontSize: "0.9rem",
          }}>
            Chargement des statistiques...
          </p>
        ) : stats ? (
          <>
            {/* ── Ligne 1 : KPIs principaux ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem", marginBottom: "1.5rem",
            }}>
              {[
                {
                  label: "Parcelles",
                  valeur: stats.nbParcelles,
                  sous: `${stats.superficieTotale} ha total`,
                  icone: "📐", couleur: "#2E5E3E",
                },
                {
                  label: "Palmiers",
                  valeur: stats.nbPalms,
                  sous: `${stats.femelles} femelles · ${stats.males} mâles`,
                  icone: "🌴", couleur: "#16a34a",
                },
                {
                  label: "Interventions",
                  valeur: stats.nbInterventions,
                  sous: "au total",
                  icone: "📋", couleur: "#B08D57",
                },
                {
                  label: "Notifications",
                  valeur: stats.nbNotifications,
                  sous: "en attente",
                  icone: "🔔", couleur: "#ef4444",
                },
              ].map(({ label, valeur, sous, icone, couleur }) => (
                <div key={label} style={{
                  backgroundColor: "white",
                  borderRadius: "0.75rem", padding: "1.25rem",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  border: "1px solid #f3f4f6",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: "0.5rem",
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>{icone}</span>
                    <span style={{
                      fontSize: "1.8rem", fontWeight: 800, color: couleur,
                    }}>
                      {valeur}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "0.82rem", fontWeight: 600, color: "#374151",
                  }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                    {sous}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Ligne 2 : État sanitaire + Âge ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem", marginBottom: "1.5rem",
            }}>

              {/* État sanitaire */}
              <div style={{
                backgroundColor: "white", borderRadius: "0.75rem",
                padding: "1.25rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                border: "1px solid #f3f4f6",
              }}>
                <h3 style={{
                  fontSize: "0.85rem", fontWeight: 700,
                  color: "#2E5E3E", marginBottom: "1rem",
                }}>
                  🌿 État sanitaire des palmiers
                </h3>
                {[
                  { label: "Bon",     code: "B",  couleur: "#22c55e" },
                  { label: "Moyen",   code: "MO", couleur: "#f97316" },
                  { label: "Mauvais", code: "MA", couleur: "#ef4444" },
                  { label: "Mort",    code: "MR", couleur: "#1f2937" },
                ].map(({ label, code, couleur }) => {
                  const nb      = stats.parEtat[code] || 0;
                  const pct     = stats.nbPalms
                    ? Math.round((nb / stats.nbPalms) * 100)
                    : 0;
                  return (
                    <div key={code} style={{ marginBottom: "0.6rem" }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: "0.78rem", marginBottom: "0.2rem",
                      }}>
                        <span style={{ color: "#374151" }}>{label}</span>
                        <span style={{ color: "#6b7280" }}>
                          {nb} ({pct}%)
                        </span>
                      </div>
                      <div style={{
                        height: "6px", backgroundColor: "#f3f4f6",
                        borderRadius: "3px", overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          backgroundColor: couleur,
                          borderRadius: "3px",
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Âge des palmiers */}
              <div style={{
                backgroundColor: "white", borderRadius: "0.75rem",
                padding: "1.25rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                border: "1px solid #f3f4f6",
              }}>
                <h3 style={{
                  fontSize: "0.85rem", fontWeight: 700,
                  color: "#2E5E3E", marginBottom: "1rem",
                }}>
                  🌱 Âge des palmiers
                </h3>
                {[
                  { label: "Jeunes",  code: "JP", couleur: "#86efac" },
                  { label: "Adultes", code: "A",  couleur: "#2E5E3E" },
                  { label: "Vieux",   code: "V",  couleur: "#92400e" },
                ].map(({ label, code, couleur }) => {
                  const nb  = stats.parAge[code] || 0;
                  const pct = stats.nbPalms
                    ? Math.round((nb / stats.nbPalms) * 100)
                    : 0;
                  return (
                    <div key={code} style={{ marginBottom: "0.6rem" }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: "0.78rem", marginBottom: "0.2rem",
                      }}>
                        <span style={{ color: "#374151" }}>{label}</span>
                        <span style={{ color: "#6b7280" }}>
                          {nb} ({pct}%)
                        </span>
                      </div>
                      <div style={{
                        height: "6px", backgroundColor: "#f3f4f6",
                        borderRadius: "3px", overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          backgroundColor: couleur,
                          borderRadius: "3px",
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}

                {/* Répartition sexe */}
                <div style={{
                  marginTop: "1rem", paddingTop: "1rem",
                  borderTop: "1px solid #f3f4f6",
                }}>
                  <p style={{
                    fontSize: "0.78rem", fontWeight: 600,
                    color: "#374151", marginBottom: "0.5rem",
                  }}>
                    Répartition par sexe
                  </p>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{
                        fontSize: "1.2rem", fontWeight: 800,
                        color: "#2E5E3E",
                      }}>
                        {stats.femelles}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                        🌴 Femelles
                      </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{
                        fontSize: "1.2rem", fontWeight: 800,
                        color: "#B08D57",
                      }}>
                        {stats.males}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                        🌴 Mâles
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Ligne 3 : Dernières interventions ── */}
            <div style={{
              backgroundColor: "white", borderRadius: "0.75rem",
              padding: "1.25rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              border: "1px solid #f3f4f6",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "1rem",
              }}>
                <h3 style={{
                  fontSize: "0.85rem", fontWeight: 700, color: "#2E5E3E",
                }}>
                  📋 Dernières interventions
                </h3>
                <button
                  onClick={() => navigate("/interventions")}
                  style={{
                    fontSize: "0.75rem", color: "#2E5E3E",
                    background: "none", border: "none",
                    cursor: "pointer", fontWeight: 600,
                  }}
                >
                  Voir tout →
                </button>
              </div>

              {stats.dernieresInterventions.length === 0 ? (
                <p style={{
                  fontSize: "0.85rem", color: "#9ca3af",
                  textAlign: "center", padding: "1rem",
                }}>
                  Aucune intervention enregistrée.
                </p>
              ) : (
                <div style={{
                  display: "flex", flexDirection: "column", gap: "0.5rem",
                }}>
                  {stats.dernieresInterventions.map((i) => (
                    <div key={i.id} style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.5rem",
                      fontSize: "0.82rem",
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, color: "#2E5E3E" }}>
                          {i.type_intervention_nom || i.type_intervention}
                        </span>
                        <span style={{ color: "#9ca3af", marginLeft: "0.5rem" }}>
                          · {i.parcelle_nom || "—"}
                        </span>
                      </div>
                      <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                        {formatDate(i.date_intervention)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p style={{
            textAlign: "center", color: "#9ca3af", padding: "3rem",
          }}>
            Impossible de charger les statistiques.
          </p>
        )}
      </div>
    </div>
  );
}