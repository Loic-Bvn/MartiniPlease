import { createClient } from '@supabase/supabase-js'

// ── Contournement d'un bug connu de supabase-js/auth-js ─────────────────────
// Par défaut, le client sérialise ses opérations d'auth (getSession,
// signOut, refreshSession…) via la Web Locks API du navigateur
// (navigator.locks). Si une opération est interrompue en plein vol (onglet
// gelé/mis en veille par le navigateur, par ex. pendant qu'on reste connecté
// lors d'une mise à jour du site), ce verrou peut rester tenu indéfiniment
// AU NIVEAU DU NAVIGATEUR — pas de l'onglet. Résultat : toute future
// opération d'auth (y compris après un Ctrl+F5, puisque le verrou survit au
// rechargement) reste bloquée, jusqu'à fermeture complète du navigateur.
// Bug upstream non résolu à ce jour :
//   https://github.com/supabase/supabase-js/issues/1594
//   https://github.com/supabase/supabase-js/issues/2013
// On remplace ce verrou par un verrou en mémoire, propre à l'onglet : il ne
// survit jamais à un rechargement, donc ne peut jamais rester orphelin
// d'une session à l'autre.
let lockQueue = Promise.resolve()
async function inMemoryLock(_name, _acquireTimeout, fn) {
  const previous = lockQueue
  let release
  lockQueue = new Promise((resolve) => { release = resolve })
  try {
    await previous
    return await fn()
  } finally {
    release()
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseImageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'cocktail-images'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { lock: inMemoryLock },
})