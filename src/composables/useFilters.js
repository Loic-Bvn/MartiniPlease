// composables/useFilters.js
// Source unique de vérité pour les filtres cocktails.
//
// Avant : la logique de filtrage était dupliquée entre ce fichier
// (version "props/emit" pour FilterPanel) et CocktailMenuApp.vue
// (version "refs locales" ~120 lignes).
//
// Après : ce composable contient TOUT — état, computed filteredCocktails,
// helpers toggle/clear — et est importé directement dans CocktailMenuApp.
// FilterPanel reçoit les valeurs en props et émet des events, sans
// avoir besoin de sa propre copie de la logique.
//
// ⚠️  SINGLETON : les ref de filtres sont au niveau module.
//     Elles sont réinitialisées par clearFilters() lors du changement de bar.

import { ref, computed } from 'vue'
import { getCocktailStyleLabel, getFamilyLabel as getFL, getIngredientLabel } from '@/constants/typeLabels.js'
import { getCocktailCategory, getCocktailStyles, isMocktail, getIngredientsByCategory } from '@/lib/cocktail-constants'

// ── Réglages de l'affichage du filtre Style ───────────────────────────────────
// Valeurs de `cocktail_styles` à ne PAS proposer dans la colonne Style.
const HIDDEN_STYLES = ['shot', 'punch', 'spritz', 'frozen']
// true → masque aussi automatiquement tout style qu'aucun cocktail n'utilise.
const HIDE_UNUSED_STYLES = true

// ── État singleton ────────────────────────────────────────────────────────────
const selectedFamilies   = ref([])
const selectedSubSpirits = ref([])
const selectedSeasons    = ref([])
const showOnlyMakeable   = ref(false)
const showOnlyFavorites  = ref(false)
const abvFilter          = ref(null)     // null | 'mocktail' | 'low'
const selectedProfiles   = ref([])
const selectedStyles     = ref([])

export function useFilters({ cocktails, barInventory, favorites, hasDrinker, locale, searchTerm } = {}) {

  // ── Données de référence (dépendent de la locale) ─────────────────────────

  const baseSpirits = computed(() => {
    const fr = locale?.value !== 'en'
    return [
    { key: 'whiskey', label: 'Whiskey', subs: [
      { key: 'bourbon',       label: getFL('bourbon',       locale?.value ?? 'fr') },
      { key: 'rye',           label: getFL('rye',           locale?.value ?? 'fr') },
      { key: 'scotch',        label: getFL('scotch',        locale?.value ?? 'fr') },
      { key: 'irish_whiskey', label: getFL('irish_whiskey', locale?.value ?? 'fr') },
      { key: 'peated_whisky', label: getFL('peated_whisky', locale?.value ?? 'fr') },
      { key: 'whiskey',       label: getFL('whiskey',       locale?.value ?? 'fr') },
    ]},
    { key: 'rum', label: fr ? 'Rhum' : 'Rum', subs: [
      { key: 'rum',           label: getFL('rum',           locale?.value ?? 'fr') },
      { key: 'rum_agricol',   label: getFL('rum_agricol',   locale?.value ?? 'fr') },
      { key: 'rum_jamaican',  label: getFL('rum_jamaican',  locale?.value ?? 'fr') },
      { key: 'rum_cuban',     label: getFL('rum_cuban',     locale?.value ?? 'fr') },
      { key: 'rum_overproof', label: getFL('rum_overproof', locale?.value ?? 'fr') },
      { key: 'cachaca',       label: getFL('cachaca',       locale?.value ?? 'fr') },
    ]},
    { key: 'agave', label: 'Agave', subs: [
      { key: 'tequila',          label: getFL('tequila',          locale?.value ?? 'fr') },
      { key: 'tequila_reposado', label: getFL('tequila_reposado', locale?.value ?? 'fr') },
      { key: 'mezcal',           label: getFL('mezcal',           locale?.value ?? 'fr') },
    ]},
    { key: 'gin', label: 'Gin', subs: [
      { key: 'gin',      label: getFL('gin',      locale?.value ?? 'fr') },
      { key: 'gin_dry',  label: getFL('gin_dry',  locale?.value ?? 'fr') },
      { key: 'gin_navy', label: getFL('gin_navy', locale?.value ?? 'fr') },
      { key: 'genever',  label: getFL('genever',  locale?.value ?? 'fr') },
    ]},
    { key: 'brandy', label: 'Brandy', subs: [
      { key: 'cognac',   label: getFL('cognac',   locale?.value ?? 'fr') },
      { key: 'calvados', label: getFL('calvados', locale?.value ?? 'fr') },
      { key: 'pisco',    label: getFL('pisco',    locale?.value ?? 'fr') },
      { key: 'grappa',   label: getFL('grappa',   locale?.value ?? 'fr') },
      { key: 'brandy',   label: getFL('brandy',   locale?.value ?? 'fr') },
    ]},
    { key: 'vodka',    label: 'Vodka',    subs: [] },
    { key: 'absinthe', label: 'Absinthe', subs: [] },
    { key: 'aquavit',  label: 'Aquavit',  subs: [] },
    { key: 'pastis',   label: 'Pastis',   subs: [] },
  ]})

  // Liqueurs : même forme que baseSpirits ({ key, label, subs }), construite
  // depuis cocktail-constants.json (catégorie « licors », champ `family`).
  const LIQUEUR_FAMILY_ORDER = [
    'bitter_liqueur', 'citrus_liqueur', 'fruit_liqueur',
    'herbal_liqueur', 'nut_liqueur', 'dessert_liqueur',
  ]
  const liqueurFamilies = computed(() => {
    const loc = locale?.value ?? 'fr'
    const items = getIngredientsByCategory().licors || {}
    return LIQUEUR_FAMILY_ORDER.map(famKey => ({
      key: famKey,
      label: getFL(famKey, loc),
      subs: Object.entries(items)
        .filter(([, data]) => data?.family === famKey)
        // libellé d'un ingrédient : TYPE_LABELS, sinon `name` du JSON (items sert de map de secours)
        .map(([key]) => ({ key, label: getIngredientLabel(key, loc, items) }))
        .sort((a, b) => a.label.localeCompare(b.label, loc)),
    }))
  })

  const profileFilters = computed(() => {
    const fr = locale?.value === 'fr'
    return [
      { key: 'smoky',      label: fr ? 'Fumé'       : 'Smoky'      },
      { key: 'bitter',     label: fr ? 'Amer'       : 'Bitter'     },
      { key: 'creamy',     label: fr ? 'Crémeux'    : 'Creamy'     },
      { key: 'tropical',   label: 'Tropical'                       },
      { key: 'floral',     label: 'Floral'                         },
      { key: 'nutty',      label: fr ? 'Noiseté'    : 'Nutty'      },
      { key: 'spicy',      label: fr ? 'Épicé'      : 'Spicy'      },
      { key: 'herbal',     label: fr ? 'Herbacé'    : 'Herbal'     },
      { key: 'fruity',     label: fr ? 'Fruité'     : 'Fruity'     },
      { key: 'citrus',     label: fr ? 'Agrume'     : 'Citrus'     },
      { key: 'sour',       label: fr ? 'Acidulé'    : 'Sour'       },
      { key: 'dry',        label: fr ? 'Sec'        : 'Dry'        },
      { key: 'boozy',      label: fr ? 'Corsé'      : 'Boozy'      },
      { key: 'refreshing', label: fr ? 'Frais'      : 'Refreshing' },
      { key: 'rich',       label: fr ? 'Riche'      : 'Rich'       },
      { key: 'sweet',      label: fr ? 'Sucré'      : 'Sweet'      },
    ]
  })

  const styleFilters = computed(() => {
    const fr = locale?.value === 'fr'
    const styleLocale = fr ? 'fr' : 'en'
    const used = new Set((cocktails?.value || []).map(c => c.cocktail_style))
    return getCocktailStyles()
      .filter(key => !HIDDEN_STYLES.includes(key))
      .filter(key => !HIDE_UNUSED_STYLES || used.has(key) || selectedStyles.value.includes(key))
      .map(key => ({
        key,
        label: getCocktailStyleLabel(key, styleLocale),
      }))
  })

  const seasons = computed(() => {
    const fr = locale?.value === 'fr'
    return [
      { key: 'all',    icon: '🍸', label: fr ? 'Toutes'    : 'All'    },
      { key: 'spring', icon: '🌸', label: fr ? 'Printemps' : 'Spring' },
      { key: 'summer', icon: '☀️', label: fr ? 'Été'       : 'Summer' },
      { key: 'fall',   icon: '🍂', label: fr ? 'Automne'   : 'Fall'   },
      { key: 'winter', icon: '❄️', label: fr ? 'Hiver'     : 'Winter' },
    ]
  })

  // ── Labels calculés ────────────────────────────────────────────────────────

  const allFamilyLabels = computed(() => Object.fromEntries([
    ...baseSpirits.value.map(s => [s.key, s.label]),
    ...liqueurFamilies.value.map(l => [l.key, l.label]),
  ]))

  const allSubLabels = computed(() => Object.fromEntries(
    [...baseSpirits.value, ...liqueurFamilies.value]
      .flatMap(s => s.subs.map(sub => [sub.key, sub.label]))
  ))

  const activeSubSpirits = computed(() => {
    const subs = []
    for (const family of [...baseSpirits.value, ...liqueurFamilies.value]) {
      if (selectedFamilies.value.includes(family.key) && family.subs.length) {
        subs.push(...family.subs)
      }
    }
    return subs
  })

  // ── Helpers ────────────────────────────────────────────────────────────────

  function isMakeable(cocktail) {
    const recipe = cocktail.recipe || []
    if (!recipe.length) return false
    return recipe.every(ing => ing.Ingredient === 'garnish' || ing.Custom || barInventory?.value.has(ing.Ingredient))
  }

  const makeableCount = computed(() =>
    cocktails?.value.filter(isMakeable).length ?? 0
  )

  // ── Cocktails filtrés ──────────────────────────────────────────────────────

  const filteredCocktails = computed(() => {
    if (!cocktails?.value) return []
    let list = [...cocktails.value]

    // Recherche textuelle
    const query = searchTerm?.value?.toLowerCase().trim()
    if (query) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.recipe && c.recipe.some(ing => ing.Ingredient?.toLowerCase().includes(query)))
      )
    }

    // Famille / sous-spirits — logique ET : le cocktail doit CONTENIR
    // chaque famille ET chaque sous-spiritueux sélectionné.
    if (selectedFamilies.value.length || selectedSubSpirits.value.length) {
      const activeSubs     = selectedSubSpirits.value
      const activeFamilies = selectedFamilies.value

      list = list.filter(c => {
        const recipeTypes = new Set((c.recipe || []).map(ing => ing.Ingredient))

        const hasFamily = family => {
          const familyDef = [...baseSpirits.value, ...liqueurFamilies.value].find(s => s.key === family)
          if (familyDef) {
            const generic = family.toLowerCase()
            return recipeTypes.has(generic) || familyDef.subs.some(sub => recipeTypes.has(sub.key))
          }
          return recipeTypes.has(family.toLowerCase())
        }

        return activeFamilies.every(hasFamily) &&
               activeSubs.every(sub => recipeTypes.has(sub))
      })
    }

    // Saisons
    if (selectedSeasons.value.length) {
      list = list.filter(c => {
        const cs = Array.isArray(c.season) ? c.season : [c.season]
        return selectedSeasons.value.every(s => cs.includes(s))
      })
    }

    // Réalisables
    if (showOnlyMakeable.value) list = list.filter(isMakeable)

    // ABV
    if (abvFilter.value === 'mocktail')
      list = list.filter(isMocktail)
    else if (abvFilter.value === 'low')
      list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)

    // Profil gustatif
    if (selectedProfiles.value.length)
      list = list.filter(c => selectedProfiles.value.every(p => c.profile?.includes(p)))

    // Style
    if (selectedStyles.value.length)
      list = list.filter(c => selectedStyles.value.every(st => c.cocktail_style === st))

    // Favoris
    if (showOnlyFavorites.value && hasDrinker?.value)
      list = list.filter(c => favorites?.value.has(c.id))

    return list
  })

  const hasActiveFilters = computed(() =>
    selectedFamilies.value.length   > 0 ||
    selectedSubSpirits.value.length > 0 ||
    selectedSeasons.value.length    > 0 ||
    selectedProfiles.value.length   > 0 ||
    abvFilter.value !== null            ||
    showOnlyFavorites.value             ||
    showOnlyMakeable.value              ||
    selectedStyles.value.length     > 0 ||
    !!searchTerm?.value?.trim()
  )

  // ── Actions toggle ─────────────────────────────────────────────────────────

  function _toggle(arrayRef, value) {
    const idx = arrayRef.value.indexOf(value)
    if (idx > -1) arrayRef.value.splice(idx, 1)
    else          arrayRef.value.push(value)
  }

  function toggleFamily(familyKey) {
    const isActive = selectedFamilies.value.includes(familyKey)
    _toggle(selectedFamilies, familyKey)
    // Désélectionne les sous-spirits orphelins quand on retire la famille
    if (isActive) {
      const family = [...baseSpirits.value, ...liqueurFamilies.value].find(s => s.key === familyKey)
      if (family?.subs.length) {
        const subKeys = family.subs.map(s => s.key)
        selectedSubSpirits.value = selectedSubSpirits.value.filter(k => !subKeys.includes(k))
      }
    }
  }

  function toggleSubSpirit(spiritKey)  { _toggle(selectedSubSpirits, spiritKey) }
  function toggleProfile(profileKey)   { _toggle(selectedProfiles,   profileKey) }
  // cocktail_style est mono-valué : en logique ET, deux styles = 0 résultat.
  // On le traite donc comme un choix unique (re-cliquer désélectionne).
  function toggleStyle(styleKey) {
    selectedStyles.value = selectedStyles.value.includes(styleKey) ? [] : [styleKey]
  }

  function toggleMakeable()            { showOnlyMakeable.value  = !showOnlyMakeable.value }
  function toggleFavorites()           { showOnlyFavorites.value = !showOnlyFavorites.value }

  function setAbvFilter(value)         { abvFilter.value = value }

  function setSeason(seasonKey) {
    if (seasonKey === 'all') {
      selectedSeasons.value = []
    } else {
      const idx = selectedSeasons.value.indexOf(seasonKey)
      if (idx > -1) selectedSeasons.value.splice(idx, 1)
      else          selectedSeasons.value.push(seasonKey)
    }
  }

  function clearFilters() {
    selectedFamilies.value   = []
    selectedSubSpirits.value = []
    selectedSeasons.value    = []
    selectedProfiles.value   = []
    selectedStyles.value     = []
    abvFilter.value          = null
    showOnlyFavorites.value  = false
    showOnlyMakeable.value   = false
    if (searchTerm) searchTerm.value = ''
  }

  // ── Helpers labels ─────────────────────────────────────────────────────────

  function getFamilyLabel(key)    { return allFamilyLabels.value[key] ?? key }
  function getSubSpiritLabel(key) { return allSubLabels.value[key]    ?? key }
  function getSeasonLabel(key) {
    const s = seasons.value.find(s => s.key === key)
    return s ? `${s.icon} ${s.label}` : key
  }

  return {
    // État
    selectedFamilies,
    selectedSubSpirits,
    selectedSeasons,
    showOnlyMakeable,
    showOnlyFavorites,
    abvFilter,
    selectedProfiles,
    selectedStyles,

    // Données de référence
    baseSpirits,
    liqueurFamilies,
    profileFilters,
    styleFilters,
    seasons,
    allFamilyLabels,
    allSubLabels,
    activeSubSpirits,

    // Computed
    filteredCocktails,
    hasActiveFilters,
    makeableCount,
    isMakeable,

    // Actions
    toggleFamily,
    toggleSubSpirit,
    toggleProfile,
    toggleStyle,
    toggleMakeable,
    toggleFavorites,
    setAbvFilter,
    setSeason,
    clearFilters,

    // Helpers
    getFamilyLabel,
    getSubSpiritLabel,
    getSeasonLabel,
  }
}