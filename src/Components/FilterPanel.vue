<template>
  <div class="section-card">

    <!-- HEADER TOGGLE -->
    <button @click="show = !show" class="expand-actions-btn">
      <ChevronDown :size="18" :class="{ rotated: show }" />
      <h2 class="section-title">
        {{ t.filterTitle }}
        <span v-if="hasActiveFilters" class="count-badge">
          {{ selectedFamilies.length + selectedSubSpirits.length + selectedProfiles.length + selectedStyles.length }}
        </span>
      </h2>
      <button class="clear-all-btn" v-if="hasActiveFilters" @click.stop="$emit('clear-filters')">
        {{ t.clearAll }}
      </button>
      <span v-else></span>
    </button>

    <!-- CONTENT -->
    <div v-if="show" class="filters-dropdown-content">

      <!-- FAVORITES & AVAILABILITY & ABV -->
      <div class="filter-group">
        <span class="filter-label">{{ locale === 'fr' ? 'Catégories' : 'Categories' }}</span>
        <div class="chips-container">
          <button
            v-if="hasDrinker"
            @click="$emit('toggle-favorites')"
            :class="['chip', { active: showOnlyFavorites }]"
          >
            ❤️ {{ locale === 'fr' ? 'Favoris' : 'Favorites' }}
          </button>
          <button
            @click="$emit('toggle-makeable')"
            :class="['chip', { active: showOnlyMakeable }]"
          >
            🍸 {{ t.filterMakeable }}
          </button>
          <button
            @click="$emit('set-abv-filter', abvFilter === 'mocktail' ? null : 'mocktail')"
            :class="['chip', { active: abvFilter === 'mocktail' }]"
          >
            🧃 Mocktail
          </button>
          <button
            @click="$emit('set-abv-filter', abvFilter === 'low' ? null : 'low')"
            :class="['chip', { active: abvFilter === 'low' }]"
          >
            🍃 Low ABV
          </button>
        </div>
      </div>

      
      <!-- SPIRITS -->
      <div class="filter-group">
        <span class="filter-label">{{ t.filterSpirits }}</span>
        <!-- MODE -->
        <div class="filter-group">
          <!-- <span class="filter-label">{{ t.filterMode }}</span> -->
          <div class="filter-mode-toggle">
            <button
              @click="$emit('toggle-filter-mode', 'main')"
              :class="['filter-mode-btn', { active: filterMode === 'main' }]"
            >
              {{ t.filterMain }}
            </button>
            <button
              @click="$emit('toggle-filter-mode', 'contains')"
              :class="['filter-mode-btn', { active: filterMode === 'contains' }]"
            >
              {{ t.filterContains }}
            </button>
          </div>
        </div>
        <div class="chips-container">
          <button
            v-for="spirit in baseSpirits"
            :key="spirit.key"
            @click="$emit('toggle-family', spirit.key)"
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
              @click="$emit('toggle-sub-spirit', sub.key)"
              :class="['chip chip--sub', { active: selectedSubSpirits.includes(sub.key) }]"
            >
              {{ sub.label }}
            </button>
          </div>
        </transition>
      </div>

      <!-- PROFILE -->
      <div class="filter-group">
        <button class="filter-label" @click="showProfile = !showProfile">
          {{ t.filterProfile }}
          <ChevronDown :size="12" :class="{ rotated: showProfile }" style="margin-left: auto; flex-shrink: 0;" />
        </button>
        <transition name="fade">
          <div v-if="showProfile" class="chips-container">
            <button
              v-for="p in profileFilters"
              :key="p.key"
              @click="$emit('toggle-profile', p.key)"
              :class="['chip', { active: selectedProfiles.includes(p.key) }]"
            >
              {{ p.label }}
            </button>
          </div>
        </transition>
      </div>

      <!-- STYLE -->
      <div class="filter-group">
        <button class="filter-label" @click="showStyle = !showStyle">
          {{ t.filterStyle }}
          <ChevronDown :size="12" :class="{ rotated: showStyle }" style="margin-left: auto; flex-shrink: 0;" />
        </button>
        <transition name="fade">
          <div v-if="showStyle" class="chips-container">
            <button
              v-for="s in styleFilters"
              :key="s.key"
              @click="$emit('toggle-style', s.key)"
              :class="['chip', { active: selectedStyles.includes(s.key) }]"
            >
              {{ s.label }}
            </button>
          </div>
        </transition>
      </div>

      <!-- ACTIVE FILTERS TAGS -->
      <!-- <div v-if="hasActiveFilters" class="active-filters-bar">
        <span v-for="f in selectedFamilies" :key="f" class="filter-tag">
          {{ allFamilyLabels[f] ?? f }}
          <X @click="$emit('toggle-family', f)" :size="14" />
        </span>
        <span v-for="s in selectedSubSpirits" :key="s" class="filter-tag filter-tag--sub">
          {{ allSubLabels[s] ?? s }}
          <X @click="$emit('toggle-sub-spirit', s)" :size="14" />
        </span>
      </div> -->

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronDown, X } from 'lucide-vue-next'

const show = ref(false)
const showProfile = ref(false)
const showStyle = ref(false)
defineProps({
  locale: String,
  t: Object,
  filterMode: String,
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
  profileFilters:     { type: Array,   default: () => []  },
  styleFilters:       { type: Array,   default: () => []  },
  activeSubSpirits:   { type: Array,   default: () => []  },
  allFamilyLabels:    { type: Object,  default: () => ({}) },
  allSubLabels:       { type: Object,  default: () => ({}) },
})

defineEmits([
  'toggle-family', 'toggle-sub-spirit', 'toggle-profile', 'toggle-style',
  'toggle-filter-mode', 'toggle-makeable', 'toggle-favorites',
  'set-abv-filter', 'set-season', 'clear-filters',
])
</script>