// composables/useDataValidator.js
// Valide & nettoie les données avant INSERT/UPDATE dans Supabase

/**
 * Nettoie une recette : force les quantités en nombres, enlève les champs vides
 * Assure que chaque ingrédient a au moins une quantité (Oz ou Ml)
 */
export function cleanRecipe(recipe) {
  if (!Array.isArray(recipe)) return []
  
  return recipe
    .filter(ing => ing.Ingredient?.trim()) // Champ obligatoire
    .map(ing => {
      const cleaned = {
        Ingredient: ing.Ingredient.trim(),
      }
      
      // Type est optionnel - on l'ajoute seulement si fourni
      const typeValue = ing.Type?.trim()
      if (typeValue) {
        cleaned.Type = typeValue
      }
      
      // Convertir Oz en nombre si présent
      if (ing.Oz !== null && ing.Oz !== undefined && ing.Oz !== '') {
        const oz = parseFloat(ing.Oz)
        if (!isNaN(oz) && oz > 0) cleaned.Oz = oz
      }
      
      // Convertir Ml en nombre si présent
      if (ing.Ml !== null && ing.Ml !== undefined && ing.Ml !== '') {
        const ml = parseFloat(ing.Ml)
        if (!isNaN(ml) && ml > 0) cleaned.Ml = ml
      }
      
      // Convertir Dashes en nombre si présent
      if (ing.Dashes !== null && ing.Dashes !== undefined && ing.Dashes !== '') {
        const dashes = parseInt(ing.Dashes, 10)
        if (!isNaN(dashes) && dashes > 0) cleaned.Dashes = dashes
      }
      
      return cleaned
    })
}

/**
 * Valide & nettoie un cocktail avant INSERT/UPDATE
 */
export function validateCocktail(cocktail) {
  if (!cocktail.name?.trim()) {
    throw new Error('Cocktail name is required')
  }

  const cleaned = {
    ...(cocktail.id ? { id: cocktail.id } : {}),
    name: cocktail.name.trim(),
    recipe: cleanRecipe(cocktail.recipe),
  }

  // Champs optionnels - ne pas envoyer s'ils sont vides/null
  const optionalFields = [
    'base_spirit',
    'category',
    'glass',
    'method',
    'difficulty',
    'description',
    'image',
    'creator',
    'cocktail_style',
  ]

  for (const field of optionalFields) {
    const value = cocktail[field]
    if (value?.trim?.()) {
      cleaned[field] = value.trim()
    }
  }

  // ABV - convertir en nombre ou null
  if (cocktail.abv !== null && cocktail.abv !== undefined && cocktail.abv !== '') {
    const abv = parseFloat(cocktail.abv)
    if (!isNaN(abv) && abv >= 0 && abv <= 100) {
      cleaned.abv = abv
    }
  }

  // Arrays - profil, saisons, tags - les omettre si vides pour laisser les defaults BD s'appliquer
  const profileFiltered = Array.isArray(cocktail.profile)
    ? cocktail.profile.filter(p => p?.trim?.())
    : []
  if (profileFiltered.length > 0) {
    cleaned.profile = profileFiltered
  }

  const seasonFiltered = Array.isArray(cocktail.season)
    ? cocktail.season.filter(s => s?.trim?.())
    : []
  if (seasonFiltered.length > 0) {
    cleaned.season = seasonFiltered
  }

  const tagsFiltered = Array.isArray(cocktail.tags)
    ? cocktail.tags.filter(t => t?.trim?.())
    : []
  if (tagsFiltered.length > 0) {
    cleaned.tags = tagsFiltered
  }

  // Ice - optionnel
  const iceFiltered = Array.isArray(cocktail.ice)
    ? cocktail.ice.filter(i => i?.trim?.())
    : []
  if (iceFiltered.length > 0) {
    cleaned.ice = iceFiltered
  }

  return cleaned
}

/**
 * Valide un menu card
 */
export function validateMenuCard(card) {
  if (!card.name?.trim()) {
    throw new Error('Card name is required')
  }

  if (!Array.isArray(card.cocktail_ids) || card.cocktail_ids.length === 0) {
    throw new Error('At least one cocktail must be selected')
  }

  return {
    name: card.name.trim(),
    cocktail_ids: card.cocktail_ids, // IDs sont des UUIDs - pas besoin de nettoyer
  }
}

/**
 * Valide une création de drinker
 */
export function validateDrinkerCreation(data) {
  if (!data.pseudo?.trim()) {
    throw new Error('Pseudo is required')
  }

  if (!data.barId) {
    throw new Error('Bar ID is required')
  }

  return {
    pseudo: data.pseudo.trim(),
    bar_id: data.barId,
  }
}

/**
 * Valide une reconnexion de drinker
 */
export function validateDrinkerReconnect(data) {
  if (!data.pseudo?.trim()) {
    throw new Error('Pseudo is required')
  }

  if (!data.barId) {
    throw new Error('Bar ID is required')
  }

  return {
    pseudo: data.pseudo.trim(),
    bar_id: data.barId,
  }
}
