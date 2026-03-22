// composables/useInventory.js
// Gère le stock du bar — filtré par bar_id
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const barInventory = ref(new Set())
const ingredients  = ref([])
const loading      = ref(false)

export function useInventory() {
  const { currentBarId } = useAuth()

  async function fetchIngredients(barId) {
    const id = barId ?? currentBarId.value
    if (!id) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('bar_id', id)
        .order('category')
        .order('name')

      if (error) throw error
      ingredients.value = data
      barInventory.value = new Set(
        data.filter(i => i.available).map(i => i.type)
      )
    } catch (err) {
      console.error('❌ Erreur fetchIngredients:', err)
    } finally {
      loading.value = false
    }
  }

  async function toggleIngredient(ingredientType) {
    const ingredient = ingredients.value.find(i => i.type === ingredientType)
    if (!ingredient) return
    const newAvailable = !ingredient.available
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: newAvailable })
        .eq('type', ingredientType)
        .eq('bar_id', currentBarId.value)

      if (error) throw error
      ingredient.available = newAvailable
      if (newAvailable) barInventory.value.add(ingredientType)
      else              barInventory.value.delete(ingredientType)
      barInventory.value = new Set(barInventory.value)
    } catch (err) {
      console.error('❌ Erreur toggleIngredient:', err)
    }
  }

  async function toggleCategory(categoryKey, select) {
    const categoryIngredients = ingredients.value.filter(i => i.category === categoryKey)
    if (!categoryIngredients.length) return
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: select })
        .eq('category', categoryKey)
        .eq('bar_id', currentBarId.value)

      if (error) throw error
      categoryIngredients.forEach(ing => {
        ing.available = select
        if (select) barInventory.value.add(ing.type)
        else        barInventory.value.delete(ing.type)
      })
      barInventory.value = new Set(barInventory.value)
    } catch (err) {
      console.error('❌ Erreur toggleCategory:', err)
    }
  }

  async function selectAll() {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: true })
        .eq('bar_id', currentBarId.value)

      if (error) throw error
      ingredients.value.forEach(i => i.available = true)
      barInventory.value = new Set(ingredients.value.map(i => i.type))
    } catch (err) {
      console.error('❌ Erreur selectAll:', err)
    }
  }

  async function deselectAll() {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: false })
        .eq('bar_id', currentBarId.value)

      if (error) throw error
      ingredients.value.forEach(i => i.available = false)
      barInventory.value = new Set()
    } catch (err) {
      console.error('❌ Erreur deselectAll:', err)
    }
  }

  function hasIngredient(type) { return barInventory.value.has(type) }

  return {
    barInventory,
    ingredients,
    loading,
    fetchIngredients,
    toggleIngredient,
    toggleCategory,
    selectAll,
    deselectAll,
    hasIngredient,
  }
}