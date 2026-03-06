<template>
  <div class="min-h-screen menu-app">

    <!-- Header -->
    <div class="header">
      <div class="header-container">
        <div class="header-top">
          <!-- Brand -->
          <div class="header-brand">
            <Wine class="header-icon" :size="22" />
            <div>
              <h1 class="header-title">Martini Please</h1>
              <p class="header-subtitle">🧊 Bartender</p>
            </div>
          </div>

          <!-- Recherche inline -->
          <div class="search-container">
            <Search class="search-icon" :size="16" />
            <input
              type="text"
              placeholder="Rechercher un cocktail ou un ingrédient..."
              v-model="searchTerm"
              class="search-input"
            />
          </div>

          <!-- Bouton nouveau cocktail -->
          <button @click="openNewModal" class="btn-new-cocktail">
            <Plus :size="15" /> Nouveau cocktail
          </button>
        </div>
      </div>
    </div>

    <!-- Main -->
    <div class="main-content">

      <!-- Inventaire -->
      <div class="section-card">
        <button @click="showInventory = !showInventory" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showInventory }" />
          <h2 class="section-title">
            📦 Stock du bar
            <span class="count-badge">{{ selectedCount }} / {{ totalCount }}</span>
          </h2>
          <span></span>
        </button>
        <InventoryManager v-if="showInventory" />
      </div>

      <!-- Filtres -->
      <div class="section-card">
        <button @click="showFilters = !showFilters" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showFilters }" />
          <h2 class="section-title">🔍 Filtres</h2>
          <span></span>
        </button>

        <div v-if="showFilters" class="filters-dropdown-content">

          <!-- Spiritueux -->
          <div class="filter-group">
            <label class="filter-label">Spiritueux</label>
            <div class="chips-container">
              <button
                v-for="spirit in spiritCategories"
                :key="spirit.key"
                @click="toggleFilter(selectedSpirits, spirit.key)"
                :class="['chip', { active: selectedSpirits.includes(spirit.key) }]"
              >
                {{ spirit.label }}
              </button>
            </div>
          </div>

          <!-- Saison -->
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
                }]"
              >
                {{ season.icon }} {{ season.label }}
              </button>
            </div>
          </div>

          <!-- Disponibilité -->
          <div class="filter-group">
            <label class="filter-label">Disponibilité</label>
            <div class="chips-container">
              <button
                @click="showOnlyMakeable = !showOnlyMakeable"
                :class="['chip', { active: showOnlyMakeable }]"
              >
                🍸 Cocktails réalisables
              </button>
            </div>
          </div>

          <!-- Tags actifs -->
          <div v-if="hasActiveFilters" class="active-filters-bar">
            <span v-for="s in selectedSpirits" :key="s" class="filter-tag">
              {{ getSpiritLabel(s) }}
              <X @click="toggleFilter(selectedSpirits, s)" :size="14" />
            </span>
            <span v-for="s in selectedSeasons" :key="s" class="filter-tag">
              {{ getSeasonLabel(s) }}
              <X @click="toggleFilter(selectedSeasons, s)" :size="14" />
            </span>
            <button @click="clearFilters" class="clear-all-btn">Effacer tout</button>
          </div>
        </div>
      </div>

      <!-- Liste cocktails -->
      <div>
        <h2 class="cocktails-header">
          {{ filteredCocktails.length }} cocktail{{ filteredCocktails.length > 1 ? 's' : '' }} trouvé{{ filteredCocktails.length > 1 ? 's' : '' }}
          <span v-if="showOnlyMakeable" class="text-green-600 text-sm font-normal ml-2">
            ({{ makeableCount }} réalisables)
          </span>
        </h2>

        <div v-if="cocktailsLoading" class="text-center py-8 text-gray-400">
          Chargement des cocktails...
        </div>

        <div v-else-if="filteredCocktails.length === 0" class="text-center py-8 text-gray-400">
          Aucun cocktail trouvé avec ces critères
        </div>

        <div v-else class="cocktails-grid">
          <CocktailCard
            v-for="cocktail in filteredCocktails"
            :key="cocktail.id"
            :cocktail="cocktail"
            @edit="openEditModal"
            @delete="handleDelete"
          />
        </div>
      </div>

    </div>

    <!-- Modal édition / création cocktail -->
    <CocktailModal
      v-if="showCocktailModal"
      :cocktail="editingCocktail"
      @save="handleSave"
      @close="showCocktailModal = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Wine, Search, ChevronDown, X, Plus } from 'lucide-vue-next'

import { useCocktails } from '@/composables/useCocktails'
import { useInventory } from '@/composables/useInventory'

import CocktailCard from '@/Components/CocktailCard.vue'
import InventoryManager from '@/Components/Modals/InventoryManager.vue'
import CocktailModal from '@/Components/Modals/CocktailModal.vue'

const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients } = useInventory()

// UI
const showInventory   = ref(false)
const showFilters     = ref(false)
const showCocktailModal = ref(false)
const editingCocktail = ref(null)

// Filtres
const searchTerm       = ref('')
const selectedSpirits  = ref([])
const selectedSeasons  = ref([])
const showOnlyMakeable = ref(false)

// Référentiels filtres
const spiritCategories = [
  { key: 'Whiskey_Family', label: '🥃 Whiskey' },
  { key: 'Rum_Family',     label: '🍹 Rhum' },
  { key: 'Agave_Family',   label: '🌵 Agave' },
  { key: 'Gin',            label: '🌿 Gin' },
  { key: 'Vodka',          label: '❄️ Vodka' },
  { key: 'Brandy_Family',  label: '🍇 Brandy' },
  { key: 'Pisco',          label: '🫙 Pisco' },
  { key: 'Absinthe',       label: '🌱 Absinthe' },
  { key: 'Other',          label: '✨ Autre' },
]

const seasons = [
  { key: 'all',    icon: '🍸', label: 'Toutes' },
  { key: 'spring', icon: '🌸', label: 'Printemps' },
  { key: 'summer', icon: '☀️', label: 'Été' },
  { key: 'fall',   icon: '🍂', label: 'Automne' },
  { key: 'winter', icon: '❄️', label: 'Hiver' },
]

// Stats inventaire
const selectedCount = computed(() => barInventory.value.size)
const totalCount    = computed(() => ingredients.value.length)

// Vérifier si un cocktail est réalisable
function isMakeable(cocktail) {
  const recipe = cocktail.recipe || []
  if (!recipe.length) return false
  return recipe.every(ing => ing.Type === 'garnish' || barInventory.value.has(ing.Type))
}

const makeableCount = computed(() =>
  cocktails.value.filter(isMakeable).length
)

// Filtrage
const filteredCocktails = computed(() => {
  let list = cocktails.value

  // Recherche texte
  if (searchTerm.value.trim()) {
    const s = searchTerm.value.toLowerCase().trim()
    list = list.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.recipe?.some(ing => ing.Ingredient?.toLowerCase().includes(s)) ||
      c.creator?.toLowerCase().includes(s) ||
      c.profile?.some(p => p.toLowerCase().includes(s))
    )
  }

  // Spiritueux
  if (selectedSpirits.value.length) {
    list = list.filter(c => selectedSpirits.value.includes(c.category))
  }

  // Saison
  if (selectedSeasons.value.length) {
    list = list.filter(c =>
      Array.isArray(c.season)
        ? c.season.some(s => selectedSeasons.value.includes(s))
        : selectedSeasons.value.includes(c.season)
    )
  }

  // Réalisables uniquement
  if (showOnlyMakeable.value) {
    list = list.filter(isMakeable)
  }

  return list
})

// Helpers filtres
const hasActiveFilters = computed(() =>
  selectedSpirits.value.length > 0 || selectedSeasons.value.length > 0
)

function toggleFilter(array, value) {
  const idx = array.indexOf(value)
  if (idx > -1) array.splice(idx, 1)
  else array.push(value)
}

function clearFilters() {
  selectedSpirits.value  = []
  selectedSeasons.value  = []
}

function getSpiritLabel(key) {
  return spiritCategories.find(s => s.key === key)?.label || key
}

function getSeasonLabel(key) {
  const s = seasons.find(s => s.key === key)
  return s ? `${s.icon} ${s.label}` : key
}

// CRUD cocktails
function openEditModal(cocktail) {
  editingCocktail.value = cocktail
  showCocktailModal.value = true
}

function openNewModal() {
  editingCocktail.value = null
  showCocktailModal.value = true
}

async function handleSave(data) {
  if (data.id) {
    await updateCocktail(data.id, data)
  } else {
    await createCocktail(data)
  }
  showCocktailModal.value = false
}

async function handleDelete(id) {
  if (!confirm('Supprimer ce cocktail ?')) return
  await deleteCocktail(id)
}

onMounted(async () => {
  await Promise.all([fetchCocktails(), fetchIngredients()])
})
</script>

<style scoped>
.count-badge {
  margin-left: 0.5rem;
  padding: 0.1rem 0.6rem;
  background: #3b82f6;
  color: white;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.expand-actions-btn svg {
  transition: transform 0.25s ease;
}
.expand-actions-btn svg.rotated {
  transform: rotate(180deg);
}
.btn-new-cocktail {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-new-cocktail:hover {
  background: #d97706;
}
</style>