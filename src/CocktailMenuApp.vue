<template>
  <div class="min-h-screen menu-app">

    <!-- Header -->
    <div class="header">
      <div class="header-container">
        <div class="header-top">
          <div class="header-brand">
            <img src="/logo_square.png" alt="Martini Please" class="header-logo" />
            <h1 class="header-title">Martini Please</h1>
          </div>
          <div class="search-container header-search-inline">
            <Search class="search-icon" :size="16" />
            <input type="text" :placeholder="t.searchPlaceholder" v-model="searchTerm" class="search-input" />
          </div>
          <div class="header-right">
            <div class="header-actions">
              <button @click="isBartenderMode ? exitBartenderMode() : showPasswordModal = true" :class="['btn-mode', isBartenderMode ? 'btn-mode-active' : 'btn-mode-inactive']">
                <Unlock v-if="isBartenderMode" :size="15" style="display:inline-block;width:15px;height:15px;flex-shrink:0" />
                <Lock v-else :size="15" style="display:inline-block;width:15px;height:15px;flex-shrink:0" />
                <span class="btn-mode-label">{{ isBartenderMode ? t.drinkerMode : t.bartenderMode }}</span>
              </button>
              <template v-if="isBartenderMode">
                <button @click="openNewCardModal()" class="btn-new-card">
                  <BookOpen :size="15" /><span class="btn-label-hide"> {{ t.newCard }}</span>
                </button>
                <button @click="openNewModal" class="btn-new-cocktail">
                  <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCocktail }}</span>
                </button>
              </template>
              <button @click="locale = locale === 'fr' ? 'en' : 'fr'" class="btn-mode btn-mode-inactive">
                {{ locale === 'fr' ? '🇬🇧' : '🇫🇷' }}
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div class="header-search-row">
          <div class="search-container">
            <Search class="search-icon" :size="16" />
            <input type="text" :placeholder="t.searchPlaceholderShort" v-model="searchTerm" class="search-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main -->
    <div class="main-content">

      <!-- Inventaire -->
      <div v-if="isBartenderMode" class="section-card">
        <button @click="showInventory = !showInventory" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showInventory }" />
          <h2 class="section-title">
            {{ t.stock }}
            <span class="count-badge">{{ selectedCount }} / {{ totalCount }}</span>
          </h2>
          <span></span>
        </button>
        <InventoryManager v-if="showInventory" />
      </div>

      <!-- Filtres + Cartes côte à côte -->
      <div class="side-by-side">

        <!-- Filtres -->
        <div class="section-card">
          <button @click="showFilters = !showFilters" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showFilters }" />
            <h2 class="section-title">{{ t.filterTitle }}</h2>
            <span></span>
          </button>

          <div v-if="showFilters" class="filters-dropdown-content">

            <!-- Mode de filtrage -->
            <div class="filter-group">
              <label class="filter-label">{{ t.filterMode }}</label>
              <div class="filter-mode-toggle">
                <button @click="filterMode = 'main'" :class="['filter-mode-btn', { active: filterMode === 'main' }]">
                  {{ t.filterMain }}
                </button>
                <button @click="filterMode = 'contains'" :class="['filter-mode-btn', { active: filterMode === 'contains' }]">
                  {{ t.filterContains }}
                </button>
              </div>
            </div>

            <!-- Spiritueux de base -->
            <div class="filter-group">
              <label class="filter-label">{{ t.filterSpirits }}</label>
              <div class="chips-container">
                <button
                  v-for="spirit in baseSpirits"
                  :key="spirit.key"
                  @click="toggleFamily(spirit.key)"
                  :class="['chip', { active: selectedFamilies.includes(spirit.key) }]"
                >
                  {{ spirit.label }}
                </button>
              </div>

              <transition name="fade">
                <div v-if="activeSubSpirits.length" class="chips-container chips-container--sub">
                  <button
                    v-for="sub in activeSubSpirits"
                    :key="sub.key"
                    @click="toggleFilter(selectedSubSpirits, sub.key)"
                    :class="['chip chip--sub', { active: selectedSubSpirits.includes(sub.key) }]"
                  >
                    {{ sub.label }}
                  </button>
                </div>
              </transition>
            </div>

            <!-- Liqueurs -->
            <div class="filter-group">
              <label class="filter-label">{{ t.filterLiqueurs }}</label>
              <div class="chips-container">
                <button
                  v-for="liqueur in liqueurFamilies"
                  :key="liqueur.key"
                  @click="toggleFilter(selectedFamilies, liqueur.key)"
                  :class="['chip', { active: selectedFamilies.includes(liqueur.key) }]"
                >
                  {{ liqueur.label }}
                </button>
              </div>
            </div>

            <!-- Saison -->
            <div class="filter-group">
              <label class="filter-label">{{ t.filterSeason }}</label>
              <div class="chips-container">
                <button
                  v-for="season in seasons"
                  :key="season.key"
                  @click="season.key === 'all' ? selectedSeasons = [] : toggleFilter(selectedSeasons, season.key)"
                  :class="['chip', {
                    active: season.key === 'all'
                      ? selectedSeasons.length === 0
                      : selectedSeasons.includes(season.key)
                  }]"
                >
                  {{ season.icon }} {{ season.label }}
                </button>
              </div>
            </div>

            <!-- Disponibilité -->
            <div class="filter-group">
              <label class="filter-label">{{ t.filterAvail }}</label>
              <div class="chips-container">
                <button
                  @click="showOnlyMakeable = !showOnlyMakeable"
                  :class="['chip', { active: showOnlyMakeable }]"
                >
                  {{ t.filterMakeable }}
                </button>
              </div>
            </div>

            <!-- ABV -->
            <div class="filter-group">
              <label class="filter-label">{{ t.filterAbv }}</label>
              <div class="chips-container">
                <button
                  @click="abvFilter = abvFilter === 'mocktail' ? null : 'mocktail'"
                  :class="['chip', { active: abvFilter === 'mocktail' }]"
                >
                  🧃 Mocktail
                </button>
                <button
                  @click="abvFilter = abvFilter === 'low' ? null : 'low'"
                  :class="['chip', { active: abvFilter === 'low' }]"
                >
                  🍃 Low ABV <span class="chip-hint">&lt; 15°</span>
                </button>
              </div>
            </div>

            <!-- Tags actifs -->
            <div v-if="hasActiveFilters" class="active-filters-bar">
              <span v-for="f in selectedFamilies" :key="f" class="filter-tag">
                {{ getFamilyLabel(f) }}
                <X @click="toggleFamily(f)" :size="14" />
              </span>
              <span v-for="s in selectedSubSpirits" :key="s" class="filter-tag filter-tag--sub">
                {{ getSubSpiritLabel(s) }}
                <X @click="toggleFilter(selectedSubSpirits, s)" :size="14" />
              </span>
              <span v-for="s in selectedSeasons" :key="s" class="filter-tag">
                {{ getSeasonLabel(s) }}
                <X @click="toggleFilter(selectedSeasons, s)" :size="14" />
              </span>
              <span v-if="abvFilter === 'mocktail'" class="filter-tag">
                🧃 Mocktail <X @click="abvFilter = null" :size="14" />
              </span>
              <span v-if="abvFilter === 'low'" class="filter-tag">
                🍃 Low ABV <X @click="abvFilter = null" :size="14" />
              </span>
              <button @click="clearFilters" class="clear-all-btn">{{ t.clearAll }}</button>
            </div>
          </div>
        </div>

        <!-- Cartes custom -->
        <div class="section-card">
          <button @click="showCards = !showCards" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showCards }" />
            <h2 class="section-title">
              {{ t.cardsTitle }}
              <span class="count-badge">{{ menuCards.length }}</span>
            </h2>
            <span></span>
          </button>
          <div v-if="showCards" class="cards-content">
            <div v-if="menuCards.length === 0" class="cards-empty">
              {{ t.noCard }}
            </div>
            <div v-else class="cards-grid">
              <div v-for="card in menuCards" :key="card.id" class="menu-card-item">
                <div class="menu-card-info">
                  <span class="menu-card-name">{{ card.name }}</span>
                  <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
                </div>
                <div class="menu-card-actions">
                  <button @click="viewingCard = card" class="btn-icon btn-icon--view" title="Visualiser">
                    <Eye :size="16" />
                  </button>
                  <template v-if="isBartenderMode">
                    <button @click="openEditCardModal(card)" class="btn-icon btn-icon--edit" title="Modifier">
                      <Pencil :size="16" />
                    </button>
                    <button @click="handleDeleteCard(card.id)" class="btn-icon btn-icon--delete" title="Supprimer">
                      <Trash2 :size="16" />
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div><!-- fin side-by-side -->

      <!-- Liste cocktails -->
      <div>
        <h2 class="cocktails-header">
          {{ filteredCocktails.length }}
          {{ locale === 'fr'
            ? `cocktail${filteredCocktails.length > 1 ? 's' : ''} trouvé${filteredCocktails.length > 1 ? 's' : ''}`
            : `cocktail${filteredCocktails.length > 1 ? 's' : ''} found`
          }}
          <span v-if="showOnlyMakeable" class="cocktails-header-makeable">
            ({{ makeableCount }} {{ locale === 'fr' ? 'réalisables' : 'available' }})
          </span>
        </h2>
        <div v-if="cocktailsLoading" class="loading-state">{{ t.loading }}</div>
        <div v-else-if="filteredCocktails.length === 0" class="empty-state">{{ t.noResult }}</div>
        <div v-else class="cocktails-grid">
          <CocktailCard
            v-for="cocktail in filteredCocktails"
            :key="cocktail.id"
            :cocktail="cocktail"
            :isBartenderMode="isBartenderMode"
            :locale="locale"
            @edit="openEditModal"
            @delete="handleDelete"
          />
        </div>
      </div>

    </div>

    <PasswordModal v-if="showPasswordModal" @close="showPasswordModal = false" @success="enterBartenderMode" />
    <MenuCardView v-if="viewingCard" :card="viewingCard" :cocktails="cocktails" @close="viewingCard = null" />
    <MenuCardModal v-if="showCardModal" :card="editingCard" :cocktails="cocktails" @save="handleSaveCard" @close="showCardModal = false" />
    <CocktailModal v-if="showCocktailModal" :cocktail="editingCocktail" @save="handleSave" @close="showCocktailModal = false" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, ChevronDown, X, Plus, BookOpen, Pencil, Trash2, Eye, Lock, Unlock } from 'lucide-vue-next'

import { useCocktails } from '@/composables/useCocktails'
import { useInventory } from '@/composables/useInventory'
import { useMenuCards } from '@/composables/useMenuCards'

import CocktailCard from '@/Components/CocktailCard.vue'
import InventoryManager from '@/Components/Modals/InventoryManager.vue'
import CocktailModal from '@/Components/Modals/CocktailModal.vue'
import MenuCardModal from '@/Components/Modals/MenuCardModal.vue'
import MenuCardView from '@/Components/MenuCardView.vue'
import PasswordModal from '@/Components/Modals/PasswordModal.vue'
import ThemeToggle from '@/Components/ThemeToggle.vue'
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'

const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients } = useInventory()
const { menuCards, fetchMenuCards, createMenuCard, updateMenuCard, deleteMenuCard } = useMenuCards()

// Mode bartender
const isBartenderMode   = ref(false)
const showPasswordModal = ref(false)
function enterBartenderMode() { isBartenderMode.value = true }
function exitBartenderMode()  { isBartenderMode.value = false }

// UI
const showInventory     = ref(false)
const showFilters       = ref(false)
const showCards         = ref(false)
const showCocktailModal = ref(false)
const showCardModal     = ref(false)
const editingCocktail   = ref(null)
const editingCard       = ref(null)
const viewingCard       = ref(null)
const locale            = ref('fr')

// Traductions
const t = computed(() => ({
  filterTitle:            locale.value === 'fr' ? '🔍 Filtres'                          : '🔍 Filters',
  cardsTitle:             locale.value === 'fr' ? '📜 Cartes'                           : '📜 Cards',
  bartenderMode:          locale.value === 'fr' ? 'Mode Bartender'                      : 'Bartender Mode',
  drinkerMode:            locale.value === 'fr' ? 'Mode Drinker'                        : 'Drinker Mode',
  newCard:                locale.value === 'fr' ? 'Nouvelle carte'                      : 'New card',
  newCocktail:            locale.value === 'fr' ? 'Nouveau cocktail'                    : 'New cocktail',
  searchPlaceholder:      locale.value === 'fr' ? 'Rechercher un cocktail ou un ingrédient...' : 'Search a cocktail or ingredient...',
  searchPlaceholderShort: locale.value === 'fr' ? 'Rechercher...'                       : 'Search...',
  filterMode:             locale.value === 'fr' ? 'Mode de recherche'                   : 'Search mode',
  filterMain:             locale.value === 'fr' ? '🎯 Ingrédient principal'             : '🎯 Main ingredient',
  filterContains:         locale.value === 'fr' ? '🔍 Contient'                         : '🔍 Contains',
  filterSpirits:          locale.value === 'fr' ? 'Spiritueux de base'                  : 'Base spirits',
  filterLiqueurs:         locale.value === 'fr' ? 'Liqueurs'                            : 'Liqueurs',
  filterSeason:           locale.value === 'fr' ? 'Saison'                              : 'Season',
  filterAvail:            locale.value === 'fr' ? 'Disponibilité'                       : 'Availability',
  filterMakeable:         locale.value === 'fr' ? '🍸 Cocktails réalisables'            : '🍸 Available cocktails',
  filterAbv:              locale.value === 'fr' ? 'Alcool'                              : 'Alcohol',
  clearAll:               locale.value === 'fr' ? 'Effacer tout'                        : 'Clear all',
  noCard:                 locale.value === 'fr' ? 'Aucune carte créée — crée ta première carte !' : 'No card yet — create your first one!',
  loading:                locale.value === 'fr' ? 'Chargement des cocktails...'          : 'Loading cocktails...',
  noResult:               locale.value === 'fr' ? 'Aucun cocktail trouvé avec ces critères' : 'No cocktail found with these filters',
  stock:                  locale.value === 'fr' ? '📦 Stock du bar'                     : '📦 Bar stock',
  deleteCard:             locale.value === 'fr' ? 'Supprimer cette carte ?'             : 'Delete this card?',
  deleteCocktail:         locale.value === 'fr' ? 'Supprimer ce cocktail ?'             : 'Delete this cocktail?',
}))

// Filtres
const searchTerm         = ref('')
const selectedFamilies   = ref([])
const selectedSubSpirits = ref([])
const selectedSeasons    = ref([])
const showOnlyMakeable   = ref(false)
const filterMode         = ref('main')
const abvFilter          = ref(null)

// ── Référentiels ──────────────────────────────────────────────────────────────

const baseSpirits = computed(() => [
  {
    key: 'Whiskey', label: getFL('Whiskey', locale.value),
    subs: [
      { key: 'bourbon',       label: getFL('bourbon', locale.value)       },
      { key: 'rye',           label: getFL('rye', locale.value)           },
      { key: 'scotch',        label: getFL('scotch', locale.value)        },
      { key: 'irish_whiskey', label: getFL('irish_whiskey', locale.value) },
      { key: 'peated_whisky', label: getFL('peated_whisky', locale.value) },
      { key: 'whiskey',       label: getFL('whiskey', locale.value)       },
    ]
  },
  {
    key: 'Rum', label: getFL('Rum', locale.value),
    subs: [
      { key: 'rum',           label: getFL('rum', locale.value)           },
      { key: 'rum_agricol',   label: getFL('rum_agricol', locale.value)   },
      { key: 'rum_jamaican',  label: getFL('rum_jamaican', locale.value)  },
      { key: 'rum_cuban',     label: getFL('rum_cuban', locale.value)     },
      { key: 'rum_overproof', label: getFL('rum_overproof', locale.value) },
      { key: 'cachaca',       label: getFL('cachaca', locale.value)       },
    ]
  },
  {
    key: 'Agave', label: getFL('Agave', locale.value),
    subs: [
      { key: 'tequila',          label: getFL('tequila', locale.value)          },
      { key: 'tequila_reposado', label: getFL('tequila_reposado', locale.value) },
      { key: 'mezcal',           label: getFL('mezcal', locale.value)           },
    ]
  },
  {
    key: 'Gin', label: getFL('Gin', locale.value),
    subs: [
      { key: 'gin',      label: getFL('gin', locale.value)      },
      { key: 'gin_dry',  label: getFL('gin_dry', locale.value)  },
      { key: 'gin_navy', label: getFL('gin_navy', locale.value) },
      { key: 'genever',  label: getFL('genever', locale.value)  },
    ]
  },
  {
    key: 'Brandy', label: getFL('Brandy', locale.value),
    subs: [
      { key: 'cognac',   label: getFL('cognac', locale.value)   },
      { key: 'calvados', label: getFL('calvados', locale.value) },
      { key: 'pisco',    label: getFL('pisco', locale.value)    },
      { key: 'grappa',   label: getFL('grappa', locale.value)   },
      { key: 'brandy',   label: getFL('brandy', locale.value)   },
    ]
  },
  { key: 'Vodka',    label: getFL('Vodka', locale.value),    subs: [] },
  { key: 'Absinthe', label: getFL('Absinthe', locale.value), subs: [] },
  { key: 'Aquavit',  label: getFL('Aquavit', locale.value),  subs: [] },
])

const liqueurFamilies = computed(() => [
  { key: 'Liqueur Amer',    label: getFL('Liqueur Amer', locale.value)    },
  { key: 'Liqueur Agrume',  label: getFL('Liqueur Agrume', locale.value)  },
  { key: 'Liqueur Fruits',  label: getFL('Liqueur Fruits', locale.value)  },
  { key: 'Liqueur Herbes',  label: getFL('Liqueur Herbes', locale.value)  },
  { key: 'Liqueur Noix',    label: getFL('Liqueur Noix', locale.value)    },
  { key: 'Liqueur Dessert', label: getFL('Liqueur Dessert', locale.value) },
  { key: 'Liqueur Anisée',  label: getFL('Liqueur Anisée', locale.value)  },
])

const seasons = computed(() => [
  { key: 'all',    icon: '🍸', label: locale.value === 'fr' ? 'Toutes'    : 'All'    },
  { key: 'spring', icon: '🌸', label: locale.value === 'fr' ? 'Printemps' : 'Spring' },
  { key: 'summer', icon: '☀️', label: locale.value === 'fr' ? 'Été'       : 'Summer' },
  { key: 'fall',   icon: '🍂', label: locale.value === 'fr' ? 'Automne'   : 'Fall'   },
  { key: 'winter', icon: '❄️', label: locale.value === 'fr' ? 'Hiver'     : 'Winter' },
])

const allFamilyLabels = computed(() => Object.fromEntries([
  ...baseSpirits.value.map(s => [s.key, s.label]),
  ...liqueurFamilies.value.map(l => [l.key, l.label]),
]))

const allSubLabels = computed(() => Object.fromEntries(
  baseSpirits.value.flatMap(s => s.subs.map(sub => [sub.key, sub.label]))
))

// ── Sous-types actifs ─────────────────────────────────────────────────────────
const activeSubSpirits = computed(() => {
  const subs = []
  for (const family of baseSpirits.value) {
    if (selectedFamilies.value.includes(family.key) && family.subs.length) {
      subs.push(...family.subs)
    }
  }
  return subs
})

// ── Helpers filtres ───────────────────────────────────────────────────────────
function toggleFilter(array, value) {
  const idx = array.indexOf(value)
  if (idx > -1) array.splice(idx, 1)
  else array.push(value)
}

function toggleFamily(familyKey) {
  const isActive = selectedFamilies.value.includes(familyKey)
  toggleFilter(selectedFamilies.value, familyKey)
  if (isActive) {
    const family = baseSpirits.value.find(s => s.key === familyKey)
    if (family?.subs.length) {
      const subKeys = family.subs.map(s => s.key)
      selectedSubSpirits.value = selectedSubSpirits.value.filter(k => !subKeys.includes(k))
    }
  }
}

function clearFilters() {
  selectedFamilies.value   = []
  selectedSubSpirits.value = []
  selectedSeasons.value    = []
  abvFilter.value          = null
}

function getFamilyLabel(key)    { return allFamilyLabels.value[key] ?? key }
function getSubSpiritLabel(key) { return allSubLabels.value[key] ?? key }
function getSeasonLabel(key) {
  const s = seasons.value.find(s => s.key === key)
  return s ? `${s.icon} ${s.label}` : key
}

// ── Stats inventaire ──────────────────────────────────────────────────────────
const selectedCount = computed(() => barInventory.value.size)
const totalCount    = computed(() => ingredients.value.length)

function isMakeable(cocktail) {
  const recipe = cocktail.recipe || []
  if (!recipe.length) return false
  return recipe.every(ing => ing.Type === 'garnish' || barInventory.value.has(ing.Type))
}
const makeableCount = computed(() => cocktails.value.filter(isMakeable).length)

// ── Filtrage ──────────────────────────────────────────────────────────────────
const filteredCocktails = computed(() => {
  let list = cocktails.value

  if (searchTerm.value.trim()) {
    const s = searchTerm.value.toLowerCase().trim()
    list = list.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.recipe?.some(ing => ing.Ingredient?.toLowerCase().includes(s)) ||
      c.creator?.toLowerCase().includes(s) ||
      c.profile?.some(p => p.toLowerCase().includes(s))
    )
  }

  if (selectedFamilies.value.length || selectedSubSpirits.value.length) {
    const activeSubs     = selectedSubSpirits.value
    const activeFamilies = selectedFamilies.value

    const typeToFamily = {}
    for (const family of baseSpirits.value) {
      for (const sub of family.subs) {
        typeToFamily[sub.key] = family.key
      }
      typeToFamily[family.key.toLowerCase()] = family.key
    }

    list = list.filter(c => {
      if (filterMode.value === 'main') {
        const familyMatch = activeFamilies.length === 0 || activeFamilies.includes(c.category)
        const subMatch    = activeSubs.length === 0     || activeSubs.includes(c.base_spirit)
        return familyMatch && subMatch
      } else {
        const recipeTypes = (c.recipe || []).map(ing => ing.Type)
        if (activeSubs.length) {
          return activeSubs.some(sub => recipeTypes.includes(sub))
        }
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

  if (selectedSeasons.value.length) {
    list = list.filter(c =>
      Array.isArray(c.season)
        ? c.season.some(s => selectedSeasons.value.includes(s))
        : selectedSeasons.value.includes(c.season)
    )
  }

  if (showOnlyMakeable.value) {
    list = list.filter(isMakeable)
  }

  if (abvFilter.value === 'mocktail') {
    list = list.filter(c => c.abv === 0 || c.abv === null)
  } else if (abvFilter.value === 'low') {
    list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)
  }

  return list
})

const hasActiveFilters = computed(() =>
  selectedFamilies.value.length > 0 ||
  selectedSubSpirits.value.length > 0 ||
  selectedSeasons.value.length > 0 ||
  abvFilter.value !== null
)

// ── CRUD menu cards ───────────────────────────────────────────────────────────
function openNewCardModal()      { editingCard.value = null; showCardModal.value = true }
function openEditCardModal(card) { editingCard.value = card; showCardModal.value = true }

async function handleSaveCard(data) {
  if (data.id) await updateMenuCard(data.id, data)
  else         await createMenuCard(data)
  showCardModal.value = false
}
async function handleDeleteCard(id) {
  if (!confirm(t.value.deleteCard)) return
  await deleteMenuCard(id)
}

// ── CRUD cocktails ────────────────────────────────────────────────────────────
function openEditModal(cocktail) { editingCocktail.value = cocktail; showCocktailModal.value = true }
function openNewModal()          { editingCocktail.value = null;      showCocktailModal.value = true }

async function handleSave(data) {
  if (data.id) await updateCocktail(data.id, data)
  else         await createCocktail(data)
  showCocktailModal.value = false
}
async function handleDelete(id) {
  if (!confirm(t.value.deleteCocktail)) return
  await deleteCocktail(id)
}

onMounted(async () => {
  await Promise.all([fetchCocktails(), fetchIngredients(), fetchMenuCards()])
})
</script>