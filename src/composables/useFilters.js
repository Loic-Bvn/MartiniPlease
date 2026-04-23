// composables/useFilters.js
import { computed } from 'vue'
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'

export function useFilters(props, emit) {

  const baseSpirits = computed(() => [
    { key: 'Whiskey', label: getFL('Whiskey', props.locale), subs: [
      { key: 'bourbon',       label: getFL('bourbon', props.locale)       },
      { key: 'rye',           label: getFL('rye', props.locale)           },
      { key: 'scotch',        label: getFL('scotch', props.locale)        },
      { key: 'irish_whiskey', label: getFL('irish_whiskey', props.locale) },
      { key: 'peated_whisky', label: getFL('peated_whisky', props.locale) },
      { key: 'whiskey',       label: getFL('whiskey', props.locale)       },
    ]},
    { key: 'Rum', label: getFL('Rum', props.locale), subs: [
      { key: 'rum',           label: getFL('rum', props.locale)           },
      { key: 'rum_agricol',   label: getFL('rum_agricol', props.locale)   },
      { key: 'rum_jamaican',  label: getFL('rum_jamaican', props.locale)  },
      { key: 'rum_cuban',     label: getFL('rum_cuban', props.locale)     },
      { key: 'rum_overproof', label: getFL('rum_overproof', props.locale) },
      { key: 'cachaca',       label: getFL('cachaca', props.locale)       },
    ]},
    { key: 'Agave', label: getFL('Agave', props.locale), subs: [
      { key: 'tequila',          label: getFL('tequila', props.locale)          },
      { key: 'tequila_reposado', label: getFL('tequila_reposado', props.locale) },
      { key: 'mezcal',           label: getFL('mezcal', props.locale)           },
    ]},
    { key: 'Gin', label: getFL('Gin', props.locale), subs: [
      { key: 'gin',      label: getFL('gin', props.locale)      },
      { key: 'gin_dry',  label: getFL('gin_dry', props.locale)  },
      { key: 'gin_navy', label: getFL('gin_navy', props.locale) },
      { key: 'genever',  label: getFL('genever', props.locale)  },
    ]},
    { key: 'Brandy', label: getFL('Brandy', props.locale), subs: [
      { key: 'cognac',   label: getFL('cognac', props.locale)   },
      { key: 'calvados', label: getFL('calvados', props.locale) },
      { key: 'pisco',    label: getFL('pisco', props.locale)    },
      { key: 'grappa',   label: getFL('grappa', props.locale)   },
      { key: 'brandy',   label: getFL('brandy', props.locale)   },
    ]},
    { key: 'Vodka',    label: getFL('Vodka', props.locale),    subs: [] },
    { key: 'Absinthe', label: getFL('Absinthe', props.locale), subs: [] },
    { key: 'Aquavit',  label: getFL('Aquavit', props.locale),  subs: [] },
  ])

  const liqueurFamilies = computed(() => [
    { key: 'Liqueur Amer',    label: getFL('Liqueur Amer', props.locale)    },
    { key: 'Liqueur Agrume',  label: getFL('Liqueur Agrume', props.locale)  },
    { key: 'Liqueur Fruits',  label: getFL('Liqueur Fruits', props.locale)  },
    { key: 'Liqueur Herbes',  label: getFL('Liqueur Herbes', props.locale)  },
    { key: 'Liqueur Noix',    label: getFL('Liqueur Noix', props.locale)    },
    { key: 'Liqueur Dessert', label: getFL('Liqueur Dessert', props.locale) },
    { key: 'Liqueur Anisée',  label: getFL('Liqueur Anisée', props.locale)  },
  ])

  const profileFilters = computed(() => {
    const labels = {
      Smoky: props.locale === 'fr' ? 'Fumé' : 'Smoky',
      Bitter: props.locale === 'fr' ? 'Amer' : 'Bitter',
      Creamy: props.locale === 'fr' ? 'Crémeux' : 'Creamy',
      Tropical: 'Tropical',
      Floral: 'Floral',
      Nutty: props.locale === 'fr' ? 'Noisetté' : 'Nutty',
      Spicy: props.locale === 'fr' ? 'Épicé' : 'Spicy',
      Herbal: props.locale === 'fr' ? 'Herbacé' : 'Herbal',
      Fruity: props.locale === 'fr' ? 'Fruité' : 'Fruity',
      Citrus: props.locale === 'fr' ? 'Agrume' : 'Citrus',
      Sour: props.locale === 'fr' ? 'Acidulé' : 'Sour',
      Dry: props.locale === 'fr' ? 'Sec' : 'Dry',
      Boozy: props.locale === 'fr' ? 'Corsé' : 'Boozy',
      Refreshing: props.locale === 'fr' ? 'Frais' : 'Refreshing',
      Rich: props.locale === 'fr' ? 'Riche' : 'Rich',
      Sweet: props.locale === 'fr' ? 'Sucré' : 'Sweet',
    }
    return Object.entries(labels).map(([key, label]) => ({ key, label }))
  })

  const styleFilters = computed(() => {
    const labels = {
      sour:          props.locale === 'fr' ? '🍋 Sour'          : '🍋 Sour',
      fizz:          props.locale === 'fr' ? '🫧 Fizz'          : '🫧 Fizz',
      highball:      props.locale === 'fr' ? '🥃 Highball'      : '🥃 Highball',
      tiki:          props.locale === 'fr' ? '🌺 Tiki'          : '🌺 Tiki',
      negroni:       props.locale === 'fr' ? '🔴 Negroni'       : '🔴 Negroni',
      old_fashioned: props.locale === 'fr' ? '🟠 Old Fashioned' : '🟠 Old Fashioned',
      classic:       props.locale === 'fr' ? '🎩 Classique'     : '🎩 Classic',
      modern:        props.locale === 'fr' ? '✨ Moderne'        : '✨ Modern',
      creamy:        props.locale === 'fr' ? '🥛 Crémeux'       : '🥛 Creamy',
      flip:          props.locale === 'fr' ? '🥚 Flip'          : '🥚 Flip',
      spritz:        props.locale === 'fr' ? '🍾 Spritz'        : '🍾 Spritz',
    }
    return Object.entries(labels).map(([key, label]) => ({ key, label }))
  })

  const seasons = computed(() => [
    { key: 'all',    icon: '🍸', label: props.locale === 'fr' ? 'Toutes'    : 'All'    },
    { key: 'spring', icon: '🌸', label: props.locale === 'fr' ? 'Printemps' : 'Spring' },
    { key: 'summer', icon: '☀️', label: props.locale === 'fr' ? 'Été'       : 'Summer' },
    { key: 'fall',   icon: '🍂', label: props.locale === 'fr' ? 'Automne'   : 'Fall'   },
    { key: 'winter', icon: '❄️', label: props.locale === 'fr' ? 'Hiver'     : 'Winter' },
  ])

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
      if (props.selectedFamilies.includes(family.key) && family.subs.length)
        subs.push(...family.subs)
    }
    return subs
  })

  function isMakeable(cocktail) {
    const recipe = cocktail.recipe || []
    if (!recipe.length) return false
    return recipe.every(ing => ing.Type === 'garnish' || props.barInventory.has(ing.Type))
  }

  const makeableCount   = computed(() => props.cocktails.filter(isMakeable).length)

  const filteredCocktails = computed(() => {
    let list = props.cocktails

    if (props.searchTerm.trim()) {
      const s = props.searchTerm.toLowerCase().trim()
      list = list.filter(c =>
        c.name?.toLowerCase().includes(s) ||
        c.recipe?.some(ing => ing.Ingredient?.toLowerCase().includes(s)) ||
        c.creator?.toLowerCase().includes(s) ||
        c.profile?.some(p => p.toLowerCase().includes(s))
      )
    }

    if (props.selectedFamilies.length || props.selectedSubSpirits.length) {
      list = list.filter(c => {
        if (props.filterMode === 'main') {
          const familyMatch = !props.selectedFamilies.length || props.selectedFamilies.includes(c.category)
          const subMatch    = !props.selectedSubSpirits.length || props.selectedSubSpirits.includes(c.base_spirit)
          return familyMatch && subMatch
        } else {
          const recipeTypes = (c.recipe || []).map(ing => ing.Type)
          if (props.selectedSubSpirits.length)
            return props.selectedSubSpirits.some(sub => recipeTypes.includes(sub))
          return props.selectedFamilies.some(family => {
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

    if (props.selectedSeasons.length)
      list = list.filter(c =>
        Array.isArray(c.season)
          ? c.season.some(s => props.selectedSeasons.includes(s))
          : props.selectedSeasons.includes(c.season)
      )

    if (props.showOnlyMakeable) list = list.filter(isMakeable)

    if (props.abvFilter === 'mocktail')
      list = list.filter(c => c.abv === 0 || c.abv === null)
    else if (props.abvFilter === 'low')
      list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)

    if (props.selectedProfiles.length)
      list = list.filter(c => props.selectedProfiles.every(p => c.profile?.includes(p)))

    if (props.selectedStyles.length)
      list = list.filter(c => props.selectedStyles.includes(c.cocktail_style))

    if (props.showOnlyFavorites && props.hasDrinker)
      list = list.filter(c => props.favorites.has(c.id))

    return list
  })

  const hasActiveFilters = computed(() =>
    props.selectedFamilies.length > 0 ||
    props.selectedSubSpirits.length > 0 ||
    props.selectedSeasons.length > 0 ||
    props.selectedProfiles.length > 0 ||
    props.abvFilter !== null ||
    props.showOnlyFavorites ||
    props.selectedStyles.length > 0
  )

  function toggleFilter(arrayRef, value) { emit('toggle-filter', arrayRef, value) }
  function toggleFamily(familyKey)       { emit('toggle-family', familyKey) }
  function clearFilters()                { emit('clear-filters') }
  function getFamilyLabel(key)           { return allFamilyLabels.value[key] ?? key }
  function getSubSpiritLabel(key)        { return allSubLabels.value[key] ?? key }

  return {
    baseSpirits, liqueurFamilies, profileFilters, styleFilters, seasons,
    activeSubSpirits, makeableCount, filteredCocktails, hasActiveFilters,
    toggleFilter, toggleFamily, clearFilters, getFamilyLabel, getSubSpiritLabel,
  }
}