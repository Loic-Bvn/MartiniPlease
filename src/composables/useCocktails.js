// composables/useCocktails.js
// Fetche et gère les cocktails depuis Supabase
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const cocktails = ref([])
const loading = ref(false)

export function useCocktails() {

  async function fetchCocktails() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('cocktails')
        .select('*')
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
    try {
      const { id, ...dataWithoutId } = cocktailData
      const { data, error } = await supabase
        .from('cocktails')
        .insert(dataWithoutId)
        .select()
        .single()

      if (error) throw error
      cocktails.value.push(data)
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur createCocktail:', err)
      return { success: false, error: err }
    }
  }

  async function updateCocktail(id, cocktailData) {
    try {
      const { data, error } = await supabase
        .from('cocktails')
        .update(cocktailData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const index = cocktails.value.findIndex(c => c.id === id)
      if (index !== -1) cocktails.value[index] = data
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur updateCocktail:', err)
      return { success: false, error: err }
    }
  }

  async function deleteCocktail(id) {
    try {
      const { error } = await supabase
        .from('cocktails')
        .delete()
        .eq('id', id)

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