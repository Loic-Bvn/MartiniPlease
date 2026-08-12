// composables/useBarManager.js
// Extrait la logique de gestion des bars depuis CocktailMenuApp.vue
//
// ⚠️  SINGLETON : les ref déclarées au niveau module sont partagées entre
//     toutes les instances du composable (pattern intentionnel — un seul
//     état de gestion de bar dans toute l'appli).
//     Si tu as besoin d'un état isolé (tests unitaires, multi-instance),
//     déplace les ref à l'intérieur de la fonction useBarManager().

import { ref } from 'vue'
import { supabase }         from '@/lib/supabase'
import { useAuth }          from '@/composables/useAuth'
import { useBarStatistics } from '@/composables/useBarStatistics'
import { useToast }         from '@/composables/useToast'

// ── État singleton ────────────────────────────────────────────────────────────
const showBarsSelection       = ref(false)
const editingBarId            = ref(null)
const editingBarName          = ref('')
const editingBarCode          = ref('')
const updatingBarId           = ref(null)
const newBarName              = ref('')
const newBarInviteCode        = ref('')
const showNewBarInput         = ref(false)
const barToDelete             = ref(null)
const deleteConfirmationInput = ref('')
const barStatsMap             = ref({})   // { [barId]: { cocktails: number, cards: number } }
const togglingPublic          = ref(false)

export function useBarManager({ onBarSelected } = {}) {
  const {
    session,
    bar,
    bars,
    isLoggedIn,
    fetchBar,
    toggleBarPublic,
    createNewBar,
    updateBarName,
    updateInviteCode,
    currentBarId,
    signOut,
    selectBar: authSelectBar,
  } = useAuth()

  const { getBarStats }   = useBarStatistics()
  const { showToast }     = useToast()

  // ── Sélection d'un bar ──────────────────────────────────────────────────────

  async function selectBar(b) {
    await authSelectBar(b)
    showBarsSelection.value = false
    onBarSelected?.(b)
  }

  // ── Création d'un nouveau bar ───────────────────────────────────────────────

  async function handleCreateNewBar(initIngredientsFn) {
    const name = newBarName.value.trim()
    if (!name) return { success: false }

    const result = await createNewBar(name, newBarInviteCode.value.trim())
    if (!result.success) {
      showToast(`❌ ${result.error}`)
      return result
    }

    newBarName.value       = ''
    newBarInviteCode.value = ''
    showNewBarInput.value  = false

    if (initIngredientsFn) {
      try {
        await initIngredientsFn(result.data.id)
      } catch (err) {
        console.error('⚠️ Error initializing ingredients:', err)
      }
    }

    showBarsSelection.value = false
    onBarSelected?.(result.data)
    return result
  }

  // ── Édition d'un bar ────────────────────────────────────────────────────────

  function startEditBar(b) {
    editingBarId.value   = b.id
    editingBarName.value = b.name
    editingBarCode.value = b.invite_code
  }

  function cancelEditBar() {
    editingBarId.value   = null
    editingBarName.value = ''
    editingBarCode.value = ''
  }

  async function saveBarEdits(barId, locale = 'fr') {
    if (!editingBarName.value.trim()) {
      showToast(locale === 'fr' ? '⚠️ Le nom du bar ne peut pas être vide.' : '⚠️ Bar name cannot be empty.')
      return { success: false }
    }
    if (!editingBarCode.value.trim()) {
      showToast(locale === 'fr' ? '⚠️ Le code d\'invitation ne peut pas être vide.' : '⚠️ Invite code cannot be empty.')
      return { success: false }
    }

    updatingBarId.value = barId
    try {
      const currentBar = bars.value.find(b => b.id === barId)

      if (editingBarName.value !== currentBar?.name) {
        const r = await updateBarName(barId, editingBarName.value.trim())
        if (!r.success) throw new Error(r.error)
      }

      if (editingBarCode.value !== currentBar?.invite_code) {
        const r = await updateInviteCode(barId, editingBarCode.value.trim().toUpperCase())
        if (!r.success) throw new Error(r.error)
      }

      cancelEditBar()
      return { success: true }
    } catch (err) {
      console.error('❌ Error saving bar edits:', err)
      showToast(`❌ ${err.message}`)
      return { success: false, error: err.message }
    } finally {
      updatingBarId.value = null
    }
  }

  // ── Suppression d'un bar ────────────────────────────────────────────────────

  function startDeleteBar(b) {
    barToDelete.value             = b
    deleteConfirmationInput.value = ''
  }

  async function handleDeleteBar(locale = 'fr') {
    if (
      !barToDelete.value ||
      deleteConfirmationInput.value !== barToDelete.value.name
    ) return { success: false }

    try {
      const { error } = await supabase
        .from('bars')
        .delete()
        .eq('id', barToDelete.value.id)
        .eq('owner_id', session.value.user.id)

      if (error) throw error

      // Retirer le bar de la liste locale
      const idx = bars.value.findIndex(b => b.id === barToDelete.value.id)
      if (idx > -1) bars.value.splice(idx, 1)

      const deletedId = barToDelete.value.id
      barToDelete.value             = null
      deleteConfirmationInput.value = ''

      // Si c'était le bar actif → fallback
      if (currentBarId.value === deletedId) {
        if (bars.value.length > 0) {
          await selectBar(bars.value[0])
        } else {
          bar.value               = null
          showBarsSelection.value = false
        }
      }

      showToast(locale === 'fr' ? '🗑️ Bar supprimé' : '🗑️ Bar deleted')
      return { success: true }
    } catch (err) {
      console.error('❌ Error deleting bar:', err)
      showToast(`❌ ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  // ── Visibilité publique ─────────────────────────────────────────────────────

  async function handleTogglePublic() {
    if (togglingPublic.value) return
    togglingPublic.value = true
    try {
      await toggleBarPublic()
    } finally {
      togglingPublic.value = false
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  async function loadBarStats(barId) {
    if (barStatsMap.value[barId]) return   // mise en cache simple
    barStatsMap.value[barId] = await getBarStats(barId)
  }

  // ── Ouverture de l'écran de sélection ──────────────────────────────────────

  /**
   * Passe en mode "sélection de bar" :
   * - désélectionne le bar actif
   * - vide localStorage
   * - remet showBarsSelection à true
   * Doit être appelé depuis CocktailMenuApp qui gère aussi le hash et searchTerm.
   */
  function openBarsSelection() {
    bar.value = null
    localStorage.removeItem('selectedBarId')
    showBarsSelection.value = true
  }

  return {
    // État
    showBarsSelection,
    editingBarId,
    editingBarName,
    editingBarCode,
    updatingBarId,
    newBarName,
    newBarInviteCode,
    showNewBarInput,
    barToDelete,
    deleteConfirmationInput,
    barStatsMap,
    togglingPublic,

    // Actions
    selectBar,
    handleCreateNewBar,
    startEditBar,
    cancelEditBar,
    saveBarEdits,
    startDeleteBar,
    handleDeleteBar,
    handleTogglePublic,
    loadBarStats,
    openBarsSelection,
  }
}