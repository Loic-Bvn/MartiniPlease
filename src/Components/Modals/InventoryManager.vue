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
          <div class="ingredient-item-wrap" v-for="ing in category.ingredients" :key="ing.type">
            <div class="ingredient-item">
              <input
                type="checkbox"
                class="ingredient-checkbox"
                :checked="hasIngredient(ing.type)"
                @change="toggleIngredient(ing.type)"
              />
              <span class="ingredient-name">{{ ing.name }}</span>
              <button
                type="button"
                class="btn-delete-ingredient"
                @click.stop="handleDeleteIngredient(ing)"
                title="Supprimer cet ingrédient"
              >
                <Trash2 :size="14" />
              </button>
              <button
                v-if="(ing.references || []).length"
                type="button"
                class="badge-references"
                @click.stop="toggleReferencesExpanded(ing.type)"
                :title="'Gérer les références'"
              >
                {{ (ing.references || []).length }} réf.
              </button>
              <button
                v-else
                type="button"
                class="btn-manage-references"
                @click.stop="toggleReferencesExpanded(ing.type)"
                title="Gérer les références"
              >
                <BookPlus :size="14" />
              </button>
              <div class="ingredient-pricing" v-if="hasIngredient(ing.type)">
                <select v-model="ing.pricing_mode" @change="updateIngredientPricing(ing.type, { pricing_mode: ing.pricing_mode })">
                  <option value="bottle">Bouteille</option>
                  <option value="ml">Au ml</option>
                </select>
                <template v-if="ing.pricing_mode === 'ml'">
                  <input type="number" step="0.001" v-model.number="ing.price_per_ml"
                    @change="updateIngredientPricing(ing.type, { price_per_ml: ing.price_per_ml })" placeholder="€/ml">€/ml</input>
                </template>
                <template v-else>
                  <input type="number" step="0.5" v-model.number="ing.bottle_price"
                    @change="updateIngredientPricing(ing.type, { bottle_price: ing.bottle_price })" placeholder="€ bouteille">€</input>
                  <input type="number" step="10" v-model.number="ing.bottle_volume_ml"
                    @change="updateIngredientPricing(ing.type, { bottle_volume_ml: ing.bottle_volume_ml })" placeholder="ml">ml</input>
                </template>
                <input
                  v-if="hasAbv(category.key)"
                  type="number" step="0.5" min="0" max="100"
                  v-model.number="ing.abv"
                  @change="updateIngredientPricing(ing.type, { abv: ing.abv })"
                  placeholder="% abv"
                  title="Titre alcoométrique par défaut de cet ingrédient"
                  class="ingredient-abv-input"
                >%</input>
              </div>
            </div>

            <!-- Références (mode expert, opt-in, replié par défaut) -->
            <div class="references-panel" v-show="isReferencesExpanded(ing.type)">
              <div class="reference-row" v-for="ref in (ing.references || [])" :key="ref.id">
                <input
                  type="checkbox"
                  class="reference-checkbox"
                  :checked="ref.available"
                  @change="toggleReferenceAvailable(ing.type, ref.id)"
                />
                <span class="reference-name">{{ ref.name }}</span>
                <div class="reference-pricing" v-if="ref.available">
                  <input type="number" step="0.5" :value="ref.abv"
                    @change="updateReference(ing.type, ref.id, { abv: parseFloat($event.target.value) || null })" placeholder="% abv" class="reference-abv-input">%</input>
                  <select :value="ref.pricing_mode" @change="updateReference(ing.type, ref.id, { pricing_mode: $event.target.value })">
                    <option value="bottle">Bouteille</option>
                    <option value="ml">Au ml</option>
                  </select>
                  <template v-if="ref.pricing_mode === 'ml'">
                    <input type="number" step="0.001" :value="ref.price_per_ml"
                      @change="updateReference(ing.type, ref.id, { price_per_ml: parseFloat($event.target.value) || null })" placeholder="€/ml">€/ml</input>
                  </template>
                  <template v-else>
                    <input type="number" step="0.5" :value="ref.bottle_price"
                      @change="updateReference(ing.type, ref.id, { bottle_price: parseFloat($event.target.value) || null })" placeholder="€ bouteille">€</input>
                    <input type="number" step="10" :value="ref.bottle_volume_ml"
                      @change="updateReference(ing.type, ref.id, { bottle_volume_ml: parseFloat($event.target.value) || null })" placeholder="ml">ml</input>
                  </template>
                </div>
                <button type="button" class="btn-remove-reference" @click="removeReference(ing.type, ref.id)" title="Supprimer cette référence">
                  <Trash2 :size="14" />
                </button>
              </div>

              <!-- Formulaire d'ajout de référence -->
              <form class="reference-add-form" @submit.prevent="handleAddReference(ing.type)">
                <input
                  type="text"
                  v-model="newReferenceName[ing.type]"
                  placeholder="Nom de la bouteille (ex. Havana Club 3 Años)"
                  class="reference-add-input"
                />
                <button type="submit" class="btn-add-ingredient" :disabled="!newReferenceName[ing.type]?.trim()">
                  <Plus :size="14" />
                  <span>Ajouter une référence</span>
                </button>
              </form>
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

    <!-- Modal de confirmation de suppression -->
    <ConfirmModal
      :open="!!ingredientToDelete"
      title="🗑️ Supprimer l'ingrédient"
      :message="deleteWarningMessage"
      confirm-label="Supprimer"
      cancel-label="Annuler"
      @confirm="confirmDeleteIngredient"
      @cancel="cancelDeleteIngredient"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { CheckSquare, Square, Search, Plus, ChevronDown, ChevronRight, BookPlus, Trash2 } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import { useToast } from '@/composables/useToast'
import ConfirmModal      from '@/Components/Modals/ConfirmModal.vue'
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
  addReference,
  updateReference,
  removeReference,
  toggleReferenceAvailable,
  deleteIngredient,
} = useInventory()
const { showToast } = useToast()

const searchQuery    = ref('')
const addModalTarget = ref(null)

function openAddModal(category) {
  addModalTarget.value = category
}

// ── Références (mode expert, opt-in) ─────────────────────────────────
const expandedReferences = ref(new Set())
const newReferenceName   = reactive({})

function toggleReferencesExpanded(type) {
  const next = new Set(expandedReferences.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  expandedReferences.value = next
}

function isReferencesExpanded(type) {
  return expandedReferences.value.has(type)
}

async function handleAddReference(type) {
  const name = newReferenceName[type]?.trim()
  if (!name) return
  try {
    await addReference(type, { name })
    newReferenceName[type] = ''
  } catch (err) {
    console.error('❌ Erreur ajout référence:', err)
  }
}

// ── Suppression d'un ingrédient (custom modal, plus de window.confirm) ──
const ingredientToDelete = ref(null)

const deleteWarningMessage = computed(() => {
  const ing = ingredientToDelete.value
  if (!ing) return ''
  const refCount = (ing.references || []).length
  return refCount
    ? `Supprimer "${ing.name}" et ${refCount === 1 ? 'sa référence' : `ses ${refCount} références`} ? Les cocktails qui l'utilisent l'afficheront comme indisponible.`
    : `Supprimer "${ing.name}" ? Les cocktails qui l'utilisent l'afficheront comme indisponible.`
})

function handleDeleteIngredient(ing) {
  ingredientToDelete.value = ing
}

function cancelDeleteIngredient() {
  ingredientToDelete.value = null
}

async function confirmDeleteIngredient() {
  const ing = ingredientToDelete.value
  if (!ing) return

  try {
    await deleteIngredient(ing.type)
    showToast(`🗑️ ${ing.name} supprimé`)
  } catch (err) {
    console.error('❌ Erreur suppression ingrédient:', err)
    showToast('Erreur lors de la suppression.')
  } finally {
    ingredientToDelete.value = null
  }
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

// Catégories pour lesquelles l'ABV générique de l'ingrédient est éditable
// (sert de valeur par défaut dans le calcul de coût/ABV tant qu'aucune
// référence précise n'est renseignée)
const ABV_EDITABLE_CATEGORIES = new Set(['spirits', 'licors', 'modifiers', 'mixers'])

function hasAbv(categoryKey) {
  return ABV_EDITABLE_CATEGORIES.has(categoryKey)
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