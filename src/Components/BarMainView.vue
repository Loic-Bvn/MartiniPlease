<template>
  <div class="main-content">

    <!-- Inventaire (bartender mode) -->
    <div v-if="isLoggedIn" class="section-card">
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

    <!-- Filtres + Cartes + Profil drinker côte à côte -->
    <div class="side-by-side">

      <!-- Filtres -->
      <div class="section-card">
        <button @click="showFilters = !showFilters" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showFilters }" />
          <h2 class="section-title">{{ t.filterTitle }}</h2>
          <span></span>
        </button>

        <div v-if="showFilters" class="filters-dropdown-content">

          <div class="filter-group">
            <label class="filter-label">{{ t.filterMode }}</label>
            <div class="filter-mode-toggle">
              <button @click="filterMode = filterMode === 'main' ? 'contains' : 'main'" :class="['filter-mode-btn', { active: filterMode === 'main' }]">
                {{ t.filterMain }}
              </button>
              <button @click="filterMode = filterMode === 'main' ? 'contains' : 'main'" :class="['filter-mode-btn', { active: filterMode === 'contains' }]">
                {{ t.filterContains }}
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t.filterSpirits }}</label>
            <div class="chips-container">
              <button
                v-for="spirit in baseSpirits"
                :key="spirit.key"
                @click="toggleFamily(spirit.key)"
                :class="['chip', { active: selectedFamilies.includes(spirit.key) }]"
              >{{ spirit.label }}</button>
            </div>
            <transition name="fade">
              <div v-if="activeSubSpirits.length" class="chips-container chips-container--sub">
                <button
                  v-for="sub in activeSubSpirits"
                  :key="sub.key"
                  @click="toggleFilter(selectedSubSpirits, sub.key)"
                  :class="['chip chip--sub', { active: selectedSubSpirits.includes(sub.key) }]"
                >{{ sub.label }}</button>
              </div>
            </transition>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t.filterLiqueurs }}</label>
            <div class="chips-container">
              <button
                v-for="liqueur in liqueurFamilies"
                :key="liqueur.key"
                @click="toggleFilter(selectedFamilies, liqueur.key)"
                :class="['chip', { active: selectedFamilies.includes(liqueur.key) }]"
              >{{ liqueur.label }}</button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t.filterSeason }}</label>
            <div class="chips-container">
              <button
                v-for="season in seasons"
                :key="season.key"
                @click="season.key === 'all' ? selectedSeasons = [] : toggleFilter(selectedSeasons, season.key)"
                :class="['chip', { active: season.key === 'all' ? selectedSeasons.length === 0 : selectedSeasons.includes(season.key) }]"
              >{{ season.icon }} {{ season.label }}</button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t.filterAvail }}</label>
            <div class="chips-container">
              <button @click="showOnlyMakeable = !showOnlyMakeable" :class="['chip', { active: showOnlyMakeable }]">
                {{ t.filterMakeable }}
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t.filterAbv }}</label>
            <div class="chips-container">
              <button @click="abvFilter = abvFilter === 'mocktail' ? null : 'mocktail'" :class="['chip', { active: abvFilter === 'mocktail' }]">
                🧃 Mocktail
              </button>
              <button @click="abvFilter = abvFilter === 'low' ? null : 'low'" :class="['chip', { active: abvFilter === 'low' }]">
                🍃 Low ABV <span class="chip-hint">&lt; 15°</span>
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t.filterProfile }}</label>
            <div class="chips-container">
              <button
                v-for="p in profileFilters"
                :key="p.key"
                @click="toggleFilter(selectedProfiles, p.key)"
                :class="['chip', { active: selectedProfiles.includes(p.key) }]"
              >{{ p.label }}</button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t.filterStyle }}</label>
            <div class="chips-container">
              <button
                v-for="s in styleFilters"
                :key="s.key"
                @click="toggleFilter(selectedStyles, s.key)"
                :class="['chip', { active: selectedStyles.includes(s.key) }]"
              >{{ s.label }}</button>
            </div>
          </div>

          <!-- Filtre favoris (si drinker connecté) -->
          <div v-if="hasDrinker" class="filter-group">
            <label class="filter-label">{{ locale === 'fr' ? 'Mes favoris' : 'My favorites' }}</label>
            <div class="chips-container">
              <button @click="showOnlyFavorites = !showOnlyFavorites" :class="['chip', { active: showOnlyFavorites }]">
                ❤️ {{ locale === 'fr' ? 'Mes favoris uniquement' : 'My favorites only' }}
              </button>
            </div>
          </div>

          <div v-if="hasActiveFilters" class="active-filters-bar">
            <span v-for="f in selectedFamilies" :key="f" class="filter-tag">
              {{ getFamilyLabel(f) }}<X @click="toggleFamily(f)" :size="14" />
            </span>
            <span v-for="s in selectedSubSpirits" :key="s" class="filter-tag filter-tag--sub">
              {{ getSubSpiritLabel(s) }}<X @click="toggleFilter(selectedSubSpirits, s)" :size="14" />
            </span>
            <span v-if="abvFilter === 'mocktail'" class="filter-tag">
              🧃 Mocktail <X @click="abvFilter = null" :size="14" />
            </span>
            <span v-if="abvFilter === 'low'" class="filter-tag">
              🍃 Low ABV <X @click="abvFilter = null" :size="14" />
            </span>
            <span v-for="p in selectedProfiles" :key="p" class="filter-tag">
              {{ profileFilters.find(f => f.key === p)?.label }}
              <X @click="toggleFilter(selectedProfiles, p)" :size="14" />
            </span>
            <span v-for="s in selectedStyles" :key="s" class="filter-tag">
              {{ styleFilters.find(f => f.key === s)?.label }}
              <X @click="toggleFilter(selectedStyles, s)" :size="14" />
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
          <div v-if="menuCards.length === 0" class="cards-empty">{{ t.noCard }}</div>
          <div v-else class="cards-grid">
            <div v-for="card in menuCards" :key="card.id" class="menu-card-item" @click="$emit('view-card', card)" style="cursor: pointer;">
              <div class="menu-card-info">
                <span class="menu-card-name">{{ card.name }}</span>
                <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
              </div>
              <div class="menu-card-actions" @click.stop>
                <button class="btn-icon btn-icon--view" title="Visualiser" style="pointer-events: none;">
                  <Eye :size="16" />
                </button>
                <template v-if="isLoggedIn">
                  <button @click="$emit('edit-card', card)" class="btn-icon btn-icon--edit" title="Modifier" style="pointer-events: auto;">
                    <Pencil :size="16" />
                  </button>
                  <button @click="$emit('delete-card', card.id)" class="btn-icon btn-icon--delete" title="Supprimer" style="pointer-events: auto;">
                    <Trash2 :size="16" />
                  </button>
                </template>
              </div>
            </div>
          </div>
          <button v-if="isLoggedIn" @click="$emit('new-card')" class="btn-new-card">
            <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCard }}</span>
          </button>
        </div>
      </div>

      <!-- Profil drinker (visible uniquement si connecté en tant que drinker) -->
      <div v-if="hasDrinker" class="section-card">
        <button @click="showDrinkerPanel = !showDrinkerPanel" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showDrinkerPanel }" />
          <h2 class="section-title">
            👤 {{ drinkerPseudo }}
          </h2>
          <span></span>
        </button>
        <div v-if="showDrinkerPanel" class="filters-dropdown-content">

          <!-- Tabs Favoris / Historique -->
          <div class="auth-tabs" style="margin-bottom: 12px; border-bottom: 1px solid var(--color-border-tertiary);">
            <button :class="['auth-tab', { active: drinkerTab === 'favorites' }]" @click="drinkerTab = drinkerTab === 'favorites' ? 'history' : 'favorites'">
              ❤️ {{ locale === 'fr' ? 'Favoris' : 'Favorites' }}
              <span class="count-badge">{{ favorites.size }}</span>
            </button>
            <button :class="['auth-tab', { active: drinkerTab === 'history' }]" @click="drinkerTab = drinkerTab === 'favorites' ? 'history' : 'favorites'">
              🕐 {{ locale === 'fr' ? 'Historique' : 'History' }}
              <span class="count-badge">{{ history.length }}</span>
            </button>
          </div>

          <!-- Favoris -->
          <div v-if="drinkerTab === 'favorites'">
            <div v-if="favorites.size === 0" class="cards-empty">
              {{ locale === 'fr' ? 'Aucun favori pour l\'instant.' : 'No favorites yet.' }}
            </div>
            <div v-else class="cards-grid">
              <div v-for="cocktail in favoriteCocktails" :key="cocktail.id" class="menu-card-item">
                <span class="menu-card-name">{{ cocktail.name }}</span>
                <button @click="$emit('toggle-favorite', cocktail.id)" class="btn-icon btn-icon--delete" title="Retirer">
                  <Heart :size="14" fill="currentColor" style="color: #e05c6e" />
                </button>
              </div>
            </div>
          </div>

          <!-- Historique -->
          <div v-if="drinkerTab === 'history'">
            <div v-if="history.length === 0" class="cards-empty">
              {{ locale === 'fr' ? 'Aucune commande encore.' : 'No orders yet.' }}
            </div>
            <div v-else class="cards-grid">
              <div v-for="(entry, i) in history" :key="i" class="menu-card-item">
                <span class="menu-card-name">{{ getCocktailName(entry.cocktail_id) }}</span>
                <span class="menu-card-count">{{ formatDate(entry.ordered_at) }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Commandes en attente (bartender mode) -->
      <div v-if="isLoggedIn" class="section-card">
        <button @click="showOrdersPanel = !showOrdersPanel" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showOrdersPanel }" />
          <h2 class="section-title">
            🍸 {{ locale === 'fr' ? 'Commandes' : 'Orders' }}
            <span v-if="pendingOrdersCount > 0" class="count-badge pending-badge">{{ pendingOrdersCount }}</span>
          </h2>
          <span></span>
        </button>
        <div v-if="showOrdersPanel" class="filters-dropdown-content">
          <OrdersPanel :locale="locale" :unit="unit" />
        </div>
      </div>

    </div>

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
      <div v-else-if="filteredCocktails.length === 0" class="empty-state-enhanced">
        <div class="empty-state-icon">🍹</div>
        <h3 class="empty-state-title">{{ locale === 'fr' ? 'Aucun cocktail trouvé' : 'No cocktails found' }}</h3>
        <p class="empty-state-message">
          {{ locale === 'fr' 
            ? 'Essayez d\'ajuster vos filtres ou de chercher un autre ingrédient.' 
            : 'Try adjusting your filters or search for another ingredient.' 
          }}
        </p>
        <div class="empty-state-actions">
          <button v-if="hasActiveFilters" @click="clearFilters" class="empty-state-btn empty-state-btn-primary">
            {{ locale === 'fr' ? 'Effacer les filtres' : 'Clear filters' }}
          </button>
          <button v-if="isLoggedIn" @click="$emit('new-cocktail')" class="empty-state-btn empty-state-btn-primary">
            {{ locale === 'fr' ? '+ Créer un cocktail' : '+ Create cocktail' }}
          </button>
        </div>
      </div>
      <div v-else class="cocktails-grid">
        <div v-for="cocktail in filteredCocktails" :key="cocktail.id" :id="`cocktail-${cocktail.id}`">
          <CocktailCard
            :cocktail="cocktail"
            :isBartenderMode="isLoggedIn"
            :locale="locale"
            :unit="unit"
            :bar-id="activeBarId"
            @edit="$emit('edit-cocktail', cocktail)"
            @delete="$emit('delete-cocktail', cocktail.id)"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronDown, X, Plus, Pencil, Trash2, Eye, Heart } from 'lucide-vue-next'

import InventoryManager from '@/Components/Modals/InventoryManager.vue'
import OrdersPanel from '@/Components/OrdersPanel.vue'
import CocktailCard from '@/Components/CocktailCard.vue'
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'

const props = defineProps({
  isLoggedIn: Boolean,
  activeBarId: String,
  cocktails: Array,
  cocktailsLoading: Boolean,
  menuCards: Array,
  hasDrinker: Boolean,
  drinkerPseudo: String,
  favorites: Set,
  history: Array,
  pendingOrdersCount: Number,
  locale: String,
  unit: String,
  barInventory: Set,
  ingredients: Array,
  searchTerm: String,
  selectedFamilies: Array,
  selectedSubSpirits: Array,
  selectedSeasons: Array,
  showOnlyMakeable: Boolean,
  showOnlyFavorites: Boolean,
  filterMode: String,
  abvFilter: String,
  selectedProfiles: Array,
  selectedStyles: Array,
})

const emit = defineEmits([
  'view-card',
  'edit-card',
  'delete-card',
  'new-card',
  'toggle-favorite',
  'edit-cocktail',
  'delete-cocktail',
  'new-cocktail',
  'toggle-family',
  'toggle-filter',
  'clear-filters'
])

const showInventory = ref(false)
const showFilters = ref(false)
const showCards = ref(false)
const showDrinkerPanel = ref(false)
const showOrdersPanel = ref(false)
const drinkerTab = ref('favorites')

// Filtres
const selectedFamilies = computed(() => props.selectedFamilies)
const selectedSubSpirits = computed(() => props.selectedSubSpirits)
const selectedSeasons = computed(() => props.selectedSeasons)
const showOnlyMakeable = computed(() => props.showOnlyMakeable)
const showOnlyFavorites = computed(() => props.showOnlyFavorites)
const filterMode = computed(() => props.filterMode)
const abvFilter = computed(() => props.abvFilter)
const selectedProfiles = computed(() => props.selectedProfiles)
const selectedStyles = computed(() => props.selectedStyles)

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
    Tropical: props.locale === 'fr' ? 'Tropical' : 'Tropical',
    Floral: props.locale === 'fr' ? 'Floral' : 'Floral',
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
    if (selectedFamilies.value.includes(family.key) && family.subs.length) subs.push(...family.subs)
  }
  return subs
})

function toggleFilter(arrayName, value) {
  emit('toggle-filter', arrayName, value)
}
function toggleFamily(familyKey) {
  emit('toggle-family', familyKey)
}
function clearFilters() {
  emit('clear-filters')
}
function getFamilyLabel(key)    { return allFamilyLabels.value[key] ?? key }
function getSubSpiritLabel(key) { return allSubLabels.value[key] ?? key }

const selectedCount = computed(() => props.barInventory.size)
const totalCount    = computed(() => props.ingredients.length)

function isMakeable(cocktail) {
  const recipe = cocktail.recipe || []
  if (!recipe.length) return false
  return recipe.every(ing => ing.Type === 'garnish' || props.barInventory.has(ing.Type))
}
const makeableCount = computed(() => props.cocktails.filter(isMakeable).length)

const favoriteCocktails = computed(() => props.cocktails.filter(c => props.favorites.has(c.id)))
function getCocktailName(id) { return props.cocktails.find(c => c.id === id)?.name ?? '—' }
function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

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

  if (selectedFamilies.value.length || selectedSubSpirits.value.length) {
    const activeSubs = selectedSubSpirits.value
    const activeFamilies = selectedFamilies.value
    list = list.filter(c => {
      if (filterMode.value === 'main') {
        const familyMatch = activeFamilies.length === 0 || activeFamilies.includes(c.category)
        const subMatch    = activeSubs.length === 0     || activeSubs.includes(c.base_spirit)
        return familyMatch && subMatch
      } else {
        const recipeTypes = (c.recipe || []).map(ing => ing.Type)
        if (activeSubs.length) return activeSubs.some(sub => recipeTypes.includes(sub))
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

  if (showOnlyMakeable.value) list = list.filter(isMakeable)

  if (abvFilter.value === 'mocktail') {
    list = list.filter(c => c.abv === 0 || c.abv === null)
  } else if (abvFilter.value === 'low') {
    list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)
  }

  if (selectedProfiles.value.length) {
    list = list.filter(c => selectedProfiles.value.every(p => c.profile?.includes(p)))
  }

  if (selectedStyles.value.length) {
    list = list.filter(c => selectedStyles.value.includes(c.cocktail_style))
  }

  if (showOnlyFavorites.value && props.hasDrinker) {
    list = list.filter(c => props.favorites.has(c.id))
  }

  return list
})

const hasActiveFilters = computed(() =>
  selectedFamilies.value.length > 0 ||
  selectedSubSpirits.value.length > 0 ||
  selectedSeasons.value.length > 0 ||
  selectedProfiles.value.length > 0 ||
  abvFilter.value !== null ||
  showOnlyFavorites.value ||
  selectedStyles.value.length > 0
)

const t = computed(() => ({
  filterTitle: props.locale === 'fr' ? '🔍 Filtres' : '🔍 Filters',
  cardsTitle: props.locale === 'fr' ? '📜 Cartes' : '📜 Cards',
  newCard: props.locale === 'fr' ? 'Nouvelle carte' : 'New card',
  noCard: props.locale === 'fr' ? 'Aucune carte créée.' : 'No card yet.',
  stock: props.locale === 'fr' ? '📦 Stock du bar' : '📦 Bar stock',
  filterMode: props.locale === 'fr' ? 'Mode de recherche' : 'Search mode',
  filterMain: props.locale === 'fr' ? '🎯 Ingrédient principal' : '🎯 Main ingredient',
  filterContains: props.locale === 'fr' ? '🔍 Contient' : '🔍 Contains',
  filterSpirits: props.locale === 'fr' ? 'Spiritueux de base' : 'Base spirits',
  filterLiqueurs: props.locale === 'fr' ? 'Liqueurs' : 'Liqueurs',
  filterSeason: props.locale === 'fr' ? 'Saison' : 'Season',
  filterAvail: props.locale === 'fr' ? 'Disponibilité' : 'Availability',
  filterMakeable: props.locale === 'fr' ? '🍸 Cocktails réalisables' : '🍸 Available cocktails',
  filterAbv: props.locale === 'fr' ? 'Alcool' : 'Alcohol',
  clearAll: props.locale === 'fr' ? 'Effacer tout' : 'Clear all',
  loading: props.locale === 'fr' ? 'Chargement des cocktails...' : 'Loading cocktails...',
}))
</script>