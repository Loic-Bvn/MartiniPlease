// composables/useCountdown.js
// Minuteur simple basé sur l'horloge (Date.now) plutôt que sur un compteur
// d'intervalles : reste juste même si le navigateur ralentit les timers
// quand l'écran se verrouille ou que l'onglet passe en arrière-plan.
//
// À appeler dans un setup() de composant (utilise onBeforeUnmount).

import { ref, onBeforeUnmount } from 'vue'

export function useCountdown() {
  const remaining = ref(0)      // secondes restantes
  const running   = ref(false)
  const finished  = ref(false)

  let endAt = 0
  let timer = null

  function clear() {
    if (timer) clearInterval(timer)
    timer = null
    running.value = false
  }

  function tick() {
    const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
    remaining.value = left
    if (left === 0) {
      clear()
      finished.value = true
      try { navigator.vibrate?.([200, 100, 200]) } catch { /* non supporté */ }
    }
  }

  function start(seconds) {
    clear()
    finished.value = false
    endAt = Date.now() + seconds * 1000
    remaining.value = seconds
    running.value = true
    timer = setInterval(tick, 250)
  }

  function reset() {
    clear()
    finished.value = false
    remaining.value = 0
  }

  onBeforeUnmount(clear)

  return { remaining, running, finished, start, reset }
}