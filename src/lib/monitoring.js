// lib/monitoring.js
// Sentry — capture les erreurs JS non catchées et les erreurs Supabase.
//
// Le codebase a déjà un pattern homogène : chaque catch (Supabase ou JS)
// fait `console.error('❌ xxx:', err)` (~40 emplacements dans les composables).
// Plutôt que de modifier chacun de ces emplacements, on intercepte
// console.error UNE FOIS ici : tout ce qui est déjà loggé remonte aussi
// dans Sentry, sans toucher aux composables existants ni casser
// le comportement actuel (le vrai console.error tourne toujours en premier).
//
// Les erreurs Vue non catchées (crash de composant, etc.) sont couvertes
// nativement par l'intégration @sentry/vue passée à Sentry.init({ app }).

import * as Sentry from '@sentry/vue'

const DSN = import.meta.env.VITE_SENTRY_DSN

export function initMonitoring(app) {
  if (!DSN) return // pas de DSN en dev / si non configuré → no-op

  Sentry.init({
    app,
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0, // pas de perf tracing pour l'instant, juste les erreurs
  })

  bridgeConsoleErrors()
}

function bridgeConsoleErrors() {
  const originalConsoleError = console.error

  console.error = (...args) => {
    originalConsoleError(...args) // comportement inchangé : ça continue de logger normalement

    const errorArg = args.find(a => a instanceof Error)
    const label = args.find(a => typeof a === 'string') ?? 'console.error'

    if (errorArg) {
      Sentry.captureException(errorArg, { extra: { label } })
    } else {
      // ex. console.error('❌ removeFavorite:', error) où `error` est un objet
      // Supabase (PostgrestError) et pas une instance d'Error JS
      const errorLike = args.find(a => a && typeof a === 'object' && 'message' in a)
      Sentry.captureException(
        new Error(errorLike?.message ?? args.map(String).join(' ')),
        { extra: { label, details: errorLike } }
      )
    }
  }
}
