import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { getFamilyLabel } from '@/constants/typeLabels'

const familyCache = ref({})
const loading = ref(false)
const error = ref(null)
let fetchPromise = null

function toLabel(familyKey, locale = 'fr') {
  const key = String(familyKey || '').trim()
  if (!key) return ''

  const translated = getFamilyLabel(key, locale)
  if (translated && translated !== 'Indisponible' && translated !== 'Unavailable') {
    return translated
  }

  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, ch => ch.toUpperCase())
}

export async function fetchIngredientFamilies() {
  if (fetchPromise) return fetchPromise

  loading.value = true
  error.value = null

  fetchPromise = (async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('ingredient_types')
        .select('category, family')
        .not('family', 'is', null)

      if (dbError) throw dbError

      const grouped = {}
      for (const row of data || []) {
        const category = String(row.category || '').trim()
        const family = String(row.family || '').trim()
        if (!category || !family) continue
        if (!grouped[category]) grouped[category] = new Set()
        grouped[category].add(family)
      }

      const nextCache = {}
      for (const [category, families] of Object.entries(grouped)) {
        nextCache[category] = [...families]
          .sort((a, b) => a.localeCompare(b, 'fr'))
          .map(family => ({
            key: family,
            label: toLabel(family, 'fr'),
          }))
      }

      familyCache.value = nextCache
      return nextCache
    } catch (err) {
      console.error('❌ Erreur fetchIngredientFamilies:', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
      fetchPromise = null
    }
  })()

  return fetchPromise
}

export function getIngredientFamiliesForCategory(categoryKey, locale = 'fr') {
  const families = familyCache.value[categoryKey] || []
  return families.map(item => ({
    key: item.key,
    label: getFamilyLabel(item.key, locale) !== 'Indisponible' && getFamilyLabel(item.key, locale) !== 'Unavailable'
      ? getFamilyLabel(item.key, locale)
      : item.label || toLabel(item.key, locale),
  }))
}

export function useIngredientFamilies() {
  async function ensureLoaded() {
    if (!Object.keys(familyCache.value).length) {
      await fetchIngredientFamilies()
    }
  }

  return {
    familyCache,
    loading,
    error,
    fetchIngredientFamilies,
    ensureLoaded,
    getFamilyOptions: getIngredientFamiliesForCategory,
  }
}
