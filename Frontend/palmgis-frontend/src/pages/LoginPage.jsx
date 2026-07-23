import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();

  // Récupère ce dont on a besoin depuis le store
  const login          = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const error          = useAuthStore((state) => state.error);
  const clearError     = useAuthStore((state) => state.clearError);

  // État local du formulaire
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Si l'utilisateur est déjà connecté (cookie encore valide),
   * on le redirige directement vers /map sans afficher le formulaire.
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/map", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Efface l'erreur quand l'utilisateur commence à retaper.
   */
  useEffect(() => {
    if (error) clearError();
  }, [username, password]);

  /**
   * Soumission du formulaire.
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) return;

    setIsSubmitting(true);

    const succes = await login(username, password);

    if (succes) {
      navigate("/map", { replace: true });
    }

    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-primary-500 flex items-center justify-center p-4">

      {/* Carte de login */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌴</div>
          <h1 className="text-2xl font-bold text-primary-500">
            PalmGIS Smart Farm
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Connectez-vous pour accéder à la plateforme
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Champ username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre identifiant"
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-primary-500
                         focus:border-transparent disabled:bg-gray-100
                         disabled:cursor-not-allowed transition"
            />
          </div>

          {/* Champ password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-primary-500
                         focus:border-transparent disabled:bg-gray-100
                         disabled:cursor-not-allowed transition"
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700
                            rounded-lg px-4 py-3 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={isSubmitting || !username.trim() || !password.trim()}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white
                       font-semibold py-3 px-4 rounded-lg transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </button>

        </form>

        {/* Pied de page */}
        <p className="text-center text-gray-400 text-xs mt-8">
          PalmGIS Smart Farm © 2026
        </p>

      </div>
    </div>
  );
}