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

      <div class="inventory-stats">
        <div class="stat">
          <span class="stat-label">Sélectionnés :</span>
          <span class="stat-value">{{ selectedCount }} / {{ totalCount }}</span>
        </div>
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
    <!-- <div class="inventory-stats">
      <div class="stat">
        <span class="stat-label">Sélectionnés :</span>
        <span class="stat-value">{{ selectedCount }} / {{ totalCount }}</span>
      </div>
    </div> -->

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
        <div class="category-header" @click="toggleExpanded(category.key)">
          <div class="category-title-row">
            <component :is="isExpanded(category.key) ? ChevronDown : ChevronRight" :size="16" class="category-chevron" />
            <h3 class="category-title">
              <span class="category-icon">{{ category.icon }}</span>
              {{ category.label }}
            </h3>
            <span class="category-count">
              {{ category.selectedCount }} / {{ category.ingredients.length }}
            </span>
          </div>
          <button
            @click.stop="toggleCategory(category.key, !category.allSelected)"
            class="btn-toggle-category"
          >
            {{ category.allSelected ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
        </div>

        <div class="category-body" v-show="isExpanded(category.key)">
          <div
            class="ingredient-item"
            :class="{ 'ingredient-item--priced': hasIngredient(ing.type) }"
            v-for="ing in category.ingredients"
            :key="ing.type"
          >
            <input
              type="checkbox"
              class="ingredient-checkbox"
              :checked="hasIngredient(ing.type)"
              @change="toggleIngredient(ing.type)"
            />
            <span class="ingredient-name">{{ ing.name }}</span>
            <div class="ingredient-pricing" v-if="hasIngredient(ing.type)">
              <select v-model="ing.pricing_mode" @change="updateIngredientPricing(ing.type, { pricing_mode: ing.pricing_mode })">
                <option value="bottle">Bouteille</option>
                <option value="ml">Au ml</option>
              </select>
              <template v-if="ing.pricing_mode === 'ml'">
                <input type="number" step="0.001" v-model.number="ing.price_per_ml"
                  @change="updateIngredientPricing(ing.type, { price_per_ml: ing.price_per_ml })" placeholder="€/ml" />
              </template>
              <template v-else>
                <input type="number" step="0.5" v-model.number="ing.bottle_price"
                  @change="updateIngredientPricing(ing.type, { bottle_price: ing.bottle_price })" placeholder="€ bouteille" />
                <input type="number" step="10" v-model.number="ing.bottle_volume_ml"
                  @change="updateIngredientPricing(ing.type, { bottle_volume_ml: ing.bottle_volume_ml })" placeholder="ml" />
              </template>
            </div>
          </div>

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
import { CheckSquare, Square, Search, Plus, ChevronDown, ChevronRight  } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import AddIngredientModal from '@/Components/Modals/AddIngredientModal.vue'
const {
  ingredients,
  loading,
  toggleIngredient,
  toggleCategory,
  selectAll,
  deselectAll,
  updateIngredientPricing,
  hasIngredient,
} = useInventory()

const searchQuery    = ref('')
const addModalTarget = ref(null)

function openAddModal(category) {
  addModalTarget.value = category
}

const categoryMetadata = {
  spirits:   { label: 'Spiritueux',    icon: '🥃' },
  licors:    { label: 'Liqueurs',      icon: '🍷' },
  modifiers: { label: 'Modificateurs', icon: '🍸' },
  juices:    { label: 'Jus',           icon: '🍊' },
  syrups:    { label: 'Sirops',        icon: '🍯' },
  bitters:   { label: 'Bitters',       icon: '💧' },
  mixers:    { label: 'Mixers',        icon: '🥤' },
  garnish:   { label: 'Garniture',     icon: '🍋' },
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

  const orderedKeys = [
    ...Object.keys(categoryMetadata),
    ...Object.keys(groups).filter(key => !categoryMetadata[key])
  ]

  return orderedKeys
    .filter(key => groups[key])
    .map(key => {
      const ings = groups[key]

      return {
        key,
        label: categoryMetadata[key]?.label || key,
        icon: categoryMetadata[key]?.icon || '📦',
        ingredients: ings,
        selectedCount: ings.filter(i => i.available).length,
        allSelected: ings.every(i => i.available),
      }
    })
})

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return ingredients.value.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.type.toLowerCase().includes(q)
  )
})

const expandedCategories = ref(new Set())

function toggleExpanded(key) {
  const next = new Set(expandedCategories.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedCategories.value = next
}

function isExpanded(key) {
  return expandedCategories.value.has(key)
}
</script>