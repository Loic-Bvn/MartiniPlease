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

// ── Purge du storage Supabase au changement de version ─────────────────────
// Si un utilisateur reste connecté sur un onglet pendant un déploiement, le
// vieux bundle JS resté actif en mémoire peut réécrire le token Supabase
// dans `localStorage` (ex: lors d'un rafraîchissement de session) dans un
// format que le nouveau bundle ne sait plus relire correctement une fois
// l'onglet rechargé : le client Supabase se retrouve alors dans un état
// interne incohérent (aucune requête ne part, aucune erreur ne remonte), et
// ni un Ctrl+F5 ni un redémarrage du navigateur ne suffisent puisque le
// storage persiste à travers tout ça.
//
// On compare donc la version de build stockée localement (VITE_APP_VERSION,
// le tag git — voir Footer.vue et .github/workflows/deploy.yml) à la version
// courante, et on purge les clés de storage Supabase (préfixe `sb-`, celui
// utilisé par défaut par supabase-js pour le token d'auth) si elles
// diffèrent, AVANT d'instancier le client. On ne touche pas au reste du
// localStorage (thème, langue, bar sélectionné, token drinker…) qui n'est
// pas concerné par ce bug.
const APP_VERSION_STORAGE_KEY = 'mp-app-version'

function purgeSupabaseStorageOnVersionChange() {
  try {
    const currentVersion = import.meta.env.VITE_APP_VERSION || 'dev'
    const storedVersion = localStorage.getItem(APP_VERSION_STORAGE_KEY)

    if (storedVersion !== currentVersion) {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => localStorage.removeItem(key))

      localStorage.setItem(APP_VERSION_STORAGE_KEY, currentVersion)
    }
  } catch (err) {
    // SSR ou accès localStorage bloqué (ex: Safari private mode) — on ne
    // bloque jamais le chargement de l'app pour ça.
    console.warn('purgeSupabaseStorageOnVersionChange a échoué:', err)
  }
}

purgeSupabaseStorageOnVersionChange()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseImageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'cocktail-images'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { lock: noOpLock },
})