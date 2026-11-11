// composables/useCocktailSteps.js
// Génère les étapes du « mode pas à pas » à partir des données structurées
// d'un cocktail (method, glass, ice, recipe).
//
// ⚠️  Les recettes n'ont PAS de texte d'instructions en base : tout est déduit
//     de `method` / `glass` / `ice` / `recipe`. Les durées (30 s de stir,
//     15 s de shake…) et les phrases ci-dessous sont des valeurs par défaut
//     raisonnables, à ajuster dans METHODS et STRINGS.
//
// Fonction pure (aucun état, aucun import Vue) → facile à tester avec Vitest.
//
//   buildSteps(cocktail, { locale, unit, ingredientsMap, isAvailable })
//   → Array<{ id, kind, kicker, title, qty?, text?, reference?, available?,
//             timerSeconds?, items? }>
//
//   kind : 'mise' | 'glass' | 'ingredient' | 'method' | 'strain' | 'garnish' | 'done'

import {
  getGlassLabel,
  getIngredientLabel,
  getDetailledIceLabel,
} from '@/constants/typeLabels.js'

// ── Réglages par méthode ──────────────────────────────────────────────────────
// container : où l'on verse les ingrédients
// seconds   : durée du minuteur (null = pas de minuteur)
// strain    : filtre-t-on dans le verre de service à la fin ?
const METHODS = {
  stir:        { container: 'mixing', seconds: 30,   strain: true  },
  regal_stir:  { container: 'mixing', seconds: 30,   strain: true  },
  shake:       { container: 'shaker', seconds: 15,   strain: true  },
  regal_shake: { container: 'shaker', seconds: 15,   strain: true  },
  throw:       { container: 'shaker', seconds: null, strain: true  },
  roll:        { container: 'shaker', seconds: null, strain: true  },
  blend:       { container: 'blender', seconds: 15,  strain: false, pour: true },
  swizzle:     { container: 'glass',  seconds: 20,   strain: false },
  build:       { container: 'glass',  seconds: null, strain: false },
}

// Verres servis sans glace, à refroidir avant le service
const CHILLED_GLASSES = new Set(['coupe', 'martini', 'nick_nora', 'champagne_flute'])

// ── Textes ────────────────────────────────────────────────────────────────────
const STRINGS = {
  fr: {
    kicker: {
      mise: 'Mise en place', glass: 'Le verre', method: 'Technique',
      strain: 'Service', garnish: 'Finition', done: 'Prêt',
    },
    ingredientKicker: (i, n) => `Ingrédient ${i}/${n}`,
    miseTitle: 'Tout est prêt ?',
    glassRow: 'Verre', iceRow: 'Glace',
    container: { mixing: 'le verre à mélange', shaker: 'le shaker', blender: 'le blender', glass: 'le verre' },
    glassChilled: (g) => `Refroidis ton verre (${g}) : remplis-le de glaçons ou passe-le au congélateur.`,
    glassWithIce: (g, ice) => `Prends un verre ${g} et remplis-le (${ice}).`,
    glassPlain: (g) => `Prends un verre ${g}.`,
    glassTitle: (g) => g,
    into: (c) => `→ dans ${c}`,
    addGeneric: 'Ajoute-le.',
    method: {
      stir:    { title: 'Remue',    text: 'Ajoute des glaçons au verre à mélange et remue jusqu’à ce que le verre soit bien froid.' },
      shake:   { title: 'Shake',    text: 'Ajoute des glaçons dans le shaker, ferme-le et secoue fort.' },
      throw:   { title: 'Throw',    text: 'Verse le contenu d’un shaker à l’autre, en hauteur, 4 à 6 fois.' },
      roll:    { title: 'Roll',     text: 'Fais rouler doucement le contenu d’un shaker à l’autre, 3 à 4 fois.' },
      blend:   { title: 'Mixe',     text: 'Ajoute de la glace pilée et mixe jusqu’à obtenir une texture lisse.' },
      swizzle: { title: 'Swizzle',  text: 'Remplis de glace pilée et fais tourner le bar spoon entre tes paumes.' },
      build:   { title: 'Mélange',  text: 'Mélange délicatement avec une cuillère.' },
    },
    pour: 'Verse dans le verre de service.',
    strainTitle: 'Filtre',
    strainOnIce: (ice) => `Filtre dans le verre sur de la glace fraîche (${ice}).`,
    strainNeat: 'Filtre dans le verre, sans glace.',
    strainGeneric: 'Filtre dans le verre.',
    garnishTitle: (l) => l,
    garnishText: 'Garnis le cocktail.',
    doneTitle: 'Santé ! 🍸',
    doneText: 'Ton cocktail est prêt.',
    dash: (n) => `${n} dash${n > 1 ? 'es' : ''}`,
  },
  en: {
    kicker: {
      mise: 'Mise en place', glass: 'The glass', method: 'Technique',
      strain: 'Serve', garnish: 'Finish', done: 'Ready',
    },
    ingredientKicker: (i, n) => `Ingredient ${i}/${n}`,
    miseTitle: 'All set?',
    glassRow: 'Glass', iceRow: 'Ice',
    container: { mixing: 'the mixing glass', shaker: 'the shaker', blender: 'the blender', glass: 'the glass' },
    glassChilled: (g) => `Chill your ${g} glass: fill it with ice or put it in the freezer.`,
    glassWithIce: (g, ice) => `Grab a ${g} glass and fill it (${ice}).`,
    glassPlain: (g) => `Grab a ${g} glass.`,
    glassTitle: (g) => g,
    into: (c) => `→ into ${c}`,
    addGeneric: 'Add it.',
    method: {
      stir:    { title: 'Stir',    text: 'Add ice to the mixing glass and stir until the glass is well chilled.' },
      shake:   { title: 'Shake',   text: 'Add ice to the shaker, close it and shake hard.' },
      throw:   { title: 'Throw',   text: 'Pour the contents from one shaker to the other, from a height, 4 to 6 times.' },
      roll:    { title: 'Roll',    text: 'Gently roll the contents from one shaker to the other, 3 to 4 times.' },
      blend:   { title: 'Blend',   text: 'Add crushed ice and blend until smooth.' },
      swizzle: { title: 'Swizzle', text: 'Fill with crushed ice and spin the bar spoon between your palms.' },
      build:   { title: 'Mix',     text: 'Gently mix with a spoon.' },
    },
    pour: 'Pour into the serving glass.',
    strainTitle: 'Strain',
    strainOnIce: (ice) => `Strain into the glass over fresh ice (${ice}).`,
    strainNeat: 'Strain into the glass, no ice.',
    strainGeneric: 'Strain into the glass.',
    garnishTitle: (l) => l,
    garnishText: 'Garnish the cocktail.',
    doneTitle: 'Cheers! 🍸',
    doneText: 'Your cocktail is ready.',
    dash: (n) => `${n} dash${n > 1 ? 'es' : ''}`,
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const isGarnish = (ing) => !!ing.IsGarnish || ing.Ingredient === 'garnish'

/** `ice` peut être un tableau ou une chaîne selon l'origine de la donnée. */
function normalizeIce(ice) {
  return [].concat(ice ?? []).map(String).map(s => s.trim()).filter(Boolean)
}

/**
 * Quantité lisible, dans l'unité choisie, avec repli sur l'autre unité si la
 * valeur manque (contrairement à la fiche détail, qui affiche vide).
 */
export function formatQuantity(ing, unit = 'oz', locale = 'fr') {
  const t = STRINGS[locale] ?? STRINGS.fr
  const ml = ing.Ml ? `${ing.Ml} ml` : ''
  const oz = ing.Oz ? `${ing.Oz} oz` : ''
  if (ing.Dashes) return t.dash(ing.Dashes)
  return unit === 'ml' ? (ml || oz) : (oz || ml)
}

// ── API ───────────────────────────────────────────────────────────────────────

export function buildSteps(cocktail, {
  locale = 'fr',
  unit = 'oz',
  ingredientsMap = null,
  isAvailable = () => true,
} = {}) {
  if (!cocktail) return []

  const t = STRINGS[locale] ?? STRINGS.fr
  const method = METHODS[cocktail.method] ?? null
  const ice = normalizeIce(cocktail.ice)
  const servedWithIce = ice.length > 0 && !ice.includes('no_ice')
  const servedNeat = ice.includes('no_ice')
  const iceLabel = ice.map(i => getDetailledIceLabel(i, locale).toLowerCase()).join(', ')
  const glassLabel = cocktail.glass ? getGlassLabel(cocktail.glass, locale) : ''
  const glassInText = glassLabel.toLowerCase()

  const recipe = cocktail.recipe ?? []
  const liquids  = recipe.filter(i => !isGarnish(i))
  const garnishes = recipe.filter(isGarnish)

  // Si le label n'est résolu ni par TYPE_LABELS ni par la base (→ « Indisponible »),
  // on retombe sur le texte d'origine de la recette (Reference) plutôt que d'afficher ça.
  const UNRESOLVED = locale === 'fr' ? 'Indisponible' : 'Unavailable'
  const labelOf = (ing) => {
    const label = getIngredientLabel(ing.Ingredient, locale, ingredientsMap)
    return label === UNRESOLVED && ing.Reference ? ing.Reference : label
  }

  const steps = []
  const push = (step) => steps.push({ id: `${step.kind}-${steps.length}`, ...step })

  // 0 ── Mise en place (checklist)
  const items = []
  if (glassLabel) items.push({ key: 'glass', label: `${t.glassRow} · ${glassLabel}`, qty: '', available: true })
  if (iceLabel)   items.push({ key: 'ice',   label: `${t.iceRow} · ${iceLabel}`,     qty: '', available: true })
  recipe.forEach((ing, idx) => {
    items.push({
      key: `ing-${idx}`,
      label: labelOf(ing),
      qty: formatQuantity(ing, unit, locale),
      available: isGarnish(ing) ? true : isAvailable(ing),
    })
  })
  push({ kind: 'mise', kicker: t.kicker.mise, title: t.miseTitle, items })

  // 1 ── Verre (omis si la donnée manque : « prépare ton verre » n'apprend rien)
  if (cocktail.glass) {
    let text
    if (method && !method.strain && !method.pour && servedWithIce) text = t.glassWithIce(glassInText, iceLabel) // build / swizzle
    else if (CHILLED_GLASSES.has(cocktail.glass)) text = t.glassChilled(glassInText)
    else text = t.glassPlain(glassInText)
    push({ kind: 'glass', kicker: t.kicker.glass, title: t.glassTitle(glassLabel), text })
  }

  // 2 ── Ingrédients (un écran par ingrédient : on se concentre sur le verseur)
  const container = t.container[method?.container ?? 'glass']
  liquids.forEach((ing, i) => {
    const qty = formatQuantity(ing, unit, locale)
    push({
      kind: 'ingredient',
      kicker: t.ingredientKicker(i + 1, liquids.length),
      title: labelOf(ing),
      qty,
      reference: ing.Reference || '',
      text: qty ? t.into(container) : t.addGeneric,
      available: isAvailable(ing),
    })
  })

  // 3 ── Technique (+ minuteur)
  if (method) {
    const m = t.method[cocktail.method] ?? t.method[cocktail.method?.replace('regal_', '')] ?? t.method.build
    push({
      kind: 'method',
      kicker: t.kicker.method,
      title: m.title,
      text: m.text,
      timerSeconds: method.seconds,
    })

    // 4 ── Filtrage / service
    if (method.strain) {
      const text = servedWithIce ? t.strainOnIce(iceLabel)
                 : servedNeat    ? t.strainNeat
                 :                 t.strainGeneric
      push({ kind: 'strain', kicker: t.kicker.strain, title: t.strainTitle, text })
    } else if (method.pour) {
      push({ kind: 'strain', kicker: t.kicker.strain, title: t.strainTitle, text: t.pour })
    }
  }

  // 5 ── Garnitures
  garnishes.forEach((ing) => {
    push({
      kind: 'garnish',
      kicker: t.kicker.garnish,
      title: t.garnishTitle(labelOf(ing)),
      reference: ing.Reference || '',
      text: t.garnishText,
    })
  })

  // 6 ── Fin
  push({ kind: 'done', kicker: t.kicker.done, title: t.doneTitle, text: t.doneText })

  return steps
}