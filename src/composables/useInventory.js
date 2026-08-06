// composables/useInventory.js
// Gère le stock du bar — filtré par bar_id
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import ingredientsDatabase from '@/constants/ingredientsDatabase.json'

const barInventory = ref(new Set())
const ingredients  = ref([])
const loading      = ref(false)

export function useInventory() {
  const { currentBarId } = useAuth()

  async function fetchIngredients(barId) {
    const id = barId ?? currentBarId.value
    if (!id) {
      ingredients.value = []
      barInventory.value = new Set()
      return
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('bar_id', id)
        .order('category')
        .order('name')

      if (error) throw error

      const rows = Array.isArray(data) ? data : []
      ingredients.value = rows
      barInventory.value = new Set(
        rows.filter(i => isIngredientAvailable(i)).map(i => i.type)
      )
    } catch (err) {
      console.error('❌ Erreur fetchIngredients:', err)
    } finally {
      loading.value = false
    }
  }

  // Un ingrédient est "disponible" au sens stock si le type générique est
  // coché OU si au moins une référence précise est marquée disponible.
  function isIngredientAvailable(ingredient) {
    if (!ingredient) return false
    if (ingredient.available) return true
    return (ingredient.references || []).some(r => r.available)
  }

  function syncBarInventory(ingredient) {
    if (isIngredientAvailable(ingredient)) barInventory.value.add(ingredient.type)
    else                                    barInventory.value.delete(ingredient.type)
    barInventory.value = new Set(barInventory.value)
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
      syncBarInventory(ingredient)
    } catch (err) {
      console.error('❌ Erreur toggleIngredient:', err)
    }
  }

  async function updateIngredientPricing(ingredientType, patch) {
    // patch: { pricing_mode, bottle_price, bottle_volume_ml, price_per_ml }
    const { error } = await supabase
      .from('ingredients')
      .update(patch)
      .eq('type', ingredientType)
      .eq('bar_id', currentBarId.value)
    if (error) throw error
    const ing = ingredients.value.find(i => i.type === ingredientType)
    if (ing) Object.assign(ing, patch)
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
        if (isIngredientAvailable(ing)) barInventory.value.add(ing.type)
        else                            barInventory.value.delete(ing.type)
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
      barInventory.value = new Set(
        ingredients.value.filter(i => isIngredientAvailable(i)).map(i => i.type)
      )
    } catch (err) {
      console.error('❌ Erreur deselectAll:', err)
    }
  }

  function hasIngredient(type) { return barInventory.value.has(type) }

  // ── Références (bouteilles précises par type d'ingrédient) ──────────
  function genRefId() {
    return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)
  }

  async function addReference(ingredientType, { name, available = true, pricing_mode = 'bottle', bottle_price = null, bottle_volume_ml = null, price_per_ml = null, abv = null }) {
    const ingredient = ingredients.value.find(i => i.type === ingredientType)
    if (!ingredient || !name?.trim()) return

    const newRef = {
      id: genRefId(),
      name: name.trim(),
      available,
      is_default: (ingredient.references || []).length === 0,
      pricing_mode,
      bottle_price,
      bottle_volume_ml,
      price_per_ml,
      abv,
    }
    const nextReferences = [...(ingredient.references || []), newRef]

    const { error } = await supabase
      .from('ingredients')
      .update({ references: nextReferences })
      .eq('type', ingredientType)
      .eq('bar_id', currentBarId.value)

    if (error) throw error
    ingredient.references = nextReferences
    syncBarInventory(ingredient)
    return newRef
  }

  async function updateReference(ingredientType, referenceId, patch) {
    const ingredient = ingredients.value.find(i => i.type === ingredientType)
    if (!ingredient) return

    const nextReferences = (ingredient.references || []).map(r =>
      r.id === referenceId ? { ...r, ...patch } : r
    )

    const { error } = await supabase
      .from('ingredients')
      .update({ references: nextReferences })
      .eq('type', ingredientType)
      .eq('bar_id', currentBarId.value)

    if (error) throw error
    ingredient.references = nextReferences
    syncBarInventory(ingredient)
  }

  async function removeReference(ingredientType, referenceId) {
    const ingredient = ingredients.value.find(i => i.type === ingredientType)
    if (!ingredient) return

    const nextReferences = (ingredient.references || []).filter(r => r.id !== referenceId)

    const { error } = await supabase
      .from('ingredients')
      .update({ references: nextReferences })
      .eq('type', ingredientType)
      .eq('bar_id', currentBarId.value)

    if (error) throw error
    ingredient.references = nextReferences
    syncBarInventory(ingredient)
  }

  async function toggleReferenceAvailable(ingredientType, referenceId) {
    const ingredient = ingredients.value.find(i => i.type === ingredientType)
    if (!ingredient) return
    const ref = (ingredient.references || []).find(r => r.id === referenceId)
    if (!ref) return
    await updateReference(ingredientType, referenceId, { available: !ref.available })
  }

  // Références disponibles pour un type — utilisé par CocktailFormModal
  // pour proposer un select "Référence" optionnel.
  function getAvailableReferences(type) {
    const ingredient = ingredients.value.find(i => i.type === type)
    if (!ingredient) return []
    return (ingredient.references || []).filter(r => r.available)
  }

  async function addIngredient({ name, type: typeArg, category, family = null, abv = null, available = true }) {
    const barId = currentBarId.value
    if (!barId || !name?.trim()) return

    const resolvedType = typeArg?.trim() ||
      name.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

    if (ingredients.value.find(i => i.type === resolvedType)) {
      throw new Error('duplicate')
    }

    const { data, error } = await supabase
      .from('ingredients')
      .insert({
        bar_id:    barId,
        name:      name.trim(),
        type:      resolvedType,
        category,
        family:    family || null,
        abv:       abv ?? null,
        available,
      })
      .select()
      .single()

    if (error) throw error
    ingredients.value.push(data)
    if (available) {
      barInventory.value.add(resolvedType)
      barInventory.value = new Set(barInventory.value)
    }
  }

  // Initialiser les ingrédients par défaut pour un nouveau bar
  async function initializeDefaultIngredients(barId) {
    const targetBarId = barId ?? currentBarId.value
    if (!targetBarId) {
      throw new Error('Aucun bar ID fourni pour l’initialisation des ingrédients')
    }

    try {
      const { data: existingRows, error: fetchError } = await supabase
        .from('ingredients')
        .select('id')
        .eq('bar_id', targetBarId)
        .limit(1)

      if (fetchError) throw fetchError

      if (existingRows?.length) {
        await fetchIngredients(targetBarId)
        return { success: true }
      }

      const rows = ingredientsDatabase.map(ing => ({
        type: ing.type,
        name: ing.name,
        category: ing.category,
        family: ing.family,
        abv: ing.abv,
        pricing_mode: ing.pricing_mode ?? 'bottle',
        bottle_volume_ml: ing.bottle_volume_ml ?? null,
        bottle_price: ing.bottle_price ?? null,
        price_per_ml: ing.price_per_ml ?? null,
        bar_id: targetBarId,
        available: false,
      }))

      const batchSize = 100
      for (let index = 0; index < rows.length; index += batchSize) {
        const batch = rows.slice(index, index + batchSize)
        const { error } = await supabase
          .from('ingredients')
          .insert(batch)

        if (error) throw error
      }

      await fetchIngredients(targetBarId)
      return { success: true }
    } catch (err) {
      console.error('❌ Erreur initializeDefaultIngredients:', err)
      throw err
    }
  }

  return {
    barInventory,
    ingredients,
    loading,
    fetchIngredients,
    toggleIngredient,
    updateIngredientPricing,
    toggleCategory,
    selectAll,
    deselectAll,
    hasIngredient,
    addIngredient,
    initializeDefaultIngredients,
    addReference,
    updateReference,
    removeReference,
    toggleReferenceAvailable,
    getAvailableReferences,
  }
}