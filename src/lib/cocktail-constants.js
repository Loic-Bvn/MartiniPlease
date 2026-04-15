/**
 * Adapter pour charger les constantes depuis le fichier JSON centralisé.
 * Source unique pour le frontend Vue.
 * 
 * Usage:
 *   import { INGREDIENTS, GLASSES, METHODS, PROFILES, SEASONS, ICE_TYPES } from '@/lib/cocktail-constants'
 */

import constantsData from '@/constants/cocktail-constants.json'

// Cache pour éviter les re-imports
let loadedConstants = null

/**
 * Charge les constantes depuis le JSON
 */
function loadConstants() {
  if (loadedConstants) return loadedConstants
  
  if (!constantsData) {
    console.error('❌ Constantes non chargées')
    return {}
  }
  
  loadedConstants = constantsData
  return constantsData
}

// Charger au démarrage
loadConstants()

/**
 * Récupère TOUS les ingrédients en format flat
 * Format: { type: { name, category, abv, family } }
 */
export function getAllIngredients() {
  const constants = loadedConstants || loadConstants()
  const ingredients = constants.ingredients || {}
  const result = {}
  
  Object.values(ingredients).forEach(categoryDict => {
    if (typeof categoryDict === 'object' && categoryDict !== null) {
      Object.assign(result, categoryDict)
    }
  })
  
  return result
}

/**
 * Récupère les ingrédients groupés par catégorie
 * Format: { spirits: {...}, liqueurs: {...}, etc }
 */
export function getIngredientsByCategory() {
  const constants = loadedConstants || loadConstants()
  return constants.ingredients || {}
}

/**
 * Récupère les métadonnées d'un ingrédient
 * @param {string} ingredientType - Clé de l'ingrédient (ex: 'bourbon')
 * @returns {Object|null} - { name, category, abv, family }
 */
export function getIngredientMetadata(ingredientType) {
  const all = getAllIngredients()
  return all[ingredientType] || null
}

/**
 * Récupère les verres
 */
export function getGlasses() {
  const constants = loadedConstants || loadConstants()
  return constants.glasses || {}
}

/**
 * Récupère les méthodes de préparation
 */
export function getMethods() {
  const constants = loadedConstants || loadConstants()
  return constants.methods || {}
}

/**
 * Récupère les types de glaçons
 */
export function getIceTypes() {
  const constants = loadedConstants || loadConstants()
  return constants.ice_types || {}
}

/**
 * Récupère les profils de goût
 */
export function getProfiles() {
  const constants = loadedConstants || loadConstants()
  return constants.profiles || {}
}

/**
 * Convertir profiles en array pour chips (comme dans CocktailModal)
 */
export function getProfilesAsArray() {
  const profiles = getProfiles()
  return Object.entries(profiles).map(([key, data]) => ({
    key,
    label: data.name,
    icon: data.emoji
  }))
}

/**
 * Récupère les saisons
 */
export function getSeasons() {
  const constants = loadedConstants || loadConstants()
  return constants.seasons || {}
}

/**
 * Convertir seasons en array pour chips
 */
export function getSeasonsAsArray() {
  const seasons = getSeasons()
  return Object.entries(seasons).map(([key, data]) => ({
    key,
    label: data.name,
    icon: data.emoji
  }))
}

/**
 * Convertir ice_types en array pour chips
 */
export function getIceTypesAsArray() {
  const iceTypes = getIceTypes()
  return Object.entries(iceTypes).map(([key, data]) => ({
    key,
    label: data.name,
    icon: data.emoji
  }))
}

/**
 * Récupère les niveaux de difficulté
 */
export function getDifficulties() {
  const constants = loadedConstants || loadConstants()
  return constants.difficulties || {}
}

/**
 * Récupère les styles de cocktail
 */
export function getCocktailStyles() {
  const constants = loadedConstants || loadConstants()
  return constants.cocktail_styles || []
}

/**
 * Récupère les catégories de cocktail
 */
export function getCocktailCategories() {
  const constants = loadedConstants || loadConstants()
  return constants.cocktail_categories || {}
}

/**
 * Récupère les catégories de verres pour les options select
 */
export function getGlassesAsOptions() {
  const glasses = getGlasses()
  return Object.entries(glasses).map(([key, data]) => ({
    value: key,
    label: `${data.emoji} ${data.name}`
  }))
}

/**
 * Récupère les méthodes pour les options select
 */
export function getMethodsAsOptions() {
  const methods = getMethods()
  return Object.entries(methods).map(([key, data]) => ({
    value: key,
    label: `${data.emoji} ${data.name}`
  }))
}

/**
 * Récupère les catégories de cocktail pour les options select
 */
export function getCocktailCategoriesAsOptions() {
  const categories = getCocktailCategories()
  return Object.entries(categories).map(([key, data]) => ({
    value: data.key,  // Utiliser data.key comme valeur réelle
    label: data.label,
    familyKey: key   // Garder la clé de famille pour usage interne
  }))
}

/**
 * Export des constants groupés pour usage simple
 */
export const COCKTAIL_CONSTANTS = {
  // Groupés directement
  INGREDIENTS: getAllIngredients(),
  INGREDIENT_CATEGORIES: getIngredientsByCategory(),
  GLASSES: getGlasses(),
  METHODS: getMethods(),
  ICE_TYPES: getIceTypes(),
  PROFILES: getProfiles(),
  SEASONS: getSeasons(),
  DIFFICULTIES: getDifficulties(),
  COCKTAIL_STYLES: getCocktailStyles(),
  COCKTAIL_CATEGORIES: getCocktailCategories(),
  
  // As arrays (pour chips/selects)
  PROFILES_ARRAY: getProfilesAsArray(),
  SEASONS_ARRAY: getSeasonsAsArray(),
  ICE_TYPES_ARRAY: getIceTypesAsArray(),
  GLASSES_OPTIONS: getGlassesAsOptions(),
  METHODS_OPTIONS: getMethodsAsOptions(),
  COCKTAIL_CATEGORIES_OPTIONS: getCocktailCategoriesAsOptions(),
}

export default COCKTAIL_CONSTANTS
