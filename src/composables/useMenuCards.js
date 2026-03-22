// composables/useMenuCards.js
// Gère les cartes de menu — filtrées par bar_id
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const menuCards = ref([])
const loading   = ref(false)

export function useMenuCards() {
  const { currentBarId } = useAuth()

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
        .insert({ name: cardData.name, cocktail_ids: cardData.cocktail_ids, bar_id: barId })
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
        .update({ name: cardData.name, cocktail_ids: cardData.cocktail_ids })
        .eq('id', id)
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

  async function deleteMenuCard(id) {
    try {
      const { error } = await supabase
        .from('menu_cards')
        .delete()
        .eq('id', id)

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
    deleteMenuCard,
  }
}