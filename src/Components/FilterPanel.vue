<template>
  <div class="section-card">

    <!-- HEADER TOGGLE -->
    <div @click="$emit('toggle')" class="expand-actions-btn" role="button" tabindex="0" @keydown.enter="$emit('toggle')">
      <ChevronDown :size="18" :class="{ rotated: open }" />
      <h2 class="section-title">
        <component :is="lucideIcons.filters" :size="20" class="tile-ico" /><span class="tile-lbl">{{ t.filterTitle }}</span>
        <span v-if="activeCount > 0" class="count-badge">{{ activeCount }}</span>
      </h2>
      <button class="clear-all-btn" v-if="hasActiveFilters" @click.stop="$emit('clear-filters')">
        {{ t.clearAll }}
      </button>
      <span v-else></span>
    </div>

    <!-- CONTENT -->
    <div v-if="open" class="filters-dropdown-content filters-grid">

      <!-- BARRE D'OUTILS : recherche + « Tout effacer » sur la même ligne -->
      <div class="filter-toolbar">
      <div class="search-wrapper filter-search">
        <Search class="search-icon" :size="16" />
        <input
          type="text"
          :placeholder="t.searchPlaceholder"
          :value="searchTerm"
          @input="$emit('update:searchTerm', $event.target.value)"
          class="search-input"
          @focus="showSuggestions = !!searchTerm"
          @blur="handleSearchBlur"
        />
        <transition name="fade">
          <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions" @click.stop>
            <div v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item" @click="onSuggestionClick(suggestion.id)">
              <Martini :size="14" class="suggestion-type-icon" aria-hidden="true" />
              <span class="suggestion-name">{{ suggestion.name }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- « Tout effacer » : toujours présent (désactivé si rien d'actif) pour ne rien faire bouger -->
      <button
        class="clear-all-btn clear-all-btn--inner"
        :disabled="activeCount === 0"
        @click="$emit('clear-filters')"
      >
        {{ t.clearAll }}
      </button>
      </div>

      <!-- CATÉGORIES -->
      <div class="filter-group filter-group--categories">
        <span class="filter-label">{{ locale === 'fr' ? 'Catégories' : 'Categories' }}</span>
        <div class="filter-list">
          <label v-if="hasDrinker" class="filter-option">
            <input type="checkbox" :checked="showOnlyFavorites" @change="$emit('toggle-favorites')" />
            <span>{{ locale === 'fr' ? 'Favoris' : 'Favorites' }}</span>
          </label>
          <label class="filter-option">
            <input type="checkbox" :checked="showOnlyMakeable" @change="$emit('toggle-makeable')" />
            <span>{{ t.filterMakeable }}</span>
          </label>
          <label class="filter-option">
            <input type="checkbox" :checked="abvFilter === 'mocktail'"
                   @change="$emit('set-abv-filter', abvFilter === 'mocktail' ? null : 'mocktail')" />
            <span>Mocktail</span>
          </label>
          <label class="filter-option">
            <input type="checkbox" :checked="abvFilter === 'low'"
                   @change="$emit('set-abv-filter', abvFilter === 'low' ? null : 'low')" />
            <span>Low ABV</span>
          </label>
        </div>
      </div>

      <!-- SPIRITUEUX DE BASE (logique « contient », tous les choix doivent être présents) -->
      <div class="filter-group filter-group--spirits">
        <button class="filter-label" @click="showSpirits = !showSpirits">
          {{ t.filterSpirits }}
          <span class="filter-label-line"></span>
          <ChevronDown :size="12" :class="{ rotated: spiritsOpen }" class="filter-label-chevron" style="margin-left: auto; flex-shrink: 0;" />
        </button>
        <div v-if="spiritsOpen" class="filter-list filter-list--families">
          <div v-for="spirit in baseSpirits" :key="spirit.key" class="filter-family">
            <label class="filter-option">
              <input type="checkbox" :checked="selectedFamilies.includes(spirit.key)"
                     @change="$emit('toggle-family', spirit.key)" />
              <span>{{ splitLabel(spirit.label).text }}</span>
            </label>
            <div v-if="selectedFamilies.includes(spirit.key) && spirit.subs.length" class="filter-sublist">
              <label v-for="sub in spirit.subs" :key="sub.key" class="filter-option filter-option--sub">
                <input type="checkbox" :checked="selectedSubSpirits.includes(sub.key)"
                       @change="$emit('toggle-sub-spirit', sub.key)" />
                <span>{{ splitLabel(sub.label).text }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- LIQUEURS (même logique : familles + liqueurs précises) -->
      <div class="filter-group filter-group--liqueurs">
        <button class="filter-label" @click="showLiqueurs = !showLiqueurs">
          {{ locale === 'fr' ? 'Liqueurs' : 'Liqueurs' }}
          <span class="filter-label-line"></span>
          <ChevronDown :size="12" :class="{ rotated: liqueursOpen }" class="filter-label-chevron" style="margin-left: auto; flex-shrink: 0;" />
        </button>
        <div v-if="liqueursOpen" class="filter-list filter-list--families">
          <div v-for="fam in liqueurFamilies" :key="fam.key" class="filter-family">
            <label class="filter-option">
              <input type="checkbox" :checked="selectedFamilies.includes(fam.key)"
                     @change="$emit('toggle-family', fam.key)" />
              <span>{{ splitLabel(fam.label).text }}</span>
            </label>
            <div v-if="selectedFamilies.includes(fam.key) && fam.subs.length" class="filter-sublist">
              <label v-for="sub in fam.subs" :key="sub.key" class="filter-option filter-option--sub">
                <input type="checkbox" :checked="selectedSubSpirits.includes(sub.key)"
                       @change="$emit('toggle-sub-spirit', sub.key)" />
                <span>{{ splitLabel(sub.label).text }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- PROFIL -->
      <div class="filter-group filter-group--profile">
        <button class="filter-label" @click="showProfile = !showProfile">
          {{ t.filterProfile }}
          <span class="filter-label-line"></span>
          <ChevronDown :size="12" :class="{ rotated: profileOpen }" class="filter-label-chevron" style="margin-left: auto; flex-shrink: 0;" />
        </button>
        <div v-if="profileOpen" class="filter-list filter-list--cols">
          <label v-for="p in profileFilters" :key="p.key" class="filter-option">
            <input type="checkbox" :checked="selectedProfiles.includes(p.key)"
                   @change="$emit('toggle-profile', p.key)" />
            <span>{{ p.label }}</span>
          </label>
        </div>
      </div>

      <!-- STYLE (choix unique : un cocktail n'a qu'un seul style) -->
      <div class="filter-group filter-group--style">
        <button class="filter-label" @click="showStyle = !showStyle">
          {{ t.filterStyle }}
          <span class="filter-label-line"></span>
          <ChevronDown :size="12" :class="{ rotated: styleOpen }" class="filter-label-chevron" style="margin-left: auto; flex-shrink: 0;" />
        </button>
        <div v-if="styleOpen" class="filter-list">
          <label v-for="s in styleFilters" :key="s.key" class="filter-option">
            <input type="radio" name="cocktail-style" :checked="selectedStyles.includes(s.key)"
                   @click="$emit('toggle-style', s.key)" @change.prevent />
            <span>{{ s.label }}</span>
          </label>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Search, Martini } from 'lucide-vue-next'
import { lucideIcons } from '@/utils/lucideIcons'
import { splitLabel } from '@/utils/tileLabel'

const showSuggestions = ref(false)
function handleSearchBlur() {
  setTimeout(() => { showSuggestions.value = false }, 150)
}
function onSuggestionClick(id) {
  showSuggestions.value = false
  emit('scroll-to-cocktail', id)
}

const showProfile = ref(false)
const showStyle = ref(false)
const showSpirits = ref(true)     // mobile : Spiritueux ouvert par défaut, Liqueurs replié
const showLiqueurs = ref(false)

// Grand écran : Profil / Style sont toujours dépliés (en colonnes),
// l'accordéon ne sert que sur mobile / tablette.
const isWide = ref(false)
let mql = null
const syncWide = () => { isWide.value = !!mql?.matches }
onMounted(() => {
  mql = window.matchMedia('(min-width: 861px)')
  syncWide()
  mql.addEventListener('change', syncWide)
})
onBeforeUnmount(() => mql?.removeEventListener('change', syncWide))
const profileOpen = computed(() => isWide.value || showProfile.value)
const styleOpen   = computed(() => isWide.value || showStyle.value)
const spiritsOpen  = computed(() => isWide.value || showSpirits.value)
const liqueursOpen = computed(() => isWide.value || showLiqueurs.value)

const props = defineProps({
  open: { type: Boolean, default: false },
  locale: String,
  t: Object,
  abvFilter:          { type: String,  default: null      },
  selectedFamilies:   { type: Array,   default: () => []  },
  selectedSubSpirits: { type: Array,   default: () => []  },
  selectedSeasons:    { type: Array,   default: () => []  },
  selectedProfiles:   { type: Array,   default: () => []  },
  selectedStyles:     { type: Array,   default: () => []  },
  showOnlyMakeable:   { type: Boolean, default: false     },
  showOnlyFavorites:  { type: Boolean, default: false     },
  hasDrinker:         { type: Boolean, default: false     },
  hasActiveFilters:   { type: Boolean, default: false     },
  baseSpirits:        { type: Array,   default: () => []  },
  liqueurFamilies:    { type: Array,   default: () => []  },
  profileFilters:     { type: Array,   default: () => []  },
  styleFilters:       { type: Array,   default: () => []  },
  activeSubSpirits:   { type: Array,   default: () => []  },
  allLabels:    { type: Object,  default: () => ({}) },
  allSubLabels:       { type: Object,  default: () => ({}) },
  searchTerm:         { type: String,  default: ''        },
  suggestions:        { type: Array,   default: () => []  },
})

// Nombre de filtres réellement actifs (tout ce qui restreint la liste)
const activeCount = computed(() =>
  props.selectedFamilies.length +
  props.selectedSubSpirits.length +
  props.selectedSeasons.length +
  props.selectedProfiles.length +
  props.selectedStyles.length +
  (props.abvFilter ? 1 : 0) +
  (props.showOnlyMakeable ? 1 : 0) +
  (props.showOnlyFavorites && props.hasDrinker ? 1 : 0) +
  (props.searchTerm?.trim() ? 1 : 0)
)

const emit = defineEmits([
  'toggle', 'update:searchTerm', 'scroll-to-cocktail',
  'toggle-family', 'toggle-sub-spirit', 'toggle-profile', 'toggle-style',
  'toggle-makeable', 'toggle-favorites',
  'set-abv-filter', 'set-season', 'clear-filters',
])
</script>