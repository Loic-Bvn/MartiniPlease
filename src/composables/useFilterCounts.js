import { computed } from 'vue'

export function useFilterCounts(cocktails, baseSpirits, liqueurFamilies) {
  // Counts for each spirit family
  const spiritCounts = computed(() => {
    const counts = {}
    baseSpirits.value.forEach(spirit => {
      counts[spirit.key] = cocktails.value.filter(c =>
        c.recipe && c.recipe.some(ing =>
          ing.Type?.toLowerCase() === spirit.key.toLowerCase() ||
          spirit.subs?.some(sub => ing.Type?.toLowerCase() === sub.key)
        )
      ).length
    })
    return counts
  })

  // Counts for liqueur families
  const liqueurCounts = computed(() => {
    const counts = {}
    liqueurFamilies.value.forEach(liqueur => {
      counts[liqueur.key] = cocktails.value.filter(c =>
        c.recipe && c.recipe.some(ing =>
          ing.Type?.toLowerCase().includes(liqueur.key.toLowerCase())
        )
      ).length
    })
    return counts
  })

  // Get count for a specific filter
  function getFilterCount(filterKey) {
    return (spiritCounts.value[filterKey] ?? 0) + (liqueurCounts.value[filterKey] ?? 0)
  }

  return {
    spiritCounts,
    liqueurCounts,
    getFilterCount,
  }
}
