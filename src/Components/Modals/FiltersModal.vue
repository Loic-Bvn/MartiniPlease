<template>
  <div class="filters-modal-overlay" @click.self="onClose">
    <div class="filters-modal-content">
      <!-- Header -->
      <div class="filters-modal-header">
        <h2 class="filters-modal-title">Filtres</h2>
        <button 
          @click="onClose" 
          class="filters-modal-close"
          aria-label="Fermer"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Contenu des filtres -->
      <div class="filters-container">
        <!-- Spiritueux -->
        <div class="filter-group">
          <label class="filter-label">Spiritueux</label>
          <div class="chips-container">
            <button 
              v-for="spirit in spiritCategories" 
              :key="spirit.key"
              @click="toggleFilter(selectedSpirits, spirit.key)"
              :class="['chip', { active: selectedSpirits.includes(spirit.key) }]">
              {{ spirit.value }}
            </button>
          </div>
        </div>

        <!-- Sous-catégories (conditionnelles) -->
        <div v-if="filteredSubcategories.length > 1" class="filter-group">
          <label class="filter-label">Type</label>
          <div class="chips-container">
            <button 
              v-for="sub in filteredSubcategories" 
              :key="sub.key"
              @click="toggleFilter(selectedSubcategories, sub.key)"
              :class="['chip', { active: selectedSubcategories.includes(sub.key) }]">
              {{ sub.value }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Saison</label>
          <div class="chips-container">
            <button 
              v-for="season in seasons" 
              :key="season.key"
              @click="season.key === 'all' ? selectedSeasons = [] : toggleFilter(selectedSeasons, season.key)"
              :class="['chip', { 
                active: season.key === 'all' 
                  ? selectedSeasons.length === 0 
                  : selectedSeasons.includes(season.key) 
              }]">
              {{ season.icon }} {{ season.value }}
            </button>
          </div>
        </div>

        <!-- Disponibilité -->
        <div class="filter-group">
          <label class="filter-label">Disponibilité</label>
          <div class="chips-container">
            <button 
              @click="showOnlyMakeable = !showOnlyMakeable"
              :class="['chip', { active: showOnlyMakeable }]">
              🍸 Cocktails réalisables
            </button>
          </div>
        </div>

        <!-- Filtres actifs -->
        <div v-if="hasActiveFilters" class="active-filters-bar">
          <span v-for="spirit in selectedSpirits" :key="spirit" class="filter-tag">
            {{ getSpiritLabel(spirit) }}
            <X @click="toggleFilter(selectedSpirits, spirit)" :size="14" />
          </span>
          <span v-for="sub in selectedSubcategories" :key="sub" class="filter-tag">
            {{ getSubcategoryLabel(sub) }}
            <X @click="toggleFilter(selectedSubcategories, sub)" :size="14" />
          </span>
          <span v-for="season in selectedSeasons" :key="season" class="filter-tag">
            {{ getSeasonLabel(season) }}
            <X @click="toggleFilter(selectedSeasons, season)" :size="14" />
          </span>
          <button @click="clearAllFilters" class="clear-all-btn">
            Effacer tout
          </button>
        </div>
      </div>

      <!-- Bouton de fermeture -->
      <div class="filters-modal-footer">
        <button @click="onClose" class="filters-btn-close">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  selectedSpirits: {
    type: Array,
    default: () => []
  },
  selectedSubcategories: {
    type: Array,
    default: () => []
  },
  selectedSeasons: {
    type: Array,
    default: () => []
  },
  showOnlyMakeable: {
    type: Boolean,
    default: false
  },
  spiritCategories: {
    type: Array,
    required: true
  },
  spiritSubcategories: {
    type: Object,
    required: true
  },
  seasons: {
    type: Array,
    required: true
  },
  onClose: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['update:selectedSpirits', 'update:selectedSubcategories', 'update:selectedSeasons', 'update:showOnlyMakeable']);

// Computed pour les sous-catégories filtrées
const filteredSubcategories = computed(() => {
  if (props.selectedSpirits.length === 0) return [];

  const allSubcategories = props.selectedSpirits.flatMap(spirit => {
    return props.spiritSubcategories[spirit] || [];
  });

  return allSubcategories.filter((sub, index, self) => 
    index === self.findIndex(s => s.key === sub.key)
  );
});

// Computed pour les filtres actifs
const hasActiveFilters = computed(() => 
  props.selectedSpirits.length > 0 || 
  props.selectedSubcategories.length > 0 || 
  props.selectedSeasons.length > 0 ||
  props.showOnlyMakeable
);

// Getter et setter pour les propriétés réactives
const selectedSpirits = computed({
  get: () => props.selectedSpirits,
  set: (val) => emit('update:selectedSpirits', val)
});

const selectedSubcategories = computed({
  get: () => props.selectedSubcategories,
  set: (val) => emit('update:selectedSubcategories', val)
});

const selectedSeasons = computed({
  get: () => props.selectedSeasons,
  set: (val) => emit('update:selectedSeasons', val)
});

const showOnlyMakeable = computed({
  get: () => props.showOnlyMakeable,
  set: (val) => emit('update:showOnlyMakeable', val)
});

// Méthodes
function toggleFilter(array, value) {
  const index = array.indexOf(value);
  if (index > -1) {
    array.splice(index, 1);
  } else {
    array.push(value);
  }
}

function getSpiritLabel(key) {
  const spirit = props.spiritCategories.find(s => s.key === key);
  return spirit ? spirit.value : key;
}

function getSubcategoryLabel(key) {
  for (const spirits of Object.values(props.spiritSubcategories)) {
    const sub = spirits.find(s => s.key === key);
    if (sub) return sub.value;
  }
  return key;
}

function getSeasonLabel(key) {
  const season = props.seasons.find(s => s.key === key);
  return season ? `${season.icon} ${season.value}` : key;
}

function clearAllFilters() {
  selectedSpirits.value = [];
  selectedSubcategories.value = [];
  selectedSeasons.value = [];
}
</script>

<style scoped>
/* Les styles sont centralisés dans styles.css */
</style>
