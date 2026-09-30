import { computed } from 'vue'

function profileList(cocktail) {
  return Array.isArray(cocktail?.profile) ? cocktail.profile : []
}

function similarityScore(source, candidate) {
  if (!source || source.id === candidate.id) return 0

  const sharedProfiles = profileList(source).filter(profile => profileList(candidate).includes(profile)).length
  const sameSpirit = source.base_spirit && source.base_spirit === candidate.base_spirit

  return sharedProfiles * 3 + (sameSpirit ? 2 : 0)
}

export function useCocktailRecommendations({ cocktails, favorites, history }) {
  const favoriteCocktails = computed(() =>
    cocktails.value.filter(cocktail => favorites.value.has(cocktail.id))
  )

  const recommendations = computed(() => {
    const favoriteIds = favorites.value
    const orderedIds = new Set(history.value.map(entry => entry.cocktail_id))
    const scores = new Map()

    favoriteCocktails.value.forEach(favorite => {
      cocktails.value.forEach(candidate => {
        if (favoriteIds.has(candidate.id) || orderedIds.has(candidate.id)) return
        const score = similarityScore(favorite, candidate)
        if (score > 0) scores.set(candidate.id, (scores.get(candidate.id) || 0) + score)
      })
    })

    return cocktails.value
      .filter(cocktail => scores.has(cocktail.id))
      .sort((a, b) => scores.get(b.id) - scores.get(a.id) || a.name.localeCompare(b.name))
      .slice(0, 4)
  })

  return { recommendations }
}