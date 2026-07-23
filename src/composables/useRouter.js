// composables/useRouter.js
// Routing léger basé sur window.location.hash
// Format : #/<invite_code>                             → ouvre un bar
//          #/<invite_code>/<cocktail-slug>              → ouvre un bar + un cocktail (sans carte)
//          #/<invite_code>/<card-slug>                  → ouvre un bar + une carte
//          #/<invite_code>/<card-slug>/<cocktail-slug>  → ouvre un bar + une carte + un cocktail
//
// Le 2e segment est ambigu par construction (carte OU cocktail) : c'est à
// l'appelant (CocktailMenuApp) de tenter la résolution (carte d'abord, puis
// cocktail en repli) puisque parseHash n'a pas accès aux données du bar.

export function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')       // remplace tout ce qui n'est pas alphanum par -
    .replace(/^-+|-+$/g, '')           // retire les tirets en début/fin
}

export function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (!hash) return { inviteCode: null, cardSlug: null, cocktailSlug: null }
  const parts = hash.split('/').filter(Boolean)
  return {
    inviteCode:   parts[0]?.toUpperCase() || null,
    cardSlug:     parts[1] || null,
    cocktailSlug: parts[2] || null,
  }
}

export function setHash(inviteCode, cardSlug = null, cocktailSlug = null) {
  const base = inviteCode ? inviteCode.toLowerCase() : ''
  const segments = [base, cardSlug, cocktailSlug].filter(Boolean)
  const path = segments.join('/')
  const newHash = path ? `/${path}` : ''

  if (window.location.hash !== `#${newHash}`) {
    window.location.hash = newHash
  }
}

export function clearHash() {
  // Retire le hash sans recharger la page
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export function buildShareUrl(inviteCode, cardSlug = null, cocktailSlug = null) {
  const origin = window.location.origin
  const pathname = window.location.pathname
  const base = inviteCode.toLowerCase()
  const segments = [base, cardSlug, cocktailSlug].filter(Boolean)
  return `${origin}${pathname}#/${segments.join('/')}`
}