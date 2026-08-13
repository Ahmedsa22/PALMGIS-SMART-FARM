import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ChevronLeft, LandPlot, TreePalm, Wrench, Bell } from "lucide-react";
import { getParcelles } from "../api/parcelles";
import { getPalms } from "../api/palms";
import { getInterventions } from "../api/interventions";
import { getNotifications } from "../api/notifications";
import Navbar from "../components/layout/Navbar";
import { theme } from "../styles/theme";
import Button from "../components/ui/Button";
import { SectionTitle } from "../components/ui/Badge";

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
      height: "100vh", backgroundColor: theme.colors.bg,
      overflow: "hidden", fontFamily: theme.font.family,
    }}>
      <Navbar />

      {/* En-tête */}
      <div style={{
        backgroundColor: theme.colors.surface, padding: "16px 24px",
        borderBottom: `1px solid ${theme.colors.border}`,
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexShrink: 0,
      }}>
        <h1 style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: theme.font.size.lg, fontWeight: 700, color: theme.colors.text,
        }}>
          <LayoutDashboard size={18} color={theme.colors.primary} /> Tableau de bord
        </h1>
        <Button variant="secondary" icon={ChevronLeft} fullWidth={false} onClick={() => navigate("/map")}>
          Carte
        </Button>
      </div>

      {/* Contenu scrollable */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: 24, minHeight: 0,
      }}>

        {isLoading ? (
          <p style={{
            textAlign: "center", color: theme.colors.textMuted,
            padding: 48, fontSize: theme.font.size.base,
          }}>
            Chargement des statistiques...
          </p>
        ) : stats ? (
          <>
            {/* ── Ligne 1 : KPIs principaux ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16, marginBottom: 24,
            }}>
              {[
                {
                  label: "Parcelles",
                  valeur: stats.nbParcelles,
                  sous: `${stats.superficieTotale} ha total`,
                  Icone: LandPlot, couleur: theme.colors.primary,
                },
                {
                  label: "Palmiers",
                  valeur: stats.nbPalms,
                  sous: `${stats.femelles} femelles · ${stats.males} mâles`,
                  Icone: TreePalm, couleur: theme.colors.success,
                },
                {
                  label: "Interventions",
                  valeur: stats.nbInterventions,
                  sous: "au total",
                  Icone: Wrench, couleur: theme.colors.accent,
                },
                {
                  label: "Notifications",
                  valeur: stats.nbNotifications,
                  sous: "en attente",
                  Icone: Bell, couleur: theme.colors.danger,
                },
              ].map(({ label, valeur, sous, Icone, couleur }) => (
                <div key={label} style={cardStyle}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 8,
                  }}>
                    <Icone size={20} color={couleur} />
                    <span style={{
                      fontSize: "28px", fontWeight: 800, color: couleur,
                    }}>
                      {valeur}
                    </span>
                  </div>
                  <p style={{
                    fontSize: theme.font.size.sm, fontWeight: 600, color: theme.colors.text,
                  }}>
                    {label}
                  </p>
                  <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                    {sous}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Ligne 2 : État sanitaire + Âge ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16, marginBottom: 24,
            }}>

              {/* État sanitaire */}
              <div style={cardStyle}>
                <SectionTitle style={{ marginBottom: 16 }}>État sanitaire des palmiers</SectionTitle>
                {[
                  { label: "Bon",     code: "B",  couleur: theme.colors.santeBon },
                  { label: "Moyen",   code: "MO", couleur: theme.colors.santeMoyen },
                  { label: "Mauvais", code: "MA", couleur: theme.colors.santeMauvais },
                  { label: "Mort",    code: "MR", couleur: theme.colors.santeMort },
                ].map(({ label, code, couleur }) => {
                  const nb      = stats.parEtat[code] || 0;
                  const pct     = stats.nbPalms
                    ? Math.round((nb / stats.nbPalms) * 100)
                    : 0;
                  return (
                    <div key={code} style={{ marginBottom: 10 }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: theme.font.size.sm, marginBottom: 4,
                      }}>
                        <span style={{ color: theme.colors.text }}>{label}</span>
                        <span style={{ color: theme.colors.textMuted }}>
                          {nb} ({pct}%)
                        </span>
                      </div>
                      <div style={barTrackStyle}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          backgroundColor: couleur,
                          borderRadius: 3,
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Âge des palmiers */}
              <div style={cardStyle}>
                <SectionTitle style={{ marginBottom: 16 }}>Âge des palmiers</SectionTitle>
                {[
                  { label: "Jeunes",  code: "JP", couleur: theme.colors.santeBon },
                  { label: "Adultes", code: "A",  couleur: theme.colors.primary },
                  { label: "Vieux",   code: "V",  couleur: theme.colors.accent },
                ].map(({ label, code, couleur }) => {
                  const nb  = stats.parAge[code] || 0;
                  const pct = stats.nbPalms
                    ? Math.round((nb / stats.nbPalms) * 100)
                    : 0;
                  return (
                    <div key={code} style={{ marginBottom: 10 }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: theme.font.size.sm, marginBottom: 4,
                      }}>
                        <span style={{ color: theme.colors.text }}>{label}</span>
                        <span style={{ color: theme.colors.textMuted }}>
                          {nb} ({pct}%)
                        </span>
                      </div>
                      <div style={barTrackStyle}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          backgroundColor: couleur,
                          borderRadius: 3,
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}

                {/* Répartition sexe */}
                <div style={{
                  marginTop: 16, paddingTop: 16,
                  borderTop: `1px solid ${theme.colors.border}`,
                }}>
                  <p style={{
                    fontSize: theme.font.size.sm, fontWeight: 600,
                    color: theme.colors.text, marginBottom: 8,
                  }}>
                    Répartition par sexe
                  </p>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{
                        fontSize: theme.font.size.xl, fontWeight: 800,
                        color: theme.colors.primary,
                      }}>
                        {stats.femelles}
                      </p>
                      <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                        Femelles
                      </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{
                        fontSize: theme.font.size.xl, fontWeight: 800,
                        color: theme.colors.accent,
                      }}>
                        {stats.males}
                      </p>
                      <p style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
                        Mâles
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Ligne 3 : Dernières interventions ── */}
            <div style={cardStyle}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 16,
              }}>
                <SectionTitle>Dernières interventions</SectionTitle>
                <button
                  onClick={() => navigate("/interventions")}
                  style={{
                    fontSize: theme.font.size.xs, color: theme.colors.primary,
                    background: "none", border: "none",
                    cursor: "pointer", fontWeight: 600,
                  }}
                >
                  Voir tout →
                </button>
              </div>

              {stats.dernieresInterventions.length === 0 ? (
                <p style={{
                  fontSize: theme.font.size.sm, color: theme.colors.textMuted,
                  textAlign: "center", padding: 16,
                }}>
                  Aucune intervention enregistrée.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {stats.dernieresInterventions.map((i) => (
                    <div key={i.id} style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 4px",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      fontSize: theme.font.size.sm,
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, color: theme.colors.text }}>
                          {i.type_intervention_nom || i.type_intervention}
                        </span>
                        <span style={{ color: theme.colors.textMuted, marginLeft: 8 }}>
                          · {i.parcelle_nom || "—"}
                        </span>
                      </div>
                      <span style={{ color: theme.colors.textMuted, fontSize: theme.font.size.xs }}>
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
            textAlign: "center", color: theme.colors.textMuted, padding: 48,
          }}>
            Impossible de charger les statistiques.
          </p>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.lg,
  padding: 20,
  border: `1px solid ${theme.colors.border}`,
};

const barTrackStyle = {
  height: 6, backgroundColor: theme.colors.border,
  borderRadius: 3, overflow: "hidden",
};
