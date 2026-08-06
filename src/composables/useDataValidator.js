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

      // Reference est optionnelle - référence précise de bouteille choisie (nom, pas d'id)
      const referenceValue = ing.Reference?.trim?.()
      if (referenceValue) {
        cleaned.Reference = referenceValue
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
export function validateCocktail(cocktail, options = {}) {  
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
    'image',
    'creator',
    'cocktail_style',
    'creation_year',
  ]

  // Description bilingue - colonnes séparées en DB (bar_cocktails.description_fr / description_en)
  if (cocktail.description_fr?.trim?.()) {
    cleaned.description_fr = cocktail.description_fr.trim()
  }
  if (cocktail.description_en?.trim?.()) {
    cleaned.description_en = cocktail.description_en.trim()
  }

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

  // Prix - champ numérique, ne pas utiliser .trim() dessus (contrairement aux
  // optionalFields ci-dessus qui sont tous des chaînes)
  if (cocktail.price !== null && cocktail.price !== undefined && cocktail.price !== '') {
    const price = parseFloat(cocktail.price)
    if (!isNaN(price) && price >= 0) {
      cleaned.price = price
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

  // Ice - optionnel (string)
  if (cocktail.ice?.trim?.()) {
    cleaned.ice = cocktail.ice.trim()
  }

  // is_private - conserve la valeur déjà présente sur l'objet en entrée.
  if (typeof cocktail.is_private === 'boolean') {
    cleaned.is_private = cocktail.is_private
  }

  // Cocktail modifié depuis le form bar, on le redétache du catalog
  if (options.forBar) {
    cleaned.is_private = true
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
    ...(card.id ? { id: card.id } : {}),
    name: card.name.trim(),
    cocktail_ids: card.cocktail_ids,
    is_visible: card.is_visible !== false,
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
    barId: data.barId,
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
    barId: data.barId,
  }
}
