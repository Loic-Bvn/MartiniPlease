// composables/useDrinker.js
// Gère le profil drinker anonyme
// - Un token UUID est stocké en localStorage (léger, juste un identifiant)
// - Le profil complet (pseudo, favoris, historique) est en base Supabase
// - Le drinker retrouve son profil sur n'importe quel appareil via son token
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const drinker    = ref(null)      // { id, pseudo, bar_id, token }
const favorites  = ref(new Set()) // Set de cocktail_id
const history    = ref([])        // [{ cocktail_id, ordered_at }]

const TOKEN_KEY = 'martini_drinker_token'

export function useDrinker() {

  const hasDrinker    = computed(() => !!drinker.value)
  const drinkerPseudo = computed(() => drinker.value?.pseudo ?? '')

  // Charge le drinker depuis le token localStorage → lookup en base
  async function initDrinker(barId) {
    const token = localStorage.getItem(TOKEN_KEY)

    if (token) {
      const { data, error } = await supabase
        .from('drinker_profiles')
        .select('*')
        .eq('token', token)
        .eq('bar_id', barId)
        .single()

      if (!error && data) {
        drinker.value = data
        await Promise.all([fetchFavorites(), fetchHistory()])
        return
      }
    }

    // Pas de token ou token invalide pour ce bar
    drinker.value   = null
    favorites.value = new Set()
    history.value   = []
  }

  // Crée un nouveau profil drinker, stocke uniquement le token
  async function createDrinker({ pseudo, barId }) {
    const { data, error } = await supabase
      .from('drinker_profiles')
      .insert({ pseudo, bar_id: barId })
      .select()
      .single()

    if (error) {
      console.error('❌ createDrinker:', error)
      return { success: false, error: error.message }
    }

    // On ne stocke que le token, pas le profil entier
    localStorage.setItem(TOKEN_KEY, data.token)
    drinker.value = data
    return { success: true }
  }

  // Reconnexion via pseudo
  async function reconnectDrinker({ pseudo, barId }) {
    const { data, error } = await supabase
      .from('drinker_profiles')
      .select('*')
      .eq('pseudo', pseudo.trim())
      .eq('bar_id', barId)
      .single()

    if (error || !data) {
      return { success: false }
    }

    localStorage.setItem(TOKEN_KEY, data.token)
    drinker.value = data
    await Promise.all([fetchFavorites(), fetchHistory()])
    return { success: true }
  }

  // Déconnecte le drinker (supprime le token localStorage)
  function clearDrinker() {
    localStorage.removeItem(TOKEN_KEY)
    drinker.value   = null
    favorites.value = new Set()
    history.value   = []
  }

  // ── Favoris ──────────────────────────────────────────────────

  async function fetchFavorites() {
    if (!drinker.value) return
    const { data, error } = await supabase
      .from('drinker_favorites')
      .select('cocktail_id')
      .eq('drinker_id', drinker.value.id)

    if (error) { console.error('❌ fetchFavorites:', error); return }
    favorites.value = new Set(data.map(f => f.cocktail_id))
  }

  function isFavorite(cocktailId) {
    return favorites.value.has(cocktailId)
  }

  async function toggleFavorite(cocktailId) {
    if (!drinker.value) return

    if (isFavorite(cocktailId)) {
      // Retirer
      const { error } = await supabase
        .from('drinker_favorites')
        .delete()
        .eq('drinker_id', drinker.value.id)
        .eq('cocktail_id', cocktailId)

      if (error) { console.error('❌ removeFavorite:', error); return }
      favorites.value.delete(cocktailId)
      favorites.value = new Set(favorites.value)
    } else {
      // Ajouter
      const { error } = await supabase
        .from('drinker_favorites')
        .insert({
          drinker_id:  drinker.value.id,
          cocktail_id: cocktailId,
          bar_id:      drinker.value.bar_id,
        })

      if (error) { console.error('❌ addFavorite:', error); return }
      favorites.value.add(cocktailId)
      favorites.value = new Set(favorites.value)
    }
  }

  // ── Historique ───────────────────────────────────────────────

  async function fetchHistory() {
    if (!drinker.value) return
    const { data, error } = await supabase
      .from('drink_history')
      .select('cocktail_id, ordered_at')
      .eq('drinker_id', drinker.value.id)
      .order('ordered_at', { ascending: false })

    if (error) { console.error('❌ fetchHistory:', error); return }
    history.value = data
  }

  async function addToHistory(cocktailId) {
    if (!drinker.value) return
    const { error } = await supabase
      .from('drink_history')
      .insert({
        drinker_id:  drinker.value.id,
        cocktail_id: cocktailId,
        bar_id:      drinker.value.bar_id,
      })

    if (error) { console.error('❌ addToHistory:', error); return }
    history.value.unshift({ cocktail_id: cocktailId, ordered_at: new Date().toISOString() })
  }

  return {
    drinker,
    favorites,
    history,
    hasDrinker,
    drinkerPseudo,
    initDrinker,
    createDrinker,
    reconnectDrinker,
    clearDrinker,
    fetchFavorites,
    isFavorite,
    toggleFavorite,
    fetchHistory,
    addToHistory,
  }
}