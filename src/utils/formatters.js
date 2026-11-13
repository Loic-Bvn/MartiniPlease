// utils/formatters.js

const OZ_FRACTIONS = new Map([
  [1, '1/8'],
  [2, '1/4'],
  [3, '3/8'],
  [4, '1/2'],
  [5, '5/8'],
  [6, '3/4'],
  [7, '7/8'],
])

export function formatOz(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return String(amount ?? '')

  const absoluteValue = Math.abs(value)
  if (absoluteValue >= 1) return String(amount)

  const whole = Math.floor(absoluteValue)
  const eighths = Math.round((absoluteValue - whole) * 8)
  if (Math.abs(absoluteValue - whole - eighths / 8) > 1e-6) {
    return String(amount)
  }

  const fraction = OZ_FRACTIONS.get(eighths)
  const formatted = fraction
    ? (whole ? `${whole} ${fraction}` : fraction)
    : String(whole + (eighths === 8 ? 1 : 0))

  return value < 0 ? `-${formatted}` : formatted
}

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
 * Retourne le label à partir du map pré-calculé
 * @param {Object} allLabels - computed issu de useFilters
 */
export function getLabel(allLabels, key) {
  return allLabels[key] ?? key
}

/**
 * Retourne le label d'un sub-spirit à partir du map pré-calculé
 * @param {Object} allSubLabels - computed issu de useFilters
 */
export function getSubSpiritLabel(allSubLabels, key) {
  return allSubLabels[key] ?? key
}