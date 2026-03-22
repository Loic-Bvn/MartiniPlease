// composables/useAuth.js
// Gère l'authentification des bartenders via Supabase Auth
// + le bar associé au compte connecté
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const session   = ref(null)   // session Supabase (bartender connecté)
const bar       = ref(null)   // bar du bartender connecté
const authLoading = ref(false)
const authError   = ref('')

export function useAuth() {

  const isLoggedIn     = computed(() => !!session.value)
  const currentBarId   = computed(() => bar.value?.id ?? null)
  const currentBarName = computed(() => bar.value?.name ?? '')
  const inviteCode     = computed(() => bar.value?.invite_code ?? '')

  // Initialise la session au démarrage (appelé dans App.vue onMounted)
  async function initAuth() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (session.value) await fetchBar()

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (newSession) await fetchBar()
      else bar.value = null
    })
  }

  // Récupère le bar du bartender connecté
  async function fetchBar() {
    if (!session.value) return
    const { data, error } = await supabase
      .from('bars')
      .select('*')
      .eq('owner_id', session.value.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ fetchBar:', error)
      return
    }
    bar.value = data ?? null
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

      bar.value = barData
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
  }

  return {
    session,
    bar,
    authLoading,
    authError,
    isLoggedIn,
    currentBarId,
    currentBarName,
    inviteCode,
    initAuth,
    fetchBar,
    signUp,
    signIn,
    signOut,
  }
}