// src/composables/useCatalogue.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const catalogue      = ref([])
const imported       = ref(new Set()) // catalogue_cocktail_ids importés par ce bar
const submitted      = ref(new Set()) // bar_cocktail_ids déjà soumis au catalogue
const loading        = ref(false)
const snapshotHashes = ref({})        // { [bar_cocktail_id]: recipe_hash }
const originMap      = ref({})        // { [bar_cocktail_id]: catalogue_cocktail_id (parent) }

// ── Hash ──────────────────────────────────────────────────────────────────────
const HASH_FIELDS = [
  'name', 'recipe', 'description', 'base_spirit', 'category',
  'glass', 'method', 'difficulty', 'abv', 'profile', 'season', 'tags',
]

async function hashCocktail(cocktail) {
  const payload = {}
  for (const field of HASH_FIELDS) {
    const val = cocktail[field]
    if (typeof val === 'string')  payload[field] = val.trim().toLowerCase()
    else if (val != null)         payload[field] = JSON.stringify(val)
    else                          payload[field] = null
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const buf   = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useCatalogue() {
  const { currentBarId } = useAuth()

  // ── Lecture catalogue global ───────────────────────────────────────────────
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

  // ── Chargement des états au boot ───────────────────────────────────────────
  // Remplace fetchImported() + fetchSubmitted() séparés.
  // Charge toutes les lignes catalogue_imports du bar en une seule requête,
  // peuple imported, submitted, snapshotHashes et originMap.
  // À appeler au boot (dans selectBar / onAuthSuccess) après fetchCocktails.
  async function fetchSnapshots() {
    const barId = currentBarId.value
    if (!barId) return

    const { data, error } = await supabase
      .from('catalogue_imports')
      .select('catalogue_cocktail_id, bar_cocktail_id, source_cocktail_id, recipe_hash')
      .eq('bar_id', barId)

    if (error) {
      console.error('❌ Erreur fetchSnapshots:', error)
      return
    }

    const rows = data || []

    // imported : uniquement les imports purs (source_cocktail_id null = pas une soumission)
    imported.value = new Set(
      rows.filter(r => r.source_cocktail_id == null).map(r => r.catalogue_cocktail_id)
    )

    // submitted : bar_cocktail_ids des soumissions (source_cocktail_id non null = soumission)
    submitted.value = new Set(
      rows.filter(r => r.source_cocktail_id != null).map(r => r.bar_cocktail_id).filter(Boolean)
    )

    // snapshotHashes + originMap : indexés par bar_cocktail_id
    const hashes  = {}
    const origins = {}
    for (const row of rows) {
      if (!row.bar_cocktail_id) continue
      if (row.recipe_hash)           hashes[row.bar_cocktail_id]  = row.recipe_hash
      if (row.catalogue_cocktail_id) origins[row.bar_cocktail_id] = row.catalogue_cocktail_id
    }
    snapshotHashes.value = hashes
    originMap.value      = origins
  }

  // Gardés pour compatibilité — délèguent à fetchSnapshots
  async function fetchImported()  { await fetchSnapshots() }
  async function fetchSubmitted() { await fetchSnapshots() }

  // ── Détection de modification ──────────────────────────────────────────────
  // Retourne true si le cocktail n'a pas de snapshot (création originale)
  // ou si son contenu a changé depuis le dernier snapshot.
  async function isModified(barCocktail) {
    const storedHash = snapshotHashes.value[barCocktail.id]
    if (!storedHash) return true
    const currentHash = await hashCocktail(barCocktail)
    return currentHash !== storedHash
  }

  // ── Import d'un cocktail catalogue dans le bar ────────────────────────────
  async function importCocktail(catalogueCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    const { id, bar_id, created_at, ...fields } = catalogueCocktail

    const { data, error } = await supabase
      .from('cocktails')
      .insert({ ...fields, bar_id: barId, catalogue_source_id: catalogueCocktail.id })
      .select()
      .single()

    if (error) return { success: false, error }

    const hash = await hashCocktail(catalogueCocktail)

    await supabase.from('catalogue_imports').insert({
      bar_id:                barId,
      catalogue_cocktail_id: catalogueCocktail.id,
      bar_cocktail_id:       data.id,   // ← FK canonique vers le cocktail bar créé
      source_cocktail_id:    null,       // null = import pur (pas encore soumis)
      recipe_hash:           hash,
    })

    // Mise à jour des états en mémoire
    imported.value       = new Set([...imported.value, catalogueCocktail.id])
    snapshotHashes.value = { ...snapshotHashes.value, [data.id]: hash }
    originMap.value      = { ...originMap.value, [data.id]: catalogueCocktail.id }

    return { success: true, data }
  }

  // ── Soumission d'un cocktail bar au catalogue global ──────────────────────
  // Crée une nouvelle entrée catalogue (fork si origine connue).
  // Bloqué si la recette n'a pas été modifiée depuis le dernier snapshot.
  async function submitToCatalogue(barCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    const modified = await isModified(barCocktail)
    if (!modified) return { success: false, error: 'unchanged' }

    const { id, bar_id, created_at, catalogue_source_id, ...fields } = barCocktail

    const { data: catalogueEntry, error } = await supabase
      .from('cocktails')
      .insert({ ...fields, bar_id: null })
      .select()
      .single()

    if (error) return { success: false, error }

    const hash = await hashCocktail(barCocktail)

    await supabase.from('catalogue_imports').insert({
      bar_id:                barId,
      catalogue_cocktail_id: catalogueEntry.id,
      bar_cocktail_id:       barCocktail.id,    // ← FK canonique vers le cocktail bar source
      source_cocktail_id:    barCocktail.id,    // gardé pour compat / RLS existantes
      recipe_hash:           hash,
      parent_catalogue_id:   originMap.value[barCocktail.id] ?? null,
    })

    submitted.value      = new Set([...submitted.value, barCocktail.id])
    snapshotHashes.value = { ...snapshotHashes.value, [barCocktail.id]: hash }

    return { success: true, data: catalogueEntry }
  }

  const isImported  = (id) => imported.value.has(id)
  const isSubmitted = (id) => submitted.value.has(id)

  return {
    catalogue, loading,
    fetchCatalogue,
    fetchSnapshots,   // ← à utiliser au boot
    fetchImported,    // compat
    fetchSubmitted,   // compat
    importCocktail, submitToCatalogue,
    isImported, isSubmitted, isModified,
  }
}