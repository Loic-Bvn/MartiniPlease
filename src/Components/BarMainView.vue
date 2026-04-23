<template>
  <div class="main-content">

    <div v-if="isLoggedIn" class="section-card">
      <button @click="showInventory = !showInventory" class="expand-actions-btn">
        <ChevronDown :size="18" :class="{ rotated: showInventory }" />
        <h2 class="section-title">{{ t.stock }}<span class="count-badge">{{ selectedCount }} / {{ totalCount }}</span></h2>
        <span></span>
      </button>
      <InventoryManager v-if="showInventory" />
    </div>

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

    <div class="side-by-side">

      <div style="display: flex; flex-direction: column; gap: 0.875rem;">
        <FilterPanel
          :locale="locale"
          :t="t"
          :filter-mode="filterMode"
          :abv-filter="abvFilter"
          :selected-families="selectedFamilies"
          :selected-sub-spirits="selectedSubSpirits"
          :selected-seasons="selectedSeasons"
          :selected-profiles="selectedProfiles"
          :selected-styles="selectedStyles"
          :show-only-makeable="showOnlyMakeable"
          :show-only-favorites="showOnlyFavorites"
          :has-active-filters="hasActiveFilters"
          :has-drinker="hasDrinker"
          :base-spirits="baseSpirits"
          :liqueur-families="liqueurFamilies"
          :profile-filters="profileFilters"
          :style-filters="styleFilters"
          :seasons="seasons"
          :active-sub-spirits="activeSubSpirits"
          :all-family-labels="allFamilyLabels"
          :all-sub-labels="allSubLabels"
          @toggle-family="toggleFamily"
          @toggle-sub-spirit="$emit('toggle-sub-spirit', $event)"
          @toggle-profile="$emit('toggle-profile', $event)"
          @toggle-style="$emit('toggle-style', $event)"
          @toggle-filter-mode="$emit('toggle-filter-mode', $event)"
          @toggle-makeable="$emit('toggle-makeable')"
          @toggle-favorites="$emit('toggle-favorites')"
          @set-abv-filter="$emit('set-abv-filter', $event)"
          @set-season="$emit('set-season', $event)"
          @clear-filters="clearFilters"
        />
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.875rem;">

        <CardPanel
          :is-logged-in="isLoggedIn"
          :menu-cards="menuCards"
          :locale="locale"
          :t="t"
          @view-card="$emit('view-card', $event)"
          @edit-card="$emit('edit-card', $event)"
          @delete-card="$emit('delete-card', $event)"
          @new-card="$emit('new-card')"
        />

        <DrinkerPanel
          v-if="hasDrinker"
          :locale="locale"
          :drinker-pseudo="drinkerPseudo"
          :favorites="favorites"
          :favorite-cocktails="favoriteCocktails"
          :history="history"
          :get-cocktail-name="getCocktailName"
          :format-date="formatDate"
          @toggle-favorite="$emit('toggle-favorite', $event)"
        />
      </div>



    </div>

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
        <p class="empty-state-message">{{ locale === 'fr' ? 'Essayez d\'ajuster vos filtres...' : 'Try adjusting your filters...' }}</p>
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
import FilterPanel from '@/Components/FilterPanel.vue'
import DrinkerPanel from '@/Components/DrinkerPanel.vue'
import CardPanel from '@/Components/CardPanel.vue'
import CocktailCard from '@/Components/CocktailCard.vue'
import { useFilters } from '@/composables/useFilters.js'

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
  baseSpirits: Array,
  liqueurFamilies: Array,
  profileFilters: Array,
  styleFilters: Array,
  seasons: Array,
  activeSubSpirits: Array,
  allFamilyLabels: Object,
  allSubLabels: Object,
})

const emit = defineEmits([
  'view-card', 'edit-card', 'delete-card', 'new-card',
  'toggle-favorite', 'edit-cocktail', 'delete-cocktail', 'new-cocktail',
  'toggle-family',
  'toggle-sub-spirit',
  'toggle-profile',
  'toggle-style',
  'toggle-filter-mode',
  'toggle-makeable',
  'toggle-favorites',
  'set-abv-filter',
  'set-season',
  'clear-filters',
])

const showInventory    = ref(false)
const showFilters      = ref(false)
const showCards        = ref(false)
const showDrinkerPanel = ref(false)
const showOrdersPanel  = ref(false)
const drinkerTab       = ref('favorites')

const {
  makeableCount,
  filteredCocktails,
  hasActiveFilters,
  toggleFamily,
  clearFilters,
} = useFilters(props, emit)

const selectedCount = computed(() => props.barInventory.size)
const totalCount    = computed(() => props.ingredients.length)

const favoriteCocktails = computed(() => props.cocktails.filter(c => props.favorites.has(c.id)))
function getCocktailName(id) { return props.cocktails.find(c => c.id === id)?.name ?? '—' }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

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
  filterLiqueurs: props.locale === 'fr' ? 'Liqueurs' : 'Licors',
  filterSeason: props.locale === 'fr' ? 'Saison' : 'Season',
  filterProfile: props.locale === 'fr' ? 'Profil de saveur' : 'Flavor profile',
  filterStyle: props.locale === 'fr' ? 'Style' : 'Style',
  filterAvail: props.locale === 'fr' ? 'Disponibilité' : 'Availability',
  filterMakeable: props.locale === 'fr' ? 'Réalisables' : 'Available',
  filterAbv: props.locale === 'fr' ? 'Alcool' : 'Alcohol',
  clearAll: props.locale === 'fr' ? 'Effacer tout' : 'Clear all',
  loading: props.locale === 'fr' ? 'Chargement des cocktails...' : 'Loading cocktails...',
}))
</script>