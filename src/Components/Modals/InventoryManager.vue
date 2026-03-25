<template>
  <div class="inventory-manager">

    <!-- Contrôles globaux -->
    <div class="inventory-header">
      <div class="inventory-controls">
        <button @click="selectAll" class="btn-control btn-select-all">
          <CheckSquare :size="16" /> Tout sélectionner
        </button>
        <button @click="deselectAll" class="btn-control btn-deselect-all">
          <Square :size="16" /> Tout désélectionner
        </button>
      </div>
    </div>

    <!-- Recherche -->
    <div class="search-box">
      <Search :size="18" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher un ingrédient..."
        class="search-input"
      />
    </div>

    <!-- Stats -->
    <div class="inventory-stats">
      <div class="stat">
        <span class="stat-label">Sélectionnés :</span>
        <span class="stat-value">{{ selectedCount }} / {{ totalCount }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Chargement...
    </div>

    <!-- Résultats de recherche -->
    <div v-else-if="searchQuery" class="ingredients-grid">
      <div v-if="searchResults.length === 0" class="no-results">
        Aucun ingrédient trouvé pour "{{ searchQuery }}"
      </div>
      <label
        v-for="ing in searchResults"
        :key="ing.id"
        class="ingredient-item"
      >
        <input
          type="checkbox"
          :checked="ing.available"
          @change="toggleIngredient(ing.type)"
          class="ingredient-checkbox"
        />
        <span class="ingredient-name">{{ ing.name }}</span>
      </label>
    </div>

    <!-- Par catégories -->
    <div v-else class="categories-container">
      <div
        v-for="category in categorizedIngredients"
        :key="category.key"
        class="category-section"
      >
        <div class="category-header">
          <div class="category-title-row">
            <h3 class="category-title">
              <span class="category-icon">{{ category.icon }}</span>
              {{ category.label }}
            </h3>
            <span class="category-count">
              {{ category.selectedCount }} / {{ category.ingredients.length }}
            </span>
          </div>
          <button
            @click="toggleCategory(category.key, !category.allSelected)"
            class="btn-toggle-category"
          >
            {{ category.allSelected ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
        </div>

        <div class="ingredients-grid">
          <label
            v-for="ing in category.ingredients"
            :key="ing.id"
            class="ingredient-item"
          >
            <input
              type="checkbox"
              :checked="ing.available"
              @change="toggleIngredient(ing.type)"
              class="ingredient-checkbox"
            />
            <span class="ingredient-name">{{ ing.name }}</span>
          </label>

          <!-- Bouton "+" -->
          <button
            @click="openAddModal(category)"
            class="btn-add-ingredient"
            :title="`Ajouter un ingrédient dans ${category.label}`"
          >
            <Plus :size="14" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout -->
    <AddIngredientModal
      v-if="addModalTarget"
      :category-key="addModalTarget.key"
      :category-label="addModalTarget.label"
      :category-icon="addModalTarget.icon"
      @close="addModalTarget = null"
      @added="addModalTarget = null"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckSquare, Square, Search, Plus } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import AddIngredientModal from '@/Components/Modals/AddIngredientModal.vue'

const {
  ingredients,
  loading,
  toggleIngredient,
  toggleCategory,
  selectAll,
  deselectAll,
} = useInventory()

const searchQuery    = ref('')
const addModalTarget = ref(null)

function openAddModal(category) {
  addModalTarget.value = category
}

const categoryMetadata = {
  spirits:   { label: 'Spiritueux',    icon: '🥃' },
  liqueurs:  { label: 'Liqueurs',      icon: '🍷' },
  modifiers: { label: 'Modificateurs', icon: '🍸' },
  juices:    { label: 'Jus',           icon: '🍊' },
  syrups:    { label: 'Sirops',        icon: '🍯' },
  bitters:   { label: 'Bitters',       icon: '💧' },
  mixers:    { label: 'Mixers',        icon: '🥤' },
  others:    { label: 'Autres',        icon: '📦' },
}

const selectedCount = computed(() =>
  ingredients.value.filter(i => i.available).length
)
const totalCount = computed(() => ingredients.value.length)

const categorizedIngredients = computed(() => {
  const groups = {}
  ingredients.value.forEach(ing => {
    if (!groups[ing.category]) groups[ing.category] = []
    groups[ing.category].push(ing)
  })
  return Object.entries(groups).map(([key, ings]) => ({
    key,
    label: categoryMetadata[key]?.label || key,
    icon:  categoryMetadata[key]?.icon  || '📦',
    ingredients: ings,
    selectedCount: ings.filter(i => i.available).length,
    allSelected:   ings.every(i => i.available),
  }))
})

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return ingredients.value.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.type.toLowerCase().includes(q)
  )
})
</script>