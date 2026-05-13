import { computed } from 'vue'

export function useFilterCounts(cocktails, baseSpirits, liqueurFamilies) {
  // Un seul passage sur tous les cocktails pour compter les types d'ingrédients
  const typeCounts = computed(() => {
    const counts = {}
    cocktails.value.forEach(c => {
      c.recipe?.forEach(ing => {
        if (ing.Type) counts[ing.Type] = (counts[ing.Type] || 0) + 1
      })
    })
    return counts
  })

  const spiritCounts = computed(() => {
    const counts = {}
    baseSpirits.value.forEach(spirit => {
      const subKeys = spirit.subs?.map(s => s.key.toLowerCase()) ?? []
      const key     = spirit.key.toLowerCase()
      counts[spirit.key] = Object.entries(typeCounts.value)
        .filter(([t]) => t.toLowerCase() === key || subKeys.includes(t.toLowerCase()))
        .reduce((sum, [, n]) => sum + n, 0)
    })
    return counts
  })

  const liqueurCounts = computed(() => {
    const counts = {}
    liqueurFamilies.value.forEach(liqueur => {
      const key = liqueur.key.toLowerCase()
      counts[liqueur.key] = Object.entries(typeCounts.value)
        .filter(([t]) => t.toLowerCase().includes(key))
        .reduce((sum, [, n]) => sum + n, 0)
    })
    return counts
  })

  function getFilterCount(filterKey) {
    return (spiritCounts.value[filterKey] ?? 0) + (liqueurCounts.value[filterKey] ?? 0)
  }

  return { spiritCounts, liqueurCounts, getFilterCount }
}