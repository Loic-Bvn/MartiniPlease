// src/composables/useCatalog.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const catalog      = ref([])
const imported       = ref(new Set()) // catalog_cocktail_ids importés par ce bar
const submitted      = ref(new Set()) // bar_cocktail_ids déjà soumis au catalog
const loading        = ref(false)
const snapshotHashes = ref({})        // { [bar_cocktail_id]: recipe_hash }
const originMap      = ref({})        // { [bar_cocktail_id]: catalog_cocktail_id (parent) }

// ── Hash ──────────────────────────────────────────────────────────────────────
const HASH_FIELDS = [
  'name', 'recipe', 'description', 'base_spirit', 'category',
  'glass', 'method', 'difficulty', 'abv', 'profile', 'season', 'tags',
]

// todo DELETE: Useless
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
export function useCatalog() {
  const { currentBarId } = useAuth()

  // ── Lecture catalog global ───────────────────────────────────────────────
  async function fetchCatalog({ search = '', spirit = '', season = '' } = {}) {
    loading.value = true
    try {
      let query = supabase
        .from('cocktail_catalog')  // ✅ Fix 1 : bonne table
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

  // ── Chargement des états au boot ───────────────────────────────────────────
  // Remplace fetchImported() + fetchSubmitted() séparés.
  // peuple imported, submitted, snapshotHashes et originMap.
  // À appeler au boot (dans selectBar / onAuthSuccess) après fetchCocktails.
  // async function fetchSnapshots() {
  //   const barId = currentBarId.value
  //   if (!barId) return

  //   // imported.value = new Set(
  //   //   rows.filter(r => r.source_cocktail_id == null).map(r => r.catalog_cocktail_id)
  //   // )

  //   submitted.value = new Set(
  //     rows.filter(r => r.source_cocktail_id != null).map(r => r.bar_cocktail_id).filter(Boolean)
  //   )

  //   const hashes  = {}
  //   const origins = {}
  //   for (const row of rows) {
  //     if (!row.bar_cocktail_id) continue
  //     if (row.recipe_hash)          hashes[row.bar_cocktail_id]  = row.recipe_hash
  //     // if (row.catalog_cocktail_id)  origins[row.bar_cocktail_id] = row.catalog_cocktail_id
  //   }
  //   snapshotHashes.value = hashes
  //   originMap.value      = origins
  // }

  // Gardés pour compatibilité — délèguent à fetchSnapshots
  // async function fetchImported()  { await fetchSnapshots() }
  // async function fetchSubmitted() { await fetchSnapshots() }

  // ── Détection de modification ──────────────────────────────────────────────
  // Retourne true si le cocktail n'a pas de snapshot (création originale)
  // ou si son contenu a changé depuis le dernier snapshot.
  // async function isModified(barCocktail) {
  //   const storedHash = snapshotHashes.value[barCocktail.id]
  //   if (!storedHash) return true
  //   const currentHash = await hashCocktail(barCocktail)
  //   return currentHash !== storedHash
  // }

  // ── Import d'un cocktail catalog dans le bar ────────────────────────────
  async function importCocktail(catalogCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    const { id, created_at, ...fields } = catalogCocktail

    // 1. Création du cocktail dans le bar
    const { data, error } = await supabase
      .from('cocktails')
      .insert({
        ...fields,
        bar_id: barId,
        submitted_by_bar_id: id
        // catalog_cocktail_id: catalogCocktail.id // 🔥 lien vers catalog
      })
      .select()
      .single()

    if (error) {
      console.error('Import cocktail error:', error)
      return { success: false, error }
    }

    // // 2. Hash snapshot
    // const hash = await hashCocktail(catalogCocktail)

    // // 3. Création du lien d'import
    // const { error: importError } = await supabase
    //   .from('catalog_imports') // ✅ BONNE TABLE
    //   .insert({
    //     bar_id: barId,
    //     // catalog_cocktail_id: catalogCocktail.id,
    //     bar_cocktail_id: data.id,
    //     source_cocktail_id: null,
    //     recipe_hash: hash,
    //   })

    // if (importError) {
    //   console.error('Import link error:', importError)
    //   return { success: false, error: importError }
    // }

    // 4. State local
    imported.value = new Set([...imported.value, catalogCocktail.id])

    // snapshotHashes.value = {
    //   ...snapshotHashes.value,
    //   [data.id]: hash
    // }

    // originMap.value = {
    //   ...originMap.value,
    //   [data.id]: catalogCocktail.id
    // }

    return { success: true, data }
  }

  // ── Soumission d'un cocktail bar au catalog global ──────────────────────
  // Crée une nouvelle entrée catalog (fork si origine connue).
  // Bloqué si la recette n'a pas été modifiée depuis le dernier snapshot.
  async function submitToCatalog(barCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    // Todo: comparer le cocktail actuel avec le snapshot pour éviter les soumissions redondantes.
    // const modified = await isModified(barCocktail)
    // if (!modified) return { success: false, error: 'unchanged' }

    const { id, bar_id, created_at, ...fields } = barCocktail

    const cleanedFields = {
      ...Object.fromEntries(
        Object.entries(fields).filter(([_, v]) => {
          if (v === null || v === "") return false
          if (Array.isArray(v) && v.length === 0) return false
          return true
        })
      ),
      // catalog_cocktail_id: barId // 🔥 CRUCIAL
    }

    const { data: catalogEntry, error } = await supabase
      .from('cocktail_catalog')
      .insert(cleanedFields)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return { success: false, error }
    }

    const hash = await hashCocktail(barCocktail)

    // await supabase.from('cocktail_catalog').insert({
    //   bar_id: barId,
    //   // catalog_cocktail_id: catalogEntry.id,
    //   bar_cocktail_id: barCocktail.id,
    //   // source_cocktail_id: barCocktail.id,
    //   recipe_hash: hash,
    //   // parent_catalog_id: originMap.value[barCocktail.id] ?? null,
    // })

    submitted.value = new Set([...submitted.value, barCocktail.id])
    snapshotHashes.value = { ...snapshotHashes.value, [barCocktail.id]: hash }

    return { success: true, data: catalogEntry }
  }

  // function cleanFields(fields) {
  //   const cleaned = {}

  //   for (const [key, value] of Object.entries(fields)) {
  //     if (value === "" || value === null) continue
  //     if (Array.isArray(value) && value.length === 0) continue
  //     cleaned[key] = value
  //   }

  //   return cleaned
  // }

  // Dans useCtalog.js — à ajouter dans le return
  function removeFromImported(barCocktailId) {
    // Retrouver le catalog_cocktail_id associé à ce bar_cocktail_id
    const catalogId = originMap.value[barCocktailId]
    if (catalogId) {
      const next = new Set(imported.value)
      next.delete(catalogId)
      imported.value = next
    }
    // Nettoyer les maps
    const newHashes = { ...snapshotHashes.value }
    const newOrigins = { ...originMap.value }
    delete newHashes[barCocktailId]
    delete newOrigins[barCocktailId]
    snapshotHashes.value = newHashes
    originMap.value = newOrigins
  }

  const isImported  = (id) => imported.value.has(id)
  const isSubmitted = (id) => submitted.value.has(id)

  return {
    catalog, loading,
    fetchCatalog,
    // fetchSnapshots,   // ← à utiliser au boot
    // fetchImported,    // compat
    // fetchSubmitted,   // compat
    importCocktail, submitToCatalog, useCatalog,
    isImported, isSubmitted, 
    // isModified,
    removeFromImported,
  }
}