// composables/useToast.js
// Toast global — remplace tous les alert() et console.error silencieux.
//
// Usage :
//   const { showToast } = useToast()
//   showToast('Lien copié 🍸')                         // succès (défaut)
//   showToast('Champ obligatoire manquant', 'warning')
//   showToast('Erreur Supabase : ...', 'error')
//
// Le composant AppHeader (ou un composant Toast dédié) affiche toastMessage
// et applique la classe CSS selon toastType.
//
// ⚠️  SINGLETON : état partagé dans toute l'appli (intentionnel).

import { ref } from 'vue'

const toastMessage = ref('')
const toastType    = ref('success')   // 'success' | 'warning' | 'error'

let _timer = null

export function useToast() {
  /**
   * @param {string} message   - Texte à afficher
   * @param {'success'|'warning'|'error'} type - Niveau visuel
   * @param {number} duration  - Durée d'affichage en ms (défaut 2500)
   */
  function showToast(message, type = 'success', duration = 2500) {
    if (_timer) clearTimeout(_timer)
    toastMessage.value = message
    toastType.value    = type
    _timer = setTimeout(() => {
      toastMessage.value = ''
    }, duration)
  }

  /** Raccourcis sémantiques */
  function toastSuccess(message, duration)  { showToast(message, 'success', duration) }
  function toastWarning(message, duration)  { showToast(message, 'warning', duration) }
  function toastError(message, duration)    { showToast(message, 'error',   duration) }

  return {
    toastMessage,
    toastType,
    showToast,
    toastSuccess,
    toastWarning,
    toastError,
  }
}