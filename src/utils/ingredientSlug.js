export function normalizeIngredientNameKey(value = '') {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function toIngredientSlug(value = '') {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  const normalized = normalizeIngredientNameKey(raw)
    .replace(/\s+/g, '_')

  return normalized
}
