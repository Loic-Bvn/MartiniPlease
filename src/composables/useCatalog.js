// src/composables/useCatalog.js
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { validateCocktail } from '@/composables/useDataValidator'
import { useToast } from '@/composables/useToast'
import { track } from '@/lib/analytics'

const catalog        = ref([])
const imported       = ref(new Set()) // catalog IDs importés par ce bar
const submitted      = ref(new Set()) // bar cocktail IDs déjà soumis au catalog
const loading        = ref(false)
const snapshotHashes = ref({})        // { [bar_cocktail_id]: recipe_hash }
const originMap      = ref({})        // { [bar_cocktail_id]: catalog_cocktail_id (parent) }
let fetchToken = 0                    // ignore les réponses périmées si un fetch plus récent a été lancé entre-temps

// ── Champs inclus dans le hash de comparaison ─────────────────────────────────
const HASH_FIELDS = [
  'name', 'recipe', 'description', 'base_spirit', 'category',
  'glass', 'method', 'difficulty', 'abv', 'profile', 'season', 'tags',
]

async function hashCocktail(cocktail) {
  const payload = {}
  for (const field of HASH_FIELDS) {
    const val = cocktail[field]

    if (typeof val === 'string') {
      payload[field] = val.trim().toLowerCase()
    } else if (val != null) {
      try {
        payload[field] = JSON.stringify(val)
      } catch (e) {
        console.warn('⚠️ stringify failed for field:', field, val)
        payload[field] = null
      }
    } else {
      payload[field] = null
    }
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const buf   = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Champs à exclure lors d'un transfert entre tables ────────────────────────
function stripBarFields(cocktail) {
  const {
    id,
    bar_id,
    catalog_id,
    is_private,
    created_at,
    submitted_by_bar_id,
    submitted_by_bar_name,
    ...fields
  } = cocktail

  return fields
}

function stripCatalogFields(cocktail) {
  const { id, created_at, submitted_by_bar_id, submitted_by_bar_name, bars, ...fields } = cocktail
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
  const { toastError }   = useToast()

  // ── Lecture du catalog global ─────────────────────────────────────────────
  async function fetchCatalog({ search = '', spirit = '', cocktailStyle = '', profiles = [] } = {}) {
    const token = ++fetchToken
    loading.value = true
    try {
      let query = supabase
        .from('cocktails_catalog')
        .select('*')
        .order('name')

      if (search) query = query.ilike('name', `%${search}%`)
      if (spirit) query = query.eq('base_spirit', spirit)
      if (cocktailStyle) query = query.eq('cocktail_style', cocktailStyle)
      if (profiles.length > 0) query = query.overlaps('profile', profiles)

      const { data, error } = await query
      if (error) throw error

      // Une requête plus récente a été lancée entre-temps (filtre changé
      // rapidement) → on jette ce résultat périmé plutôt que d'écraser
      // catalog.value avec une réponse qui ne correspond plus aux filtres actuels
      if (token !== fetchToken) return

      catalog.value = data || []
    } catch (err) {
      console.error('❌ fetchCatalog:', err)
      if (token === fetchToken) {
        toastError('Impossible de charger le catalogue. Réessaie ou recharge la page.')
      }
    } finally {
      if (token === fetchToken) loading.value = false
    }
  }

  async function importCocktail(catalogCocktail) {
    const barId = currentBarId.value
    if (!barId) return { success: false, error: 'Non connecté' }

    try {
      const strippedData = stripCatalogFields(catalogCocktail)
      const validated = validateCocktail(strippedData)

      const { data, error } = await supabase
        .from('bar_cocktails')
        .insert({
          ...validated,
          bar_id: barId,
          catalog_id: catalogCocktail.id,
        })
        .select()
        .single()

      if (error) throw error

      imported.value = new Set([
        ...imported.value,
        catalogCocktail.id
      ])

      originMap.value = {
        ...originMap.value,
        [data.id]: catalogCocktail.id
      }

      const hash = await hashCocktail(catalogCocktail)

      snapshotHashes.value = {
        ...snapshotHashes.value,
        [data.id]: hash
      }

      return {
        success: true,
        data
      }

    } catch (err) {
      console.error('❌ importCocktail:', err)
      return {
        success: false,
        error: err.message || err
      }
    }
  }


  async function submitToCatalog(barCocktail) {
    const barId = currentBarId.value

    if (!barId) {
      return { success: false, error: 'Non connecté' }
    }

    try {
      // Vérifie si la recette a changé depuis son dernier import/publication
      const modified = await isModified(barCocktail)
      if (!modified) {
        return {
          success: false,
          error: 'unchanged'
        }
      }

      // Nettoyage des champs propres au bar
      const strippedData = stripBarFields(barCocktail)

      // Validation
      const validated = validateCocktail(strippedData)

      // Supprime les valeurs vides
      const payload = omitEmpty(validated)

      /*
        Publication dans le catalogue

        Cas 1 :
        - cocktail créé par le bar
        - catalog_id null
        => nouvelle recette publique

        Cas 2 :
        - cocktail importé du catalogue
        - catalog_id existant
        => nouvelle version publique
          (ancien cocktail conservé)
      */
      const { data: catalogEntry, error } = await supabase
        .from('cocktails_catalog')
        .insert({
          ...payload,
          submitted_by_bar_id: barId
        })
        .select()
        .single()

      if (error) throw error


      /*
        Mise à jour du cocktail du bar :
        - il n'est plus privé
        - il pointe vers sa version catalogue actuelle
        - on trace qui l'a soumis
      */
      const { error: updateError } = await supabase
        .from('bar_cocktails')
        .update({
          catalog_id: catalogEntry.id,
          is_private: false,
          submitted_by_bar_id: barId
        })
        .eq('id', barCocktail.id)

      if (updateError) throw updateError


      // Mise à jour cache local
      submitted.value = new Set([
        ...submitted.value,
        barCocktail.id
      ])

      const hash = await hashCocktail(barCocktail)

      snapshotHashes.value = {
        ...snapshotHashes.value,
        [barCocktail.id]: hash
      }


      track('cocktail_created', { barId })

      return {
        success: true,
        data: catalogEntry
      }


    } catch (err) {
      console.error('❌ submitToCatalog:', err)

      return {
        success: false,
        error: err.message || err
      }
    }
  }

  // ── Détection de modification ─────────────────────────────────────────────
  // Retourne true si le cocktail n'a pas de snapshot OU si son contenu a changé.
  async function isModified(barCocktail) {
    const isPrivate = barCocktail.is_private
    // const storedHash = snapshotHashes.value[barCocktail.id]
    // if (!storedHash) return true
    // const currentHash = await hashCocktail(barCocktail)
    // return currentHash !== storedHash
    return isPrivate
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