/**
 * Lit la valeur d'un cookie par son nom.
 * Utilisé principalement pour récupérer le token CSRF
 * que Django pose automatiquement dans le cookie "csrftoken".
 */
export function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }

  return null;
}

/**
 * Raccourci direct pour récupérer le token CSRF Django.
 */
export function getCSRFToken() {
  return getCookie("csrftoken");
}