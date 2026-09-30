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

    <section v-if="isLoggedIn" class="cocktail-moment-panel">
      <div class="cocktail-moment-copy">
        <span class="cocktail-moment-kicker">{{ locale === 'fr' ? 'À découvrir maintenant' : 'Discover now' }}</span>
        <button v-if="cocktailOfMoment" type="button" class="cocktail-moment-name" @click="$emit('open-cocktail', cocktailOfMoment)">
          {{ cocktailOfMoment.name }}
        </button>
        <span v-else class="cocktail-moment-empty">{{ locale === 'fr' ? 'Aucun cocktail sélectionné' : 'No cocktail selected' }}</span>
      </div>
      <select
        v-if="isLoggedIn"
        :value="cocktailOfMomentId || ''"
        class="cocktail-moment-select"
        :aria-label="locale === 'fr' ? 'Choisir le cocktail du moment' : 'Choose cocktail of the moment'"
        @change="$emit('set-cocktail-of-moment', $event.target.value || null)"
      >
        <option value="">{{ locale === 'fr' ? 'Choisir...' : 'Choose...' }}</option>
        <option v-for="cocktail in cocktails" :key="cocktail.id" :value="cocktail.id">{{ cocktail.name }}</option>
      </select>
    </section>

    <section v-if="sharedFavoriteCocktails.length" class="shared-favorites-panel">
      <div class="shared-favorites-heading">
        <h2>{{ locale === 'fr' ? 'Favoris partagés' : 'Shared favorites' }}</h2>
        <span>{{ locale === 'fr' ? 'Liste en lecture seule' : 'Read-only list' }}</span>
      </div>
      <div class="shared-favorites-list">
        <button v-for="cocktail in sharedFavoriteCocktails" :key="cocktail.id" type="button" @click="$emit('open-cocktail', cocktail)">
          <Heart :size="14" fill="currentColor" />
          {{ cocktail.name }}
        </button>
      </div>
    </section>

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
          :all-family-labels="allLabels"
          :all-sub-labels="allSubLabels"
          @toggle-family="$emit('toggle-family', $event)"
          @toggle-sub-spirit="$emit('toggle-sub-spirit', $event)"
          @toggle-profile="$emit('toggle-profile', $event)"
          @toggle-style="$emit('toggle-style', $event)"
          @toggle-filter-mode="$emit('toggle-filter-mode', $event)"
          @toggle-makeable="$emit('toggle-makeable')"
          @toggle-favorites="$emit('toggle-favorites')"
          @set-abv-filter="$emit('set-abv-filter', $event)"
          @set-season="$emit('set-season', $event)"
          @clear-filters="$emit('clear-filters')"
        />

        <DrinkerPanel
          v-if="hasDrinker"
          :locale="locale"
          :drinker-pseudo="drinkerPseudo"
          :favorites="favorites"
          :favorite-cocktails="favoriteCocktails"
          :recommendations="recommendations"
          :invite-code="inviteCode"
          :loyalty-target="5"
          :history="history"
          :get-cocktail-name="getCocktailName"
          :format-date="formatDate"
          @toggle-favorite="$emit('toggle-favorite', $event)"
          @open-cocktail="$emit('open-cocktail', $event)"
          @share-favorites="$emit('share-favorites')"
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
          @toggle-card-visibility="$emit('toggle-card-visibility', $event)"
        />

        <button
          v-if="hasDrinker && filteredCocktails.length"
          type="button"
          class="surprise-button"
          @click="$emit('surprise-me')"
        >
          <Dices :size="16" />
          {{ locale === 'fr' ? 'Surprise-moi' : 'Surprise Me' }}
        </button>
      </div>

    </div>

    <div>
      <div class="cocktails-header-row">
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

        <div
          class="view-toggle"
          role="group"
          :aria-label="locale === 'fr' ? 'Affichage des cocktails' : 'Cocktail display'"
          @click="$emit('set-card-view', cardView === 'compact' ? 'standard' : 'compact')"
        >
          <button
            type="button"
            :class="['view-toggle-btn', { 'view-toggle-btn--active': cardView === 'compact' }]"
            :title="locale === 'fr' ? 'Vue compacte' : 'Compact view'"
          >
            <Rows3 :size="16" />
            <span class="view-toggle-label">{{ locale === 'fr' ? 'Compacte' : 'Compact' }}</span>
          </button>
          <button
            type="button"
            :class="['view-toggle-btn', { 'view-toggle-btn--active': cardView === 'standard' }]"
            :title="locale === 'fr' ? 'Vue standard (avec photos)' : 'Standard view (with photos)'"
          >
            <GalleryVerticalEnd :size="16" />
            <span class="view-toggle-label">{{ locale === 'fr' ? 'Standard' : 'Standard' }}</span>
          </button>
        </div>
      </div>
      <!-- <div v-if="hasDrinker" class="engagement-strip">
        <div class="engagement-progress">
          <span class="engagement-label">{{ locale === 'fr' ? 'Découverte du catalogue' : 'Catalogue discovery' }}</span>
          <strong>{{ triedCocktailCount }} / {{ cocktails.length }}</strong>
          <div class="engagement-progress-track" role="progressbar" :aria-valuenow="triedCocktailCount" aria-valuemin="0" :aria-valuemax="cocktails.length">
            <span :style="{ width: `${discoveryPercent}%` }"></span>
          </div>
        </div>
        <span class="engagement-hint">{{ locale === 'fr' ? 'cocktails essayés' : 'cocktails tried' }}</span>
      </div> -->
      <section v-if="isLoggedIn || featuredMenuCocktails.length" class="featured-menu-section">
        <div class="featured-menu-heading">
          <h2>{{ locale === 'fr' ? 'Carte du moment' : 'Featured menu' }}</h2>
          <select
            v-if="isLoggedIn"
            :value="featuredMenuCardId || ''"
            class="featured-menu-select"
            :aria-label="locale === 'fr' ? 'Choisir la carte à afficher en premier' : 'Choose the menu to feature first'"
            @change="$emit('set-featured-menu-card', $event.target.value || null)"
          >
            <option value="">{{ locale === 'fr' ? 'Aucune carte' : 'No menu' }}</option>
            <option v-for="menuCard in menuCards" :key="menuCard.id" :value="menuCard.id">{{ menuCard.name }}</option>
          </select>
        </div>
        <div v-if="featuredMenuCocktails.length" :class="['cocktails-grid', { 'cocktails-grid--standard': cardView === 'standard' }]">
          <div v-for="cocktail in featuredMenuCocktails" :key="cocktail.id" :id="`cocktail-${cocktail.id}`">
            <CocktailCard
              :cocktail="cocktail"
              :isBartenderMode="isLoggedIn"
              :locale="locale"
              :unit="unit"
              :bar-id="activeBarId"
              :view-mode="cardView"
              :is-cocktail-of-moment="cocktail.id === cocktailOfMoment?.id"
              @edit="$emit('edit-cocktail', cocktail)"
              @delete="$emit('delete-cocktail', cocktail.id)"
              @open="handleOpenCocktail"
            />
          </div>
        </div>
        <p v-else-if="featuredMenuCardId" class="featured-menu-empty">{{ locale === 'fr' ? 'Cette carte ne contient aucun cocktail dans les résultats actuels.' : 'This menu has no cocktails in the current results.' }}</p>
        <p v-else-if="isLoggedIn" class="featured-menu-empty">{{ locale === 'fr' ? 'Sélectionnez une carte pour l’afficher avant le catalogue.' : 'Choose a menu to feature before the catalogue.' }}</p>
      </section>

      <div v-if="cocktailsLoading" class="loading-state">{{ t.loading }}</div>
      <div v-else-if="filteredCocktails.length === 0" class="empty-state-enhanced">
        <div class="empty-state-icon">🍹</div>
        <h3 class="empty-state-title">{{ locale === 'fr' ? 'Aucun cocktail trouvé' : 'No cocktails found' }}</h3>
        <p class="empty-state-message">{{ locale === 'fr' ? 'Essayez d\'ajuster vos filtres...' : 'Try adjusting your filters...' }}</p>
        <div class="empty-state-actions">
          <button v-if="hasActiveFilters" @click="$emit('clear-filters')" class="empty-state-btn empty-state-btn-primary">
            {{ locale === 'fr' ? 'Effacer les filtres' : 'Clear filters' }}
          </button>
          <button v-if="isLoggedIn" @click="$emit('new-cocktail')" class="empty-state-btn empty-state-btn-primary">
            {{ locale === 'fr' ? '+ Créer un cocktail' : '+ Create cocktail' }}
          </button>
        </div>
      </div>
      <div v-else-if="visibleCocktails.length" :class="['cocktails-grid', { 'cocktails-grid--standard': cardView === 'standard' }]">
        <div v-for="cocktail in visibleCocktails" :key="cocktail.id" :id="`cocktail-${cocktail.id}`">
          <CocktailCard
            :cocktail="cocktail"
            :isBartenderMode="isLoggedIn"
            :locale="locale"
            :unit="unit"
            :bar-id="activeBarId"
            :view-mode="cardView"
            :is-cocktail-of-moment="cocktail.id === cocktailOfMoment?.id"
            @edit="$emit('edit-cocktail', cocktail)"
            @delete="$emit('delete-cocktail', cocktail.id)"
            @open="handleOpenCocktail"
          />
        </div>
      </div>
      <div ref="sentinelEl" style="height:1px" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Rows3, GalleryVerticalEnd, Dices, Heart } from 'lucide-vue-next'
const InventoryManager = defineAsyncComponent(() => import('@/Components/Modals/InventoryManager.vue'))
import OrdersPanel      from '@/Components/OrdersPanel.vue'
import FilterPanel      from '@/Components/FilterPanel.vue'
import DrinkerPanel     from '@/Components/DrinkerPanel.vue'
import CardPanel        from '@/Components/CardPanel.vue'
import CocktailCard     from '@/Components/CocktailCard.vue'

// ── Props ─────────────────────────────────────────────────────────────────────
// filteredCocktails, hasActiveFilters et makeableCount sont calculés dans
// useFilters (CocktailMenuApp) et passés ici en props — BarMainView n'a pas
// à les recalculer.
const props = defineProps({
  isLoggedIn:        Boolean,
  activeBarId:       String,
  cocktails:         Array,
  cocktailsLoading:  Boolean,
  menuCards:         Array,
  hasDrinker:        Boolean,
  drinkerPseudo:     String,
  favorites:         Set,
  history:           Array,
  pendingOrdersCount: Number,
  locale:            String,
  unit:              String,
  cardView:          { type: String, default: 'standard' }, // 'compact' | 'standard'
  barInventory:      Set,
  ingredients:       Array,
  // Filtres (état en lecture seule — mutations via emit)
  selectedFamilies:   Array,
  selectedSubSpirits: Array,
  selectedSeasons:    Array,
  showOnlyMakeable:   Boolean,
  showOnlyFavorites:  Boolean,
  filterMode:         String,
  abvFilter:          String,
  selectedProfiles:   Array,
  selectedStyles:     Array,
  // Données de référence pour FilterPanel
  baseSpirits:        Array,
  liqueurFamilies:    Array,
  profileFilters:     Array,
  styleFilters:       Array,
  seasons:            Array,
  activeSubSpirits:   Array,
  allLabels:    Object,
  allSubLabels:       Object,
  // Résultats calculés par useFilters dans CocktailMenuApp
  filteredCocktails:  { type: Array,   default: () => [] },
  hasActiveFilters:   { type: Boolean, default: false    },
  makeableCount:      { type: Number,  default: 0        },
  recommendations:    { type: Array,  default: () => [] },
  cocktailOfMoment:   { type: Object, default: null },
  cocktailOfMomentId: { type: String, default: null },
  featuredMenuCardId: { type: String, default: null },
  sharedFavoriteCocktails: { type: Array, default: () => [] },
  inviteCode:         { type: String, default: '' },
})

const emit = defineEmits([
  'view-card', 'edit-card', 'delete-card', 'new-card', 'toggle-card-visibility',
  'toggle-favorite', 'edit-cocktail', 'delete-cocktail', 'new-cocktail', 'open-cocktail',
  'toggle-family', 'toggle-sub-spirit', 'toggle-profile', 'toggle-style',
  'toggle-filter-mode', 'toggle-makeable', 'toggle-favorites',
  'set-abv-filter', 'set-season', 'clear-filters', 'set-card-view', 'surprise-me',
  'set-cocktail-of-moment', 'share-favorites',
  'set-featured-menu-card',
])

// ── État local (UI uniquement) ────────────────────────────────────────────────
const showInventory   = ref(false)
const showOrdersPanel = ref(false)

// ── Pagination progressive ────────────────────────────────────────────────────
const PAGE_SIZE    = 40
const displayCount = ref(PAGE_SIZE)
const sentinelEl   = ref(null)
let observer       = null

const featuredMenuCocktails = computed(() => {
  const menuCard = props.menuCards.find(card => card.id === props.featuredMenuCardId)
  if (!menuCard) return []
  const filteredIds = new Set(props.filteredCocktails.map(cocktail => cocktail.id))
  return (menuCard.cocktail_ids || [])
    .filter(id => filteredIds.has(id))
    .map(id => props.cocktails.find(cocktail => cocktail.id === id))
    .filter(Boolean)
})

const featuredMenuCocktailIds = computed(() => new Set(featuredMenuCocktails.value.map(cocktail => cocktail.id)))
const regularCocktails = computed(() => props.filteredCocktails.filter(cocktail => !featuredMenuCocktailIds.value.has(cocktail.id)))
const visibleCocktails = computed(() => regularCocktails.value.slice(0, displayCount.value))

watch(regularCocktails, () => {
  displayCount.value = PAGE_SIZE
}, { immediate: true })

function setupObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && displayCount.value < regularCocktails.value.length) {
      displayCount.value = Math.min(displayCount.value + PAGE_SIZE, regularCocktails.value.length)
    }
  }, { rootMargin: '200px' })
  if (sentinelEl.value) observer.observe(sentinelEl.value)
}

onMounted(setupObserver)
onBeforeUnmount(() => observer?.disconnect())

// ── Computed ──────────────────────────────────────────────────────────────────
const selectedCount = computed(() => props.barInventory?.size ?? 0)
const totalCount    = computed(() => props.ingredients?.length ?? 0)

const favoriteCocktails = computed(() =>
  props.cocktails.filter(c => props.favorites.has(c.id))
)

const triedCocktailCount = computed(() => {
  const catalogIds = new Set(props.cocktails.map(cocktail => cocktail.id))
  return new Set(props.history.filter(entry => catalogIds.has(entry.cocktail_id)).map(entry => entry.cocktail_id)).size
})

const discoveryPercent = computed(() => {
  if (!props.cocktails.length) return 0
  return Math.round((triedCocktailCount.value / props.cocktails.length) * 100)
})

function getCocktailName(id) {
  return props.cocktails.find(c => c.id === id)?.name ?? '—'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function handleOpenCocktail(cocktail, rect) {
  emit('open-cocktail', cocktail, rect)
}

const t = computed(() => ({
  filterTitle:    props.locale === 'fr' ? '🔍 Filtres'                : '🔍 Filters',
  cardsTitle:     props.locale === 'fr' ? '📜 Cartes'                 : '📜 Cards',
  newCard:        props.locale === 'fr' ? 'Nouvelle carte'            : 'New card',
  noCard:         props.locale === 'fr' ? 'Aucune carte créée.'       : 'No card yet.',
  stock:          props.locale === 'fr' ? '📦 Stock du bar'           : '📦 Bar stock',
  filterMode:     props.locale === 'fr' ? 'Mode de recherche'         : 'Search mode',
  filterMain:     props.locale === 'fr' ? '🎯 Ingrédient principal'   : '🎯 Main ingredient',
  filterContains: props.locale === 'fr' ? '🔍 Contient'              : '🔍 Contains',
  filterSpirits:  props.locale === 'fr' ? 'Spiritueux de base'        : 'Base spirits',
  filterLiqueurs: props.locale === 'fr' ? 'Liqueurs'                  : 'Licors',
  filterSeason:   props.locale === 'fr' ? 'Saison'                   : 'Season',
  filterProfile:  props.locale === 'fr' ? 'Profil de saveur'         : 'Flavor profile',
  filterStyle:    props.locale === 'fr' ? 'Style'                    : 'Style',
  filterAvail:    props.locale === 'fr' ? 'Disponibilité'            : 'Availability',
  filterMakeable: props.locale === 'fr' ? 'Réalisables'              : 'Available',
  filterAbv:      props.locale === 'fr' ? 'Alcool'                   : 'Alcohol',
  clearAll:       props.locale === 'fr' ? 'Effacer tout'             : 'Clear all',
  loading:        props.locale === 'fr' ? 'Chargement des cocktails...' : 'Loading cocktails...',
}))
</script>