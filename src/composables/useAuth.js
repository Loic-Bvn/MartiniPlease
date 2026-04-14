// composables/useAuth.js
// Gère l'authentification des bartenders via Supabase Auth
// + le(s) bar(s) associé(s) au compte connecté
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const session     = ref(null)   // session Supabase (bartender connecté)
const bar         = ref(null)   // bar actif du bartender connecté
const bars        = ref([])     // tous les bars du compte (si plusieurs)
const authLoading = ref(false)
const authError   = ref('')

export function useAuth() {

  const isLoggedIn      = computed(() => !!session.value)
  const currentBarId    = computed(() => bar.value?.id ?? null)
  const currentBarName  = computed(() => bar.value?.name ?? '')
  const inviteCode      = computed(() => bar.value?.invite_code ?? '')
  const hasMultipleBars = computed(() => bars.value.length > 1 && !bar.value)
  const isBarPublic     = computed(() => bar.value?.is_public ?? false)

  // Initialise la session au démarrage (appelé dans App.vue onMounted)
  async function initAuth() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (session.value) await fetchBar()

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (newSession) await fetchBar()
      else {
        bar.value  = null
        bars.value = []
      }
    })
  }

  // Récupère le(s) bar(s) du bartender connecté
  // - Si barId est fourni : sélectionne ce bar précis
  // - Sinon : charge tous les bars du compte
  //   → 1 seul bar  : sélection automatique
  //   → plusieurs   : expose bars[] pour que l'UI affiche un sélecteur
  async function fetchBar(barId = null) {
    if (!session.value) return

    // Chargement initial : récupérer tous les bars du compte
    const { data, error } = await supabase
      .from('bars')
      .select('*')
      .eq('owner_id', session.value.user.id)
      .order('created_at')

    if (error) {
      console.error('❌ fetchBar:', error)
      return
    }

    bars.value = data || []

    if (barId) {
      // Sélection explicite d'un bar (après choix dans l'UI)
      const selected = bars.value.find(b => b.id === barId)
      if (selected) {
        bar.value = selected
      } else {
        console.error('❌ Bar not found:', barId)
      }
      return
    }

    // Sélection automatique
    if (!bars.value || bars.value.length === 0) {
      bar.value = null
    } else if (bars.value.length === 1) {
      // Un seul bar : sélection automatique, pas besoin de sélecteur
      bar.value = bars.value[0]
    } else {
      // Plusieurs bars : laisser l'utilisateur choisir (bar reste null)
      bar.value = null
    }
  }

  // Basculer vers un autre bar (navigation rapide entre ses bars)
  async function switchBar(barId) {
    const selected = bars.value.find(b => b.id === barId)
    if (selected) {
      bar.value = selected
    } else {
      console.error('❌ Bar not found:', barId)
    }
  }

  // Active / désactive la visibilité publique du bar
  async function toggleBarPublic() {
    if (!bar.value) return { success: false }
    const newValue = !bar.value.is_public
    const { error } = await supabase
      .from('bars')
      .update({ is_public: newValue })
      .eq('id', bar.value.id)
    if (error) {
      console.error('❌ toggleBarPublic:', error)
      return { success: false, error: error.message }
    }
    bar.value = { ...bar.value, is_public: newValue }
    return { success: true }
  }

  // Inscription bartender + création du bar
  async function signUp({ email, password, barName }) {
    authLoading.value = true
    authError.value   = ''
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      // Créer le bar (invite_code généré automatiquement par le trigger SQL)
      const { data: barData, error: barError } = await supabase
        .from('bars')
        .insert({ name: barName, owner_id: data.user.id, invite_code: '' })
        .select()
        .single()
      if (barError) throw barError

      bar.value  = barData
      bars.value = []
      return { success: true }
    } catch (err) {
      authError.value = err.message
      return { success: false, error: err.message }
    } finally {
      authLoading.value = false
    }
  }

  // Connexion bartender existant
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

  // Déconnexion
  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
    bar.value     = null
    bars.value    = []
  }

  // Créer un nouveau bar (pour un bartender déjà connecté)
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

      // Ajouter le nouveau bar à la liste
      bars.value.push(barData)
      // Sélectionner le nouveau bar automatiquement
      bar.value = barData
      return { success: true, data: barData }
    } catch (err) {
      authError.value = err.message
      return { success: false, error: err.message }
    } finally {
      authLoading.value = false
    }
  }

  // Modifier le nom d'un bar
  async function updateBarName(barId, newName) {
    if (!session.value) return { success: false, error: 'Non connecté' }
    try {
      const { error } = await supabase
        .from('bars')
        .update({ name: newName })
        .eq('id', barId)
        .eq('owner_id', session.value.user.id)
      if (error) throw error

      // Mettre à jour dans la liste locale
      const barIndex = bars.value.findIndex(b => b.id === barId)
      if (barIndex > -1) {
        bars.value[barIndex].name = newName
      }
      // Mettre à jour le bar actif si c'est le même
      if (bar.value?.id === barId) {
        bar.value.name = newName
      }
      return { success: true }
    } catch (err) {
      console.error('❌ updateBarName:', err)
      return { success: false, error: err.message }
    }
  }

  // Modifier le code d'invitation d'un bar
  async function updateInviteCode(barId, newCode) {
    if (!session.value) return { success: false, error: 'Non connecté' }
    try {
      const { error } = await supabase
        .from('bars')
        .update({ invite_code: newCode })
        .eq('id', barId)
        .eq('owner_id', session.value.user.id)
      if (error) throw error

      // Mettre à jour dans la liste locale
      const barIndex = bars.value.findIndex(b => b.id === barId)
      if (barIndex > -1) {
        bars.value[barIndex].invite_code = newCode
      }
      // Mettre à jour le bar actif si c'est le même
      if (bar.value?.id === barId) {
        bar.value.invite_code = newCode
      }
      return { success: true }
    } catch (err) {
      console.error('❌ updateInviteCode:', err)
      return { success: false, error: err.message }
    }
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
    toggleBarPublic,
    signUp,
    signIn,
    signOut,
    createNewBar,
    updateBarName,
    updateInviteCode,
  }
}