// composables/useAuth.js
// Gère l'authentification des bartenders via Supabase Auth
// + le(s) bar(s) associé(s) au compte connecté.
//
// ⚠️  SINGLETON : les ref sont déclarées au niveau module.
//     Elles sont donc partagées entre tous les appels à useAuth() dans l'appli.
//     Ce pattern est intentionnel pour une SPA Vue 3 sans store Pinia :
//     un seul état d'auth, accessible partout sans prop-drilling.
//     Si tu migres vers Pinia, déplace ces ref dans defineStore().
//
// ── localStorage ─────────────────────────────────────────────────────────────
// Seul l'ID du bar sélectionné est persisté (pas l'objet complet).
// L'objet complet est refetché depuis Supabase à chaque rechargement.
// Cela évite de servir des données périmées (nom, invite_code, is_public…)
// depuis le cache localStorage.

import { ref, computed } from 'vue'
import { supabase }      from '@/lib/supabase'
import { useToast }      from '@/composables/useToast'

// ── Clé localStorage ─────────────────────────────────────────────────────────
const SELECTED_BAR_ID_KEY = 'selectedBarId'

function getPersistedBarId() {
  try {
    return localStorage.getItem(SELECTED_BAR_ID_KEY) ?? null
  } catch {
    // SSR ou accès localStorage bloqué (Safari private mode…)
    return null
  }
}

function persistBarId(id) {
  try {
    if (id) localStorage.setItem(SELECTED_BAR_ID_KEY, id)
    else    localStorage.removeItem(SELECTED_BAR_ID_KEY)
  } catch {
    // silent fail
  }
}

// ── État singleton ────────────────────────────────────────────────────────────
const session     = ref(null)
const bar         = ref(null)    // bar actif — hydraté depuis Supabase au démarrage
const bars        = ref([])      // tous les bars du compte
const authLoading = ref(false)
const authError   = ref('')

export function useAuth() {
  const { toastError } = useToast()

  const isLoggedIn      = computed(() => !!session.value)
  const currentBarId    = computed(() => bar.value?.id    ?? null)
  const currentBarName  = computed(() => bar.value?.name  ?? '')
  const inviteCode      = computed(() => bar.value?.invite_code ?? '')
  const hasMultipleBars = computed(() => bars.value.length >= 1 && !bar.value)
  const isBarPublic     = computed(() => bar.value?.is_public  ?? false)

  // ── Initialisation ──────────────────────────────────────────────────────────

  async function initAuth() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (session.value) await fetchBar()

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (newSession) await fetchBar()
      else            _clearAuthState()
    })
  }

  // ── Récupération des bars ───────────────────────────────────────────────────

  /**
   * Récupère tous les bars du compte et sélectionne automatiquement
   * le dernier bar utilisé (via l'ID persisté en localStorage).
   *
   * @param {string|null} barId - Si fourni, force la sélection de ce bar.
   */
  async function fetchBar(barId = null) {
    if (!session.value) return

    const { data, error } = await supabase
      .from('bars')
      .select('*')
      .eq('owner_id', session.value.user.id)
      .order('created_at')

    if (error) {
      console.error('❌ fetchBar:', error)
      toastError(`Impossible de charger les bars : ${error.message}`)
      return
    }

    bars.value = data || []

    const targetId = barId ?? getPersistedBarId()

    if (targetId) {
      const found = bars.value.find(b => b.id === targetId)
      if (found) {
        bar.value = found
        return
      }
      // L'ID persisté n'existe plus (bar supprimé) → on nettoie
      persistBarId(null)
    }

    bar.value = null
  }

  // ── Sélection / switch de bar ───────────────────────────────────────────────

  async function switchBar(barId) {
    const found = bars.value.find(b => b.id === barId)
    if (found) {
      bar.value = found
    } else {
      console.error('❌ Bar not found:', barId)
    }
  }

  async function selectBar(selectedBar) {
    bar.value = selectedBar
    persistBarId(selectedBar?.id ?? null)
  }

  // ── Visibilité publique ─────────────────────────────────────────────────────

  async function toggleBarPublic() {
    if (!bar.value) return { success: false }
    const newValue = !bar.value.is_public

    const { error } = await supabase
      .from('bars')
      .update({ is_public: newValue })
      .eq('id', bar.value.id)

    if (error) {
      console.error('❌ toggleBarPublic:', error)
      toastError(error.message)
      return { success: false, error: error.message }
    }

    bar.value = { ...bar.value, is_public: newValue }
    return { success: true }
  }

  // ── Inscription ─────────────────────────────────────────────────────────────

  async function signUp({ email, password, barName }) {
    authLoading.value = true
    authError.value   = ''
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      const { data: barData, error: barError } = await supabase
        .from('bars')
        .insert({ name: barName, owner_id: data.user.id, invite_code: '' })
        .select()
        .single()
      if (barError) throw barError

      bar.value  = barData
      bars.value = []
      persistBarId(barData.id)
      return { success: true }
    } catch (err) {
      authError.value = err.message
      return { success: false, error: err.message }
    } finally {
      authLoading.value = false
    }
  }

  // ── Connexion ───────────────────────────────────────────────────────────────

  async function signIn({ email, password }) {
    authLoading.value = true
    authError.value   = ''
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await fetchBar()
      return { success: true }
    } catch (err) {
      authError.value = err.message
      return { success: false, error: err.message }
    } finally {
      authLoading.value = false
    }
  }

  // ── Déconnexion ─────────────────────────────────────────────────────────────

  async function signOut() {
    await supabase.auth.signOut()
    _clearAuthState()
  }

  // ── Création d'un nouveau bar (bartender déjà connecté) ─────────────────────

  async function createNewBar(barName) {
    if (!session.value) return { success: false, error: 'Non connecté' }
    authLoading.value = true
    authError.value   = ''
    try {
      const { data: barData, error: barError } = await supabase
        .from('bars')
        .insert({ name: barName, owner_id: session.value.user.id, invite_code: '' })
        .select()
        .single()
      if (barError) throw barError

      bars.value.push(barData)
      bar.value = barData
      persistBarId(barData.id)
      return { success: true, data: barData }
    } catch (err) {
      authError.value = err.message
      return { success: false, error: err.message }
    } finally {
      authLoading.value = false
    }
  }

  // ── Mise à jour du nom d'un bar ─────────────────────────────────────────────

  async function updateBarName(barId, newName) {
    if (!session.value) return { success: false, error: 'Non connecté' }
    try {
      const { error } = await supabase
        .from('bars')
        .update({ name: newName })
        .eq('id', barId)
        .eq('owner_id', session.value.user.id)
      if (error) throw error

      _updateLocalBar(barId, { name: newName })
      return { success: true }
    } catch (err) {
      console.error('❌ updateBarName:', err)
      return { success: false, error: err.message }
    }
  }

  // ── Mise à jour du code d'invitation ────────────────────────────────────────

  async function updateInviteCode(barId, newCode) {
    if (!session.value) return { success: false, error: 'Non connecté' }
    try {
      const { error } = await supabase
        .from('bars')
        .update({ invite_code: newCode })
        .eq('id', barId)
        .eq('owner_id', session.value.user.id)
      if (error) throw error

      _updateLocalBar(barId, { invite_code: newCode })
      return { success: true }
    } catch (err) {
      console.error('❌ updateInviteCode:', err)
      return { success: false, error: err.message }
    }
  }

  // ── Helpers privés ──────────────────────────────────────────────────────────

  function _clearAuthState() {
    session.value = null
    bar.value     = null
    bars.value    = []
    persistBarId(null)
  }

  function _updateLocalBar(barId, patch) {
    const idx = bars.value.findIndex(b => b.id === barId)
    if (idx > -1) bars.value[idx] = { ...bars.value[idx], ...patch }
    if (bar.value?.id === barId) bar.value = { ...bar.value, ...patch }
  }

  return {
    session,
    bar,
    bars,
    authLoading,
    authError,
    isLoggedIn,
    currentBarId,
    currentBarName,
    inviteCode,
    hasMultipleBars,
    isBarPublic,
    initAuth,
    fetchBar,
    switchBar,
    selectBar,
    toggleBarPublic,
    signUp,
    signIn,
    signOut,
    createNewBar,
    updateBarName,
    updateInviteCode,
  }
}