// composables/useSimilarCocktails.js
// Ranks bar cocktails by similarity to a given cocktail
import { computed, toValue } from 'vue'

// Tunable weights
const WEIGHTS = { profile: 4, spirit: 3, ingredient: 2, style: 1, method: 1 }
const MIN_SCORE = 8 // below this, a match is too weak to show
const SUGGESTION_LIMIT = 4 // max number of cocktail suggestions to show

function profileList(c) {
  return Array.isArray(c?.profile) ? c.profile : []
}

// Recipe ingredient keys, without garnish
function ingredientSet(c) {
  return new Set(
    (c?.recipe || []).map(i => i.Ingredient).filter(i => i && i !== 'garnish')
  )
}

function hasValue(v) {
  return !!v && v !== 'Unknown'
}

export function scoreSimilarity(source, candidate) {
  if (!source || !candidate || source.id === candidate.id) return 0

  let score = 0

  const candProfiles = profileList(candidate)
  score += profileList(source).filter(p => candProfiles.includes(p)).length * WEIGHTS.profile

  if (hasValue(source.base_spirit) && source.base_spirit === candidate.base_spirit) {
    score += WEIGHTS.spirit
  }

  // Shared ingredients (base spirit excluded to avoid double counting)
  const candIngredients = ingredientSet(candidate)
  for (const ing of ingredientSet(source)) {
    if (ing !== source.base_spirit && candIngredients.has(ing)) score += WEIGHTS.ingredient
  }

  if (hasValue(source.cocktail_style) && source.cocktail_style === candidate.cocktail_style) {
    score += WEIGHTS.style
  }
  if (hasValue(source.method) && source.method === candidate.method) {
    score += WEIGHTS.method
  }

  return score
}

// cocktail / cocktails can be refs, getters or plain values
export function useSimilarCocktails(cocktail, cocktails, limit = SUGGESTION_LIMIT) {
  return computed(() => {
    const source = toValue(cocktail)
    const pool = toValue(cocktails) || []
    if (!source) return []

    return pool
      .map(c => ({ c, score: scoreSimilarity(source, c) }))
      .filter(x => x.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score || (a.c.name || '').localeCompare(b.c.name || ''))
      .slice(0, limit)
      .map(x => x.c)
  })
}