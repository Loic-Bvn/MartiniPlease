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
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'

// ── État singleton ────────────────────────────────────────────────────────────
const selectedFamilies   = ref([])
const selectedSubSpirits = ref([])
const selectedSeasons    = ref([])
const showOnlyMakeable   = ref(false)
const showOnlyFavorites  = ref(false)
const filterMode         = ref('main')   // 'main' | 'contains'
const abvFilter          = ref(null)     // null | 'mocktail' | 'low'
const selectedProfiles   = ref([])
const selectedStyles     = ref([])

export function useFilters({ cocktails, barInventory, favorites, hasDrinker, locale, searchTerm } = {}) {

  // ── Données de référence (dépendent de la locale) ─────────────────────────

  const baseSpirits = computed(() => [
    { key: 'Whiskey', label: getFL('Whiskey', locale?.value ?? 'fr'), subs: [
      { key: 'bourbon',       label: getFL('bourbon',       locale?.value ?? 'fr') },
      { key: 'rye',           label: getFL('rye',           locale?.value ?? 'fr') },
      { key: 'scotch',        label: getFL('scotch',        locale?.value ?? 'fr') },
      { key: 'irish_whiskey', label: getFL('irish_whiskey', locale?.value ?? 'fr') },
      { key: 'peated_whisky', label: getFL('peated_whisky', locale?.value ?? 'fr') },
      { key: 'whiskey',       label: getFL('whiskey',       locale?.value ?? 'fr') },
    ]},
    { key: 'Rum', label: getFL('Rum', locale?.value ?? 'fr'), subs: [
      { key: 'rum',           label: getFL('rum',           locale?.value ?? 'fr') },
      { key: 'rum_agricol',   label: getFL('rum_agricol',   locale?.value ?? 'fr') },
      { key: 'rum_jamaican',  label: getFL('rum_jamaican',  locale?.value ?? 'fr') },
      { key: 'rum_cuban',     label: getFL('rum_cuban',     locale?.value ?? 'fr') },
      { key: 'rum_overproof', label: getFL('rum_overproof', locale?.value ?? 'fr') },
      { key: 'cachaca',       label: getFL('cachaca',       locale?.value ?? 'fr') },
    ]},
    { key: 'Agave', label: getFL('Agave', locale?.value ?? 'fr'), subs: [
      { key: 'tequila',          label: getFL('tequila',          locale?.value ?? 'fr') },
      { key: 'tequila_reposado', label: getFL('tequila_reposado', locale?.value ?? 'fr') },
      { key: 'mezcal',           label: getFL('mezcal',           locale?.value ?? 'fr') },
    ]},
    { key: 'Gin', label: getFL('Gin', locale?.value ?? 'fr'), subs: [
      { key: 'gin',      label: getFL('gin',      locale?.value ?? 'fr') },
      { key: 'gin_dry',  label: getFL('gin_dry',  locale?.value ?? 'fr') },
      { key: 'gin_navy', label: getFL('gin_navy', locale?.value ?? 'fr') },
      { key: 'genever',  label: getFL('genever',  locale?.value ?? 'fr') },
    ]},
    { key: 'Brandy', label: getFL('Brandy', locale?.value ?? 'fr'), subs: [
      { key: 'cognac',   label: getFL('cognac',   locale?.value ?? 'fr') },
      { key: 'calvados', label: getFL('calvados', locale?.value ?? 'fr') },
      { key: 'pisco',    label: getFL('pisco',    locale?.value ?? 'fr') },
      { key: 'grappa',   label: getFL('grappa',   locale?.value ?? 'fr') },
      { key: 'brandy',   label: getFL('brandy',   locale?.value ?? 'fr') },
    ]},
    { key: 'Vodka',    label: getFL('Vodka',    locale?.value ?? 'fr'), subs: [] },
    { key: 'Absinthe', label: getFL('Absinthe', locale?.value ?? 'fr'), subs: [] },
    { key: 'Aquavit',  label: getFL('Aquavit',  locale?.value ?? 'fr'), subs: [] },
  ])

  const liqueurFamilies = computed(() => [
    { key: 'Liqueur Amer',    label: getFL('Liqueur Amer',    locale?.value ?? 'fr') },
    { key: 'Liqueur Agrume',  label: getFL('Liqueur Agrume',  locale?.value ?? 'fr') },
    { key: 'Liqueur Fruits',  label: getFL('Liqueur Fruits',  locale?.value ?? 'fr') },
    { key: 'Liqueur Herbes',  label: getFL('Liqueur Herbes',  locale?.value ?? 'fr') },
    { key: 'Liqueur Noix',    label: getFL('Liqueur Noix',    locale?.value ?? 'fr') },
    { key: 'Liqueur Dessert', label: getFL('Liqueur Dessert', locale?.value ?? 'fr') },
    { key: 'Liqueur Anisée',  label: getFL('Liqueur Anisée',  locale?.value ?? 'fr') },
  ])

  const profileFilters = computed(() => {
    const fr = locale?.value === 'fr'
    return [
      { key: 'Smoky',      label: fr ? '🔥 Fumé'       : '🔥 Smoky'      },
      { key: 'Bitter',     label: fr ? '🍫 Amer'        : '🍫 Bitter'     },
      { key: 'Creamy',     label: fr ? '🥛 Crémeux'     : '🥛 Creamy'     },
      { key: 'Tropical',   label: fr ? '🍍 Tropical'    : '🍍 Tropical'   },
      { key: 'Floral',     label: fr ? '🌸 Floral'      : '🌸 Floral'     },
      { key: 'Nutty',      label: fr ? '🌰 Noisetté'    : '🌰 Nutty'      },
      { key: 'Spicy',      label: fr ? '🌶️ Épicé'      : '🌶️ Spicy'     },
      { key: 'Herbal',     label: fr ? '🌿 Herbacé'     : '🌿 Herbal'     },
      { key: 'Fruity',     label: fr ? '🍓 Fruité'      : '🍓 Fruity'     },
      { key: 'Citrus',     label: fr ? '🍋 Agrume'      : '🍋 Citrus'     },
      { key: 'Sour',       label: fr ? '🍋 Acidulé'     : '🍋 Sour'       },
      { key: 'Dry',        label: fr ? '🧂 Sec'         : '🧂 Dry'        },
      { key: 'Boozy',      label: fr ? '🥃 Corsé'       : '🥃 Boozy'      },
      { key: 'Refreshing', label: fr ? '🧊 Frais'       : '🧊 Refreshing' },
      { key: 'Rich',       label: fr ? '🍯 Riche'       : '🍯 Rich'       },
      { key: 'Sweet',      label: fr ? '🍬 Sucré'       : '🍬 Sweet'      },
    ]
  })

  const styleFilters = computed(() => {
    const fr = locale?.value === 'fr'
    return [
      { key: 'sour',          label: fr ? '🍋 Sour'          : '🍋 Sour'          },
      { key: 'fizz',          label: fr ? '🫧 Fizz'          : '🫧 Fizz'          },
      { key: 'highball',      label: fr ? '🥃 Highball'      : '🥃 Highball'      },
      { key: 'tiki',          label: fr ? '🌺 Tiki'          : '🌺 Tiki'          },
      { key: 'negroni',       label: fr ? '🔴 Negroni'       : '🔴 Negroni'       },
      { key: 'old_fashioned', label: fr ? '🟠 Old Fashioned' : '🟠 Old Fashioned' },
      { key: 'classic',       label: fr ? '🎩 Classique'     : '🎩 Classic'       },
      { key: 'modern',        label: fr ? '✨ Moderne'        : '✨ Modern'        },
      { key: 'creamy',        label: fr ? '🥛 Crémeux'       : '🥛 Creamy'        },
      { key: 'flip',          label: fr ? '🥚 Flip'          : '🥚 Flip'          },
      { key: 'spritz',        label: fr ? '🍾 Spritz'        : '🍾 Spritz'        },
    ]
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
    baseSpirits.value.flatMap(s => s.subs.map(sub => [sub.key, sub.label]))
  ))

  const activeSubSpirits = computed(() => {
    const subs = []
    for (const family of baseSpirits.value) {
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
    return recipe.every(ing => ing.Type === 'garnish' || barInventory?.value.has(ing.Type))
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
        (c.recipe && c.recipe.some(ing => ing.Type?.toLowerCase().includes(query)))
      )
    }

    // Famille / sous-spirits
    if (selectedFamilies.value.length || selectedSubSpirits.value.length) {
      const activeSubs     = selectedSubSpirits.value
      const activeFamilies = selectedFamilies.value

      list = list.filter(c => {
        if (filterMode.value === 'main') {
          const familyMatch = !activeFamilies.length || activeFamilies.includes(c.category)
          const subMatch    = !activeSubs.length     || activeSubs.includes(c.base_spirit)
          return familyMatch && subMatch
        } else {
          const recipeTypes = (c.recipe || []).map(ing => ing.Type)
          if (activeSubs.length)
            return activeSubs.some(sub => recipeTypes.includes(sub))
          return activeFamilies.some(family => {
            const familyDef = baseSpirits.value.find(s => s.key === family)
            if (familyDef) {
              const subKeys    = familyDef.subs.map(s => s.key)
              const genericKey = family.toLowerCase()
              return recipeTypes.some(t => subKeys.includes(t) || t === genericKey)
            }
            return recipeTypes.includes(family.toLowerCase())
          })
        }
      })
    }

    // Saisons
    if (selectedSeasons.value.length) {
      list = list.filter(c =>
        Array.isArray(c.season)
          ? c.season.some(s => selectedSeasons.value.includes(s))
          : selectedSeasons.value.includes(c.season)
      )
    }

    // Réalisables
    if (showOnlyMakeable.value) list = list.filter(isMakeable)

    // ABV
    if (abvFilter.value === 'mocktail')
      list = list.filter(c => c.abv === 0 || c.abv === null)
    else if (abvFilter.value === 'low')
      list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)

    // Profil gustatif
    if (selectedProfiles.value.length)
      list = list.filter(c => selectedProfiles.value.every(p => c.profile?.includes(p)))

    // Style
    if (selectedStyles.value.length)
      list = list.filter(c => selectedStyles.value.includes(c.cocktail_style))

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
    selectedStyles.value.length     > 0
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
      const family = baseSpirits.value.find(s => s.key === familyKey)
      if (family?.subs.length) {
        const subKeys = family.subs.map(s => s.key)
        selectedSubSpirits.value = selectedSubSpirits.value.filter(k => !subKeys.includes(k))
      }
    }
  }

  function toggleSubSpirit(spiritKey)  { _toggle(selectedSubSpirits, spiritKey) }
  function toggleProfile(profileKey)   { _toggle(selectedProfiles,   profileKey) }
  function toggleStyle(styleKey)       { _toggle(selectedStyles,     styleKey) }

  function toggleFilterMode(mode)      { filterMode.value = mode }
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
    // showOnlyMakeable est intentionnellement conservé entre les changements de filtre
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
    filterMode,
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
    toggleFilterMode,
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