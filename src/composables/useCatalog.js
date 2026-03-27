// src/composables/useCatalog.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const catalog        = ref([])
const imported       = ref(new Set()) // catalog IDs importés par ce bar
const submitted      = ref(new Set()) // bar cocktail IDs déjà soumis au catalog
const loading        = ref(false)
const snapshotHashes = ref({})        // { [bar_cocktail_id]: recipe_hash }
const originMap      = ref({})        // { [bar_cocktail_id]: catalog_cocktail_id (parent) }

// ── Champs inclus dans le hash de comparaison ─────────────────────────────────
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

// ── Champs à exclure lors d'un transfert entre tables ────────────────────────
function stripBarFields(cocktail) {
  const { id, bar_id, created_at, submitted_by_bar_id, ...fields } = cocktail
  return fields
}

function stripCatalogFields(cocktail) {
  const { id, created_at, submitted_by_bar_id, ...fields } = cocktail
  return fields
}

function omitEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === null || v === '') return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    })
  )
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useCatalog() {
  const { currentBarId } = useAuth()

  // ── Lecture du catalog global ─────────────────────────────────────────────
  async function fetchCatalog({ search = '', spirit = '', season = '' } = {}) {
    loading.value = true
    try {
      let query = supabase
        .from('cocktail_catalog')
        .select('*')
        .order('name')

      if (search) query = query.ilike('name', `%${search}%`)
      if (spirit) query = query.eq('base_spirit', spirit)
      if (season) query = query.contains('season', [season])

      const { data, error } = await query
      if (error) throw error
      catalog.value = data
    } finally {
      loading.value = false
    }
  }

  // ── Import d'un cocktail du catalog dans le bar ───────────────────────────
  // Copie les champs métier du catalog dans la table cocktails, en liant
  // submitted_by_bar_id → cocktail_catalog.id pour tracer l'origine.
  async function importCocktail(catalogCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    const { data, error } = await supabase
      .from('cocktails')
      .insert({
        ...stripCatalogFields(catalogCocktail),
        bar_id: barId,
        submitted_by_bar_id: catalogCocktail.id, // FK → cocktail_catalog.id
      })
      .select()
      .single()

    if (error) {
      console.error('❌ importCocktail:', error)
      return { success: false, error }
    }

    // Mise à jour des états locaux
    imported.value = new Set([...imported.value, catalogCocktail.id])
    originMap.value = { ...originMap.value, [data.id]: catalogCocktail.id }

    const hash = await hashCocktail(catalogCocktail)
    snapshotHashes.value = { ...snapshotHashes.value, [data.id]: hash }

    return { success: true, data }
  }

  // ── Soumission d'un cocktail bar au catalog global ────────────────────────
  // Bloque si la recette est identique au dernier snapshot (pas de fork inutile).
  async function submitToCatalog(barCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    const modified = await isModified(barCocktail)
    if (!modified) return { success: false, error: 'unchanged' }

    // On exclut tous les champs liés à la table cocktails (bar_id, submitted_by_bar_id…)
    // pour insérer uniquement les champs métier dans cocktail_catalog.
    const payload = omitEmpty(stripBarFields(barCocktail))

    const { data: catalogEntry, error } = await supabase
      .from('cocktail_catalog')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('❌ submitToCatalog:', error)
      return { success: false, error }
    }

    // Mise à jour des états locaux
    submitted.value = new Set([...submitted.value, barCocktail.id])
    const hash = await hashCocktail(barCocktail)
    snapshotHashes.value = { ...snapshotHashes.value, [barCocktail.id]: hash }
    originMap.value = { ...originMap.value, [barCocktail.id]: catalogEntry.id }

    return { success: true, data: catalogEntry }
  }

  // ── Détection de modification ─────────────────────────────────────────────
  // Retourne true si le cocktail n'a pas de snapshot OU si son contenu a changé.
  async function isModified(barCocktail) {
    const storedHash = snapshotHashes.value[barCocktail.id]
    if (!storedHash) return true
    const currentHash = await hashCocktail(barCocktail)
    return currentHash !== storedHash
  }

  // ── Suppression locale d'un import ───────────────────────────────────────
  function removeFromImported(barCocktailId) {
    const catalogId = originMap.value[barCocktailId]
    if (catalogId) {
      const next = new Set(imported.value)
      next.delete(catalogId)
      imported.value = next
    }
    const newHashes  = { ...snapshotHashes.value }
    const newOrigins = { ...originMap.value }
    delete newHashes[barCocktailId]
    delete newOrigins[barCocktailId]
    snapshotHashes.value = newHashes
    originMap.value      = newOrigins
  }

  const isImported  = (id) => imported.value.has(id)
  const isSubmitted = (id) => submitted.value.has(id)

  return {
    catalog,
    loading,
    fetchCatalog,
    importCocktail,
    submitToCatalog,
    isImported,
    isSubmitted,
    isModified,
    removeFromImported,
  }
}