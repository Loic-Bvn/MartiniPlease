// composables/useFilters.js
import { computed } from 'vue'
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'

export function useFilters(props, emit) {

  function isMakeable(cocktail) {
    const recipe = cocktail.recipe || []
    if (!recipe.length) return false
    return recipe.every(ing => ing.Type === 'garnish' || props.barInventory.has(ing.Type))
  }

  const makeableCount = computed(() => props.cocktails.filter(isMakeable).length)

  const filteredCocktails = computed(() => {
    let list = [...props.cocktails]

    if (props.searchTerm?.trim()) {
      const s = props.searchTerm.toLowerCase().trim()
      list = list.filter(c =>
        c.name?.toLowerCase().includes(s) ||
        c.recipe?.some(ing => ing.Ingredient?.toLowerCase().includes(s)) ||
        c.creator?.toLowerCase().includes(s) ||
        c.profile?.some(p => p.toLowerCase().includes(s))
      )
    }

    if (props.selectedFamilies.length || props.selectedSubSpirits.length) {
      list = list.filter(c => {
        if (props.filterMode === 'main') {
          const familyMatch = !props.selectedFamilies.length || props.selectedFamilies.includes(c.category)
          const subMatch    = !props.selectedSubSpirits.length || props.selectedSubSpirits.includes(c.base_spirit)
          return familyMatch && subMatch
        } else {
          const recipeTypes = (c.recipe || []).map(ing => ing.Type)
          if (props.selectedSubSpirits.length)
            return props.selectedSubSpirits.some(sub => recipeTypes.includes(sub))
          return props.selectedFamilies.some(family => {
            // On reconstruit les subs à la volée depuis les keys connues
            // ou on peut passer baseSpirits en param si besoin
            return recipeTypes.includes(family.toLowerCase())
          })
        }
      })
    }

    if (props.selectedSeasons.length)
      list = list.filter(c =>
        Array.isArray(c.season)
          ? c.season.some(s => props.selectedSeasons.includes(s))
          : props.selectedSeasons.includes(c.season)
      )

    if (props.showOnlyMakeable) list = list.filter(isMakeable)

    if (props.abvFilter === 'mocktail')
      list = list.filter(c => c.abv === 0 || c.abv === null)
    else if (props.abvFilter === 'low')
      list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)

    if (props.selectedProfiles.length)
      list = list.filter(c => props.selectedProfiles.every(p => c.profile?.includes(p)))

    if (props.selectedStyles.length)
      list = list.filter(c => props.selectedStyles.includes(c.cocktail_style))

    if (props.showOnlyFavorites && props.hasDrinker)
      list = list.filter(c => props.favorites.has(c.id))

    return list
  })

  const hasActiveFilters = computed(() =>
    props.selectedFamilies.length > 0 ||
    props.selectedSubSpirits.length > 0 ||
    props.selectedSeasons.length > 0 ||
    props.selectedProfiles.length > 0 ||
    props.abvFilter !== null ||
    props.showOnlyFavorites ||
    props.selectedStyles.length > 0
  )

  function toggleFamily(key)    { emit('toggle-family', key) }
  function clearFilters()       { emit('clear-filters') }

  const activeSubSpirits = computed(() => {
    const subs = []
    for (const family of props.baseSpirits || []) {
      if (props.selectedFamilies.includes(family.key) && family.subs?.length) {
        subs.push(...family.subs)
      }
    }
    return subs
  })

  const allFamilyLabels = computed(() => Object.fromEntries([
    ...(props.baseSpirits || []).map(s => [s.key, s.label]),
    ...(props.liqueurFamilies || []).map(l => [l.key, l.label]),
    ...(props.profileFilters || []).map(p => [p.key, p.label]),
    ...(props.styleFilters || []).map(s => [s.key, s.label]),
  ]))

  return {
    makeableCount, filteredCocktails, hasActiveFilters,
    toggleFamily, clearFilters,
  }
}