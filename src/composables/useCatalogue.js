// src/composables/useCatalogue.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const catalogue   = ref([])
const imported    = ref(new Set()) // IDs catalogue déjà importés par ce bar
const submitted   = ref(new Set()) // IDs bar déjà soumis au catalogue
const loading     = ref(false)

export function useCatalogue() {
  const { currentBarId } = useAuth()

  async function fetchCatalogue({ search = '', spirit = '', season = '' } = {}) {
    loading.value = true
    try {
      let query = supabase
        .from('cocktails')
        .select('*')
        .is('bar_id', null)
        .order('name')

      if (search) query = query.ilike('name', `%${search}%`)
      if (spirit) query = query.eq('base_spirit', spirit)
      if (season) query = query.contains('season', [season])

      const { data, error } = await query
      if (error) throw error
      catalogue.value = data
    } finally {
      loading.value = false
    }
  }

  // IDs du catalogue déjà importés par ce bar → badge "Déjà importé"
  async function fetchImported() {
    const barId = currentBarId.value
    if (!barId) return
    const { data } = await supabase
      .from('catalogue_imports')
      .select('catalogue_cocktail_id')
      .eq('bar_id', barId)

    imported.value = new Set((data || []).map(r => r.catalogue_cocktail_id))
  }

  // IDs des cocktails du bar déjà soumis → badge "Déjà proposé"
  async function fetchSubmitted() {
    const barId = currentBarId.value
    if (!barId) return
    const { data } = await supabase
      .from('catalogue_imports')
      .select('source_cocktail_id')
      .eq('source_bar_id', barId)
      .not('source_cocktail_id', 'is', null)

    submitted.value = new Set((data || []).map(r => r.source_cocktail_id))
  }

  // Importer un cocktail du catalogue dans le bar courant
  async function importCocktail(catalogueCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    const { id, bar_id, ...fields } = catalogueCocktail
    const { data, error } = await supabase
      .from('cocktails')
      .insert({ ...fields, bar_id: barId })
      .select()
      .single()

    if (error) return { success: false, error }

    await supabase.from('catalogue_imports').insert({
      bar_id:                barId,
      catalogue_cocktail_id: catalogueCocktail.id,
    })

    imported.value = new Set([...imported.value, catalogueCocktail.id])
    return { success: true, data }
  }

  // Proposer un cocktail du bar au catalogue
  async function submitToCatalogue(barCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    const { id, bar_id, ...fields } = barCocktail
    const { data: catalogueEntry, error } = await supabase
      .from('cocktails')
      .insert({ ...fields, bar_id: null })
      .select()
      .single()

    if (error) return { success: false, error }

    // Tracer la source pour éviter les doublons et afficher "Déjà proposé"
    await supabase.from('catalogue_imports').insert({
      bar_id:                barId,
      catalogue_cocktail_id: catalogueEntry.id,
      source_cocktail_id:    barCocktail.id,
    })

    submitted.value = new Set([...submitted.value, barCocktail.id])
    return { success: true }
  }

  const isImported  = (id) => imported.value.has(id)
  const isSubmitted = (id) => submitted.value.has(id)

  return {
    catalogue, loading,
    fetchCatalogue, fetchImported, fetchSubmitted,
    importCocktail, submitToCatalogue,
    isImported, isSubmitted,
  }
}