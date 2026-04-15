// composables/useCocktails.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useCatalog } from '@/composables/useCatalog'
import { validateCocktail } from '@/composables/useDataValidator'

const cocktails = ref([])
const loading   = ref(false)

export function useCocktails() {
  const { currentBarId } = useAuth()

  async function fetchCocktails(barId) {
    const id = barId ?? currentBarId.value
    if (!id) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('cocktails')
        .select('*')
        .eq('bar_id', id)
        .order('name')

      if (error) throw error
      cocktails.value = data
    } catch (err) {
      console.error('❌ Erreur fetchCocktails:', err)
    } finally {
      loading.value = false
    }
  }

  async function createCocktail(cocktailData) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    // Si id présent → déléguer à updateCocktail
    if (cocktailData.id) {
      return updateCocktail(cocktailData.id, cocktailData)
    }

    try {
      const validated = validateCocktail(cocktailData)
      const { id, ...dataWithoutId } = validated

      const { data, error } = await supabase
        .from('cocktails')
        .insert(dataWithoutId)
        .select()
        .single()

      if (error) throw error
      cocktails.value.push(data)
      cocktails.value.sort((a, b) => a.name.localeCompare(b.name))
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur createCocktail:', err)
      return { success: false, error: err.message || err }
    }
  }

  async function updateCocktail(id, cocktailData) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }
    
    try {
      const validated = validateCocktail(cocktailData)
      const { data, error } = await supabase
        .from('cocktails')
        .update(validated)
        .eq('id', id)
        .eq('bar_id', barId) // 🔥 sécurité multi-tenant
        .select()
        .single()

      if (error) throw error
      const index = cocktails.value.findIndex(c => c.id === id)
      if (index !== -1) cocktails.value[index] = data
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur updateCocktail:', err)
      return { success: false, error: err.message || err }
    }
  }

  async function deleteCocktail(id) {
    const barId = currentBarId.value

    try {
      const { error } = await supabase
        .from('cocktails')
        .delete()
        .eq('id', id)
        .eq('bar_id', barId) // 🔥 sécurité multi-tenant

      if (error) throw error

      cocktails.value = cocktails.value.filter(c => c.id !== id)

      return { success: true }
    } catch (err) {
      console.error('❌ Erreur deleteCocktail:', err)
      return { success: false, error: err }
    }
  }

  return {
    cocktails,
    loading,
    fetchCocktails,
    createCocktail,
    updateCocktail,
    deleteCocktail,
  }
}