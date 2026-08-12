// lib/analytics.js
// Wrapper minimal autour d'Umami (analytics cookieless, RGPD-friendly —
// cohérent avec le CookieConsentBanner qui annonce "aucun cookie de suivi").
//
// Le script Umami n'est chargé qu'en prod, et seulement si VITE_UMAMI_WEBSITE_ID
// est défini. En dev, track() ne fait rien (pas de bruit dans les stats).

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID

// URL du script — à adapter si tu passes en self-host un jour
// (ex. 'https://analytics.tondomaine.com/script.js')
const SCRIPT_SRC = import.meta.env.VITE_UMAMI_SCRIPT_URL ?? 'https://cloud.umami.is/script.js'

export function initAnalytics() {
  if (!import.meta.env.PROD || !WEBSITE_ID) return

  const script = document.createElement('script')
  script.defer = true
  script.src = SCRIPT_SRC
  script.setAttribute('data-website-id', WEBSITE_ID)
  document.head.appendChild(script)
}

/**
 * Envoie un événement custom à Umami.
 * Silencieux si le script n'est pas chargé (dev, ad-blocker, etc.)
 * @param {string} eventName
 * @param {Record<string, string|number|boolean>} [props]
 */
export function track(eventName, props = {}) {
  if (typeof window === 'undefined' || !window.umami) return
  window.umami.track(eventName, props)
}
