import { createClient } from '@supabase/supabase-js'

// ── Contournement d'un bug connu de supabase-js/auth-js ─────────────────────
// Par défaut, le client sérialise ses opérations d'auth (getSession,
// signOut, refreshSession…) via la Web Locks API du navigateur
// (navigator.locks). Si une opération est interrompue en plein vol (onglet
// gelé/mis en veille par le navigateur, par ex. pendant qu'on reste connecté
// lors d'une mise à jour du site), ce verrou peut rester tenu indéfiniment
// AU NIVEAU DU NAVIGATEUR — pas de l'onglet — jusqu'à fermeture complète du
// navigateur. Bug upstream non résolu à ce jour :
//   https://github.com/supabase/supabase-js/issues/1594
//   https://github.com/supabase/supabase-js/issues/2013
//
// ⚠️ Une première tentative de correctif ici réimplémentait un verrou en
// mémoire "maison" — mauvaise idée : auth-js peut ré-appeler le verrou de
// façon réentrante depuis l'intérieur d'un appel déjà en cours (ex: un
// rafraîchissement de token déclenché pendant un getSession()), et une
// simple file d'attente FIFO deadlock dans ce cas (l'appel imbriqué attend
// que l'appel englobant se termine, qui attend lui-même l'appel imbriqué).
// On contourne donc le mécanisme de verrouillage entièrement plutôt que de
// le réimplémenter — c'est le correctif recommandé par les mainteneurs en
// attendant un vrai correctif upstream. Ça retire la garantie de
// sérialisation stricte entre onglets, mais pour une app mono-onglet côté
// utilisateur, le risque (travail dupliqué en cas de rafraîchissement
// concurrent) est largement préférable à un blocage total de l'app.
const noOpLock = async (_name, _acquireTimeout, fn) => fn()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseImageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'cocktail-images'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { lock: noOpLock },
})