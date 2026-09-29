// composables/useMenuCards.js
// Gère les cartes de menu — filtrées par bar_id
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const menuCards = ref([])
const loading   = ref(false)

export function useMenuCards() {
  const { currentBarId } = useAuth()
  const { toastError }   = useToast()

  async function fetchMenuCards(barId) {
    const id = barId ?? currentBarId.value
    if (!id) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('menu_cards')
        .select('*')
        .eq('bar_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      menuCards.value = data
    } catch (err) {
      console.error('❌ Erreur fetchMenuCards:', err)
      toastError('Impossible de charger les cartes de menu. Réessaie ou recharge la page.')
    } finally {
      loading.value = false
    }
  }

  async function createMenuCard(cardData) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }
    try {
      const { data, error } = await supabase
        .from('menu_cards')
        .insert({
          name: cardData.name,
          cocktail_ids: cardData.cocktail_ids,
          is_visible: cardData.is_visible ?? true,
          bar_id: barId,
        })
        .select()
        .single()

      if (error) throw error
      menuCards.value.unshift(data)
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur createMenuCard:', err)
      return { success: false, error: err }
    }
  }

  async function updateMenuCard(id, cardData) {
    try {
      const { data, error } = await supabase
        .from('menu_cards')
        .update({
          name: cardData.name,
          cocktail_ids: cardData.cocktail_ids,
          is_visible: cardData.is_visible ?? true,
        })
        .eq('id', id)
        .eq('bar_id', currentBarId.value)
        .select()
        .single()

      if (error) throw error
      const idx = menuCards.value.findIndex(c => c.id === id)
      if (idx !== -1) menuCards.value[idx] = data
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur updateMenuCard:', err)
      return { success: false, error: err }
    }
  }

  /**
   * Ajoute le cocktail au menu s'il n'y est pas, le retire sinon.
   * Ne met à jour que cocktail_ids (nom et visibilité restent intacts).
   * @returns {{ success: boolean, added?: boolean, data?: object, error?: any }}
   */
  async function toggleCocktailInMenuCard(menuCardId, cocktailId) {
    const card = menuCards.value.find(c => c.id === menuCardId)
    if (!card) return { success: false, error: 'Carte introuvable' }

    const current = card.cocktail_ids || []
    const added   = !current.includes(cocktailId)
    const next    = added
      ? [...current, cocktailId]
      : current.filter(id => id !== cocktailId)

    try {
      const { data, error } = await supabase
        .from('menu_cards')
        .update({ cocktail_ids: next })
        .eq('id', menuCardId)
        .eq('bar_id', currentBarId.value)
        .select()
        .single()

      if (error) throw error
      const idx = menuCards.value.findIndex(c => c.id === menuCardId)
      if (idx !== -1) menuCards.value[idx] = data
      return { success: true, added, data }
    } catch (err) {
      console.error('❌ Erreur toggleCocktailInMenuCard:', err)
      return { success: false, error: err }
    }
  }

  async function deleteMenuCard(id) {
    try {
      const { error } = await supabase
        .from('menu_cards')
        .delete()
        .eq('id', id)
        .eq('bar_id', currentBarId.value)

      if (error) throw error
      menuCards.value = menuCards.value.filter(c => c.id !== id)
      return { success: true }
    } catch (err) {
      console.error('❌ Erreur deleteMenuCard:', err)
      return { success: false, error: err }
    }
  }

  return {
    menuCards,
    loading,
    fetchMenuCards,
    createMenuCard,
    updateMenuCard,
    toggleCocktailInMenuCard,
    deleteMenuCard,
  }
}