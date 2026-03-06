// composables/useInventory.js
// Gère le stock du bar — lit et écrit dans Supabase
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

const barInventory = ref(new Set()) // Set de `type` disponibles (ex: "bourbon", "gin")
const ingredients = ref([])         // Liste complète des ingrédients depuis Supabase
const loading = ref(false)

export function useInventory() {

  // Charger tous les ingrédients depuis Supabase
  async function fetchIngredients() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error

      ingredients.value = data

      // Reconstruire le Set des ingrédients disponibles
      barInventory.value = new Set(
        data.filter(i => i.available).map(i => i.type)
      )
    } catch (err) {
      console.error('❌ Erreur fetchIngredients:', err)
    } finally {
      loading.value = false
    }
  }

  // Basculer la disponibilité d'un ingrédient
  async function toggleIngredient(ingredientType) {
    const ingredient = ingredients.value.find(i => i.type === ingredientType)
    if (!ingredient) return

    const newAvailable = !ingredient.available

    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: newAvailable })
        .eq('type', ingredientType)

      if (error) throw error

      // Mettre à jour localement
      ingredient.available = newAvailable
      if (newAvailable) {
        barInventory.value.add(ingredientType)
      } else {
        barInventory.value.delete(ingredientType)
      }
      barInventory.value = new Set(barInventory.value) // Forcer réactivité

    } catch (err) {
      console.error('❌ Erreur toggleIngredient:', err)
    }
  }

  // Tout sélectionner / désélectionner dans une catégorie
  async function toggleCategory(categoryKey, select) {
    const categoryIngredients = ingredients.value.filter(i => i.category === categoryKey)
    if (!categoryIngredients.length) return

    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: select })
        .eq('category', categoryKey)

      if (error) throw error

      // Mettre à jour localement
      categoryIngredients.forEach(ing => {
        ing.available = select
        if (select) {
          barInventory.value.add(ing.type)
        } else {
          barInventory.value.delete(ing.type)
        }
      })
      barInventory.value = new Set(barInventory.value)

    } catch (err) {
      console.error('❌ Erreur toggleCategory:', err)
    }
  }

  // Tout sélectionner
  async function selectAll() {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: true })
        .neq('type', '') // met à jour toutes les lignes

      if (error) throw error

      ingredients.value.forEach(i => i.available = true)
      barInventory.value = new Set(ingredients.value.map(i => i.type))
    } catch (err) {
      console.error('❌ Erreur selectAll:', err)
    }
  }

  // Tout désélectionner
  async function deselectAll() {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ available: false })
        .neq('type', '')

      if (error) throw error

      ingredients.value.forEach(i => i.available = false)
      barInventory.value = new Set()
    } catch (err) {
      console.error('❌ Erreur deselectAll:', err)
    }
  }

  function hasIngredient(type) {
    return barInventory.value.has(type)
  }

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
