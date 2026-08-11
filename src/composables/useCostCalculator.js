// composables/useCostCalculator.js
// Calcule le coût matière première d'un cocktail à partir de sa recette
// et du prix courant des ingrédients du bar.
//
// ⚠️ Le coût n'est JAMAIS stocké en base : il dépend du prix courant des
//    ingrédients, donc toujours recalculé à la volée. Si tu changes le prix
//    d'une bouteille, tous les coûts se mettent à jour automatiquement.

import { computed } from 'vue'

// Petites quantités non mesurées en Ml/Oz (dashes de bitters, etc.)
// On leur attribue un volume conventionnel pour ne pas les ignorer totalement.
const ML_PER_DASH = 0.6 // ~ un dash standard

/**
 * Coût par ml d'un ingrédient, selon son mode de pricing.
 * @param {object} ingredient - ligne de la table `ingredients`
 * @returns {number} coût en €/ml (0 si pas de prix renseigné)
 */
export function costPerMl(ingredient) {
  if (!ingredient) return 0

  if (ingredient.pricing_mode === 'ml') {
    return Number(ingredient.price_per_ml) || 0
  }

  // mode 'bottle' (par défaut)
  const price  = Number(ingredient.bottle_price)
  const volume = Number(ingredient.bottle_volume_ml)
  if (!price || !volume) return 0
  return price / volume
}

/**
 * Volume utilisé (en ml) pour une ligne de recette, quelle que soit l'unité
 * saisie à l'origine (Ml, Oz, ou Dashes).
 */
function recipeLineMl(line) {
  if (line.Ml)     return Number(line.Ml)
  if (line.Oz)     return Number(line.Oz) * 29.5735
  if (line.Dashes) return Number(line.Dashes) * ML_PER_DASH
  return 0
}

/**
 * Résout l'objet de pricing effectif pour une ligne de recette : la
 * référence précise choisie (si elle a un prix renseigné), sinon
 * l'ingrédient générique du type.
 */
function resolvePricingSource(line, ingredient) {
  if (line.Reference && ingredient) {
    const ref = (ingredient.references || []).find(r => r.name === line.Reference)
    if (ref && costPerMl(ref) > 0) return ref
  }
  return ingredient
}

/**
 * Calcule le coût matière d'un cocktail.
 *
 * @param {Array} recipe - `bar_cocktails.recipe` (jsonb array : Ingredient, Type, Reference, Oz/Ml, IsGarnish)
 * @param {Array} ingredients - `ingredients` du bar (avec pricing)
 * @param {object} [opts]
 * @param {boolean} [opts.includeGarnish=false] - inclure le coût des garnitures
 * @returns {{ total: number, missingPrice: string[], lines: Array }}
 *   total: coût total en €
 *   missingPrice: noms des ingrédients sans prix renseigné (pour alerter le bartender)
 *   lines: détail par ligne { name, type, ml, unitCost, lineCost, priced }
 */
export function calculateCocktailCost(recipe, ingredients, opts = {}) {
  const { includeGarnish = false } = opts
  const byType = new Map(ingredients.map(i => [i.type, i]))

  const lines = []
  let total = 0
  const missingPrice = []

  for (const line of Array.isArray(recipe) ? recipe : []) {
    if (line.IsGarnish && !includeGarnish) continue

    const ml = recipeLineMl(line)
    if (!ml) continue

    const ingredient = line.Type ? byType.get(line.Type) : null
    const pricingSource = resolvePricingSource(line, ingredient)
    const unitCost = costPerMl(pricingSource)
    const lineCost = unitCost * ml
    const priced = unitCost > 0

    if (!priced && line.Type) missingPrice.push(line.Ingredient)

    lines.push({
      name: line.Ingredient,
      type: line.Type ?? null,
      reference: line.Reference ?? null,
      ml,
      unitCost,
      lineCost,
      priced,
    })

    total += lineCost
  }

  return { total, missingPrice, lines }
}

/**
 * Version "composable" pratique pour un usage direct dans un <script setup>.
 * @param {import('vue').Ref} recipeRef
 * @param {import('vue').Ref} ingredientsRef
 */
export function useCocktailCost(recipeRef, ingredientsRef) {
  const cost = computed(() =>
    calculateCocktailCost(recipeRef.value, ingredientsRef.value ?? [])
  )

  const margin = (price) => {
    const p = Number(price)
    if (!p || !cost.value.total) return null
    return {
      absolute: p - cost.value.total,
      percent: ((p - cost.value.total) / p) * 100,
      foodCostPercent: (cost.value.total / p) * 100,
    }
  }

  return { cost, margin }
}

/**
 * Calcule les quantités et le coût d'un batch (gros volume) à partir d'une
 * recette unitaire, du nombre de portions visées, et d'un taux de dilution
 * (eau ajoutée par le shake/stir, standard pro ~ 20-25%).
 *
 * @param {Array} recipe
 * @param {Array} ingredients
 * @param {number} servings - nombre de cocktails visés
 * @param {number} [dilutionPercent=20]
 */
export function calculateBatch(recipe, ingredients, servings, dilutionPercent = 20) {
  const perServing = calculateCocktailCost(recipe, ingredients)
  const dilutionFactor = 1 + (Number(dilutionPercent) || 0) / 100

  const ingredientLines = perServing.lines.map(line => ({
    ...line,
    batchMl: line.ml * servings,
    batchCost: line.lineCost * servings,
  }))

  const baseVolumeMl = perServing.lines.reduce((sum, l) => sum + l.ml, 0) * servings
  const totalVolumeMlWithDilution = baseVolumeMl * dilutionFactor
  const waterToAddMl = totalVolumeMlWithDilution - baseVolumeMl

  return {
    servings,
    dilutionPercent,
    ingredientLines,
    totalCost: perServing.total * servings,
    costPerServing: perServing.total,
    baseVolumeMl,
    totalVolumeMlWithDilution,
    waterToAddMl,
    missingPrice: perServing.missingPrice,
  }
}
