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

    if (barId) {
      // Sélection explicite d'un bar (après choix dans l'UI)
      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .eq('id', barId)
        .eq('owner_id', session.value.user.id)
        .single()

      if (error) {
        console.error('❌ fetchBar (by id):', error)
        return
      }
      bar.value  = data
      bars.value = []
      return
    }

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

    if (!data || data.length === 0) {
      bar.value  = null
      bars.value = []
    } else if (data.length === 1) {
      // Un seul bar : sélection automatique, pas besoin de sélecteur
      bar.value  = data[0]
      bars.value = []
    } else {
      // Plusieurs bars : laisser l'utilisateur choisir
      bar.value  = null
      bars.value = data
    }
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
    initAuth,
    fetchBar,
    signUp,
    signIn,
    signOut,
  }
}