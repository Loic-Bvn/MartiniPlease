// utils/formatters.js

/**
 * Formate une date ISO en string lisible
 */
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

/**
 * Retourne le nom d'un cocktail par son id
 * @param {Array} cocktails - liste complète des cocktails
 */
export function getCocktailName(cocktails, id) {
  return cocktails.find(c => c.id === id)?.name ?? '—'
}

/**
 * Retourne le label d'une famille à partir du map pré-calculé
 * @param {Object} allFamilyLabels - computed issu de useFilters
 */
export function getFamilyLabel(allFamilyLabels, key) {
  return allFamilyLabels[key] ?? key
}

/**
 * Retourne le label d'un sub-spirit à partir du map pré-calculé
 * @param {Object} allSubLabels - computed issu de useFilters
 */
export function getSubSpiritLabel(allSubLabels, key) {
  return allSubLabels[key] ?? key
}