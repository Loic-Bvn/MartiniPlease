// composables/useRouter.js
// Routing léger basé sur window.location.hash
// Format : #/<invite_code>            → ouvre un bar
//          #/<invite_code>/<card-slug> → ouvre un bar + une carte

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
  if (!hash) return { inviteCode: null, cardSlug: null }
  const parts = hash.split('/')
  return {
    inviteCode: parts[0]?.toUpperCase() || null,
    cardSlug:   parts[1] || null,
  }
}

export function setHash(inviteCode, cardSlug = null) {
  const base = inviteCode ? inviteCode.toLowerCase() : ''
  const path = cardSlug ? `${base}/${cardSlug}` : base
  const newHash = path ? `/${path}` : ''

  if (window.location.hash !== `#${newHash}`) {
    window.location.hash = newHash
  }
}

export function clearHash() {
  // Retire le hash sans recharger la page
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export function buildShareUrl(inviteCode, cardSlug = null) {
  const origin = window.location.origin
  const pathname = window.location.pathname
  const base = inviteCode.toLowerCase()
  const path = cardSlug ? `${base}/${cardSlug}` : base
  return `${origin}${pathname}#/${path}`
}