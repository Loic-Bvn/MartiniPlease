<template>
  <div class="section-card">
    <button @click="show = !show" class="expand-actions-btn">
      <ChevronDown :size="18" :class="{ rotated: show }" />
      <h2 class="section-title">{{ t.filterTitle }}</h2>
      <span></span>
    </button>

    <div v-if="show" class="filters-dropdown-content">

      <div class="filter-group">
        <label class="filter-label">{{ t.filterMode }}</label>
        <div class="filter-mode-toggle">
          <button @click="$emit('toggle-filter-mode')" :class="['filter-mode-btn', { active: filterMode === 'main' }]">{{ t.filterMain }}</button>
          <button @click="$emit('toggle-filter-mode')" :class="['filter-mode-btn', { active: filterMode === 'contains' }]">{{ t.filterContains }}</button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t.filterSpirits }}</label>
        <div class="chips-container">
          <button v-for="spirit in baseSpirits" :key="spirit.key"
            @click="$emit('toggle-family', spirit.key)"
            :class="['chip', { active: selectedFamilies.includes(spirit.key) }]"
          >{{ spirit.label }}</button>
        </div>
        <transition name="fade">
          <div v-if="activeSubSpirits.length" class="chips-container chips-container--sub">
            <button v-for="sub in activeSubSpirits" :key="sub.key"
              @click="$emit('toggle-filter', selectedSubSpirits, sub.key)"
              :class="['chip chip--sub', { active: selectedSubSpirits.includes(sub.key) }]"
            >{{ sub.label }}</button>
          </div>
        </transition>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t.filterLiqueurs }}</label>
        <div class="chips-container">
          <button v-for="liqueur in liqueurFamilies" :key="liqueur.key"
            @click="$emit('toggle-filter', selectedFamilies, liqueur.key)"
            :class="['chip', { active: selectedFamilies.includes(liqueur.key) }]"
          >{{ liqueur.label }}</button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t.filterSeason }}</label>
        <div class="chips-container">
          <button v-for="season in seasons" :key="season.key"
            @click="$emit('set-season', season.key)"
            :class="['chip', { active: season.key === 'all' ? selectedSeasons.length === 0 : selectedSeasons.includes(season.key) }]"
          >{{ season.icon }} {{ season.label }}</button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t.filterAvail }}</label>
        <div class="chips-container">
          <button @click="$emit('toggle-makeable')" :class="['chip', { active: showOnlyMakeable }]">{{ t.filterMakeable }}</button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t.filterAbv }}</label>
        <div class="chips-container">
          <button @click="$emit('set-abv-filter', 'mocktail')" :class="['chip', { active: abvFilter === 'mocktail' }]">🧃 Mocktail</button>
          <button @click="$emit('set-abv-filter', 'low')"      :class="['chip', { active: abvFilter === 'low' }]">🍃 Low ABV <span class="chip-hint">&lt; 15°</span></button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t.filterProfile }}</label>
        <div class="chips-container">
          <button v-for="p in profileFilters" :key="p.key"
            @click="$emit('toggle-filter', selectedProfiles, p.key)"
            :class="['chip', { active: selectedProfiles.includes(p.key) }]"
          >{{ p.label }}</button>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t.filterStyle }}</label>
        <div class="chips-container">
          <button v-for="s in styleFilters" :key="s.key"
            @click="$emit('toggle-filter', selectedStyles, s.key)"
            :class="['chip', { active: selectedStyles.includes(s.key) }]"
          >{{ s.label }}</button>
        </div>
      </div>

      <div v-if="hasDrinker" class="filter-group">
        <label class="filter-label">{{ locale === 'fr' ? 'Mes favoris' : 'My favorites' }}</label>
        <div class="chips-container">
          <button @click="$emit('toggle-favorites')" :class="['chip', { active: showOnlyFavorites }]">
            ❤️ {{ locale === 'fr' ? 'Mes favoris uniquement' : 'My favorites only' }}
          </button>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="active-filters-bar">
        <span v-for="f in selectedFamilies" :key="f" class="filter-tag">
          {{ getFamilyLabel(allFamilyLabels, f) }}<X @click="$emit('toggle-family', f)" :size="14" />
        </span>
        <span v-for="s in selectedSubSpirits" :key="s" class="filter-tag filter-tag--sub">
          {{ getSubSpiritLabel(allSubLabels, s) }}<X @click="$emit('toggle-filter', selectedSubSpirits, s)" :size="14" />
        </span>
        <span v-if="abvFilter === 'mocktail'" class="filter-tag">🧃 Mocktail <X @click="$emit('set-abv-filter', null)" :size="14" /></span>
        <span v-if="abvFilter === 'low'"      class="filter-tag">🍃 Low ABV  <X @click="$emit('set-abv-filter', null)" :size="14" /></span>
        <span v-for="p in selectedProfiles" :key="p" class="filter-tag">
          {{ getFamilyLabel(allFamilyLabels, p) }}
          <X @click="$emit('toggle-filter', selectedProfiles, p)" :size="14" />
        </span>
        <span v-for="s in selectedStyles" :key="s" class="filter-tag">
          {{ getFamilyLabel(allFamilyLabels, s) }}
          <X @click="$emit('toggle-filter', selectedStyles, s)" :size="14" />
        </span>
        <button @click="$emit('clear-filters')" class="clear-all-btn">{{ t.clearAll }}</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronDown, X } from 'lucide-vue-next'
import { getFamilyLabel, getSubSpiritLabel } from '@/utils/formatters.js'
// dans le template : getFamilyLabel(allFamilyLabels, f)
const show = ref(false)

defineProps({
  locale: String, t: Object,
  baseSpirits: Array, liqueurFamilies: Array, profileFilters: Array,
  styleFilters: Array, seasons: Array, activeSubSpirits: Array,
  selectedFamilies: Array, selectedSubSpirits: Array, selectedSeasons: Array,
  selectedProfiles: Array, selectedStyles: Array,
  filterMode: String, abvFilter: String,
  showOnlyMakeable: Boolean, showOnlyFavorites: Boolean,
  hasActiveFilters: Boolean, hasDrinker: Boolean,
  getFamilyLabel: Function, getSubSpiritLabel: Function,
  allFamilyLabels: Object, allSubLabels: Object,
})

defineEmits([
  'toggle-family', 'toggle-filter', 'toggle-filter-mode',
  'toggle-makeable', 'toggle-favorites',
  'set-abv-filter', 'set-season', 'clear-filters',
])
</script>