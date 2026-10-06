// composables/useWakeLock.js
// Garde l'écran allumé (Screen Wake Lock API) tant qu'on en a besoin.
//
// - No-op silencieux si l'API n'existe pas (Firefox desktop, vieux Safari…).
// - Le navigateur libère le verrou quand l'onglet passe en arrière-plan :
//   on le reprend automatiquement au retour (visibilitychange).
// - Pas de console.error ici : monitoring.js relaie console.error vers Sentry,
//   et un refus (batterie faible, mode économie d'énergie) est un cas normal.
//
// À appeler dans un setup() de composant (utilise onBeforeUnmount).

import { ref, onBeforeUnmount } from 'vue'

export function useWakeLock() {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const active = ref(false)

  let sentinel = null
  let wanted = false

  async function acquire() {
    if (!supported || sentinel) return
    try {
      const lock = await navigator.wakeLock.request('screen')
      // Si release() a été appelé pendant l'attente, on relâche aussitôt.
      if (!wanted) { lock.release().catch(() => {}); return }
      sentinel = lock
      active.value = true
      lock.addEventListener('release', () => {
        if (sentinel === lock) sentinel = null
        active.value = false
      })
    } catch {
      active.value = false
    }
  }

  async function request() {
    wanted = true
    await acquire()
  }

  async function release() {
    wanted = false
    const lock = sentinel
    sentinel = null
    active.value = false
    try { await lock?.release() } catch { /* déjà relâché */ }
  }

  function onVisibilityChange() {
    if (wanted && document.visibilityState === 'visible') acquire()
  }

  if (supported) document.addEventListener('visibilitychange', onVisibilityChange)

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    release()
  })

  return { supported, active, request, release }
}