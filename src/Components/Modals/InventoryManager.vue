<template>
  <div class="inventory-manager" @keydown.esc="handleInventoryEscape">

    <!-- Recherche + filtre -->
    <div class="inventory-header">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un ingrédient..."
          class="search-input"
        />
      </div>
      <div class="inventory-filters" role="tablist" aria-label="Filtrer le stock">
        <button
          v-for="option in inventoryFilterOptions"
          :key="option.value"
          type="button"
          class="filter-chip"
          :class="{ 'filter-chip--active': inventoryFilter === option.value }"
          @click="inventoryFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="inventory-stats">
      <div class="stat">
        <span class="stat-label">Stock :</span>
        <span class="stat-value">{{ inStockCount }} / {{ totalCount }} en stock</span>
      </div>
      <div class="stat">
        <span class="stat-label">Manquants :</span>
        <span class="stat-value">{{ missingCount }}</span>
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
          :checked="isIngredientAvailable(ing)"
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
              <component :is="category.icon" :size="16" class="category-icon" />
              {{ category.label }}
            </h3>
            <span class="category-count" :title="`${category.inStockCount} en stock / ${category.totalCount} total`">
              {{ category.inStockCount }} / {{ category.totalCount }}
            </span>
          </div>
          <div class="category-progress" aria-hidden="true">
            <span :style="{ width: `${category.progress}%` }"></span>
          </div>
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
              <span class="ingredient-name" :title="ing.name">{{ ing.name }}</span>
              <button
                v-if="category.key !== 'garnish' && (ing.references || []).length"
                type="button"
                class="badge-references"
                @click.stop="toggleReferencesExpanded(ing.type)"
                :title="'Gérer les références'"
              >
                {{ (ing.references || []).length }} réf.
              </button>
              <button
                v-else-if="category.key !== 'garnish'"
                type="button"
                class="btn-manage-references"
                @click.stop="toggleReferencesExpanded(ing.type)"
                title="Gérer les références"
              >
                <BookPlus :size="14" />
              </button>
              <div class="ingredient-item-actions">
                <div v-if="category.key !== 'garnish'" class="ingredient-pricing" :class="{ 'fields-disabled': !hasIngredient(ing.type) }">
                  <span v-if="hasAbv(category.key)" class="field-unit field-unit--percent">
                    <input
                      type="number" step="0.5" min="0" max="100"
                      v-model.number="ing.abv"
                      @change="updateIngredientPricing(ing.type, { abv: ing.abv })"
                      placeholder="40"
                      title="Titre alcoométrique par défaut de cet ingrédient"
                      class="ingredient-abv-input"
                    />
                    <span class="field-unit-suffix">%</span>
                  </span>
                  <select v-model="ing.pricing_mode" class="pricing-mode-select" title="Mode de tarification"
                    @change="updateIngredientPricing(ing.type, { pricing_mode: ing.pricing_mode })">
                    <option value="bottle">Btl</option>
                    <option value="ml">mL</option>
                  </select>
                  <template v-if="ing.pricing_mode === 'ml'">
                    <span class="field-unit field-unit--rate">
                      <input type="number" step="0.001" v-model.number="ing.price_per_ml" title="Prix au ml"
                        @change="updateIngredientPricing(ing.type, { price_per_ml: ing.price_per_ml })" placeholder="0.05" />
                      <span class="field-unit-suffix">€/ml</span>
                    </span>
                  </template>
                  <template v-else>
                    <span class="field-unit field-unit--currency">
                      <input type="number" step="0.5" v-model.number="ing.bottle_price" title="Prix bouteille"
                        @change="updateIngredientPricing(ing.type, { bottle_price: ing.bottle_price })" placeholder="0" />
                      <span class="field-unit-suffix">€</span>
                    </span>
                    <span class="field-unit field-unit--volume">
                      <input type="number" step="10" v-model.number="ing.bottle_volume_ml" title="Volume bouteille"
                        @change="updateIngredientPricing(ing.type, { bottle_volume_ml: ing.bottle_volume_ml })" placeholder="700" />
                      <span class="field-unit-suffix">ml</span>
                    </span>
                  </template>
                </div>
                <button
                  type="button"
                  class="btn-delete-ingredient"
                  @click.stop="handleDeleteIngredient(ing)"
                  title="Supprimer cet ingrédient"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <!-- Références (mode expert, opt-in, replié par défaut) -->
            <div v-if="category.key !== 'garnish' && isReferencesExpanded(ing.type)" class="references-panel">
              <div class="reference-row" v-for="ref in (ing.references || [])" :key="ref.id">
                <input
                  type="checkbox"
                  class="reference-checkbox"
                  :checked="ref.available"
                  @change="toggleReferenceAvailable(ing.type, ref.id)"
                />
                <span class="reference-name" :title="ref.name">{{ ref.name }}</span>
                <div class="reference-actions">
                  <div class="reference-pricing" :class="{ 'fields-disabled': !ref.available }">
                    <span class="field-unit field-unit--percent">
                      <input type="number" step="0.5" :value="ref.abv" title="Titre alcoométrique"
                        @change="updateReference(ing.type, ref.id, { abv: parseFloat($event.target.value) || null })" placeholder="40" class="reference-abv-input" />
                      <span class="field-unit-suffix">%</span>
                    </span>
                    <select :value="ref.pricing_mode" class="pricing-mode-select" title="Mode de tarification"
                      @change="updateReference(ing.type, ref.id, { pricing_mode: $event.target.value })">
                      <option value="bottle">Btl</option>
                      <option value="ml">mL</option>
                    </select>
                    <template v-if="ref.pricing_mode === 'ml'">
                      <span class="field-unit field-unit--rate">
                        <input type="number" step="0.001" :value="ref.price_per_ml" title="Prix au ml"
                          @change="updateReference(ing.type, ref.id, { price_per_ml: parseFloat($event.target.value) || null })" placeholder="0.05" />
                        <span class="field-unit-suffix">€/ml</span>
                      </span>
                    </template>
                    <template v-else>
                      <span class="field-unit field-unit--currency">
                        <input type="number" step="0.5" :value="ref.bottle_price" title="Prix bouteille"
                          @change="updateReference(ing.type, ref.id, { bottle_price: parseFloat($event.target.value) || null })" placeholder="0" />
                        <span class="field-unit-suffix">€</span>
                      </span>
                      <span class="field-unit field-unit--volume">
                        <input type="number" step="10" :value="ref.bottle_volume_ml" title="Volume bouteille"
                          @change="updateReference(ing.type, ref.id, { bottle_volume_ml: parseFloat($event.target.value) || null })" placeholder="700" />
                        <span class="field-unit-suffix">ml</span>
                      </span>
                    </template>
                  </div>
                  <button type="button" class="btn-remove-reference" @click="handleDeleteReference(ing, ref)" title="Supprimer cette référence">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>

              <!-- Formulaire d'ajout de référence -->
              <form class="reference-add-form" @submit.prevent="handleAddReference(ing.type)">
                <input
                  type="text"
                  v-model="newReferenceName[ing.type]"
                  placeholder="Nom de la bouteille (ex. Havana Club 3 Años)"
                  class="reference-add-input"
                />
                <button
                  type="submit"
                  class="btn-add-ingredient btn-add-reference"
                  :disabled="!newReferenceName[ing.type]?.trim()"
                  aria-label="Ajouter une référence"
                  title="Ajouter une référence"
                >
                  <Plus :size="14" />
                  <span class="btn-add-reference-label">Ajouter une référence</span>
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
      title="Supprimer l'ingrédient"
      :message="deleteWarningMessage"
      confirm-label="Supprimer"
      cancel-label="Annuler"
      @confirm="confirmDeleteIngredient"
      @cancel="cancelDeleteIngredient"
    />

    <!-- Modal de confirmation de suppression d'une référence -->
    <ConfirmModal
      :open="!!referenceToDelete"
      title="Supprimer la référence"
      :message="deleteReferenceWarningMessage"
      confirm-label="Supprimer"
      cancel-label="Annuler"
      @confirm="confirmDeleteReference"
      @cancel="cancelDeleteReference"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Search, Plus, ChevronDown, ChevronRight, BookPlus, Trash2 } from 'lucide-vue-next'
import { categoryIcons } from '@/utils/lucideIcons'
import { useInventory } from '@/composables/useInventory'
import { useToast } from '@/composables/useToast'
import ConfirmModal      from '@/Components/Modals/ConfirmModal.vue'
import AddIngredientModal from '@/Components/Modals/AddIngredientModal.vue'

const props = defineProps({
  locale: { type: String, default: 'fr' },
})

const emit = defineEmits(['close'])
const {
  ingredients,
  loading,
  toggleIngredient,
  updateIngredientPricing,
  hasIngredient,
  matchesInventoryFilter,
  inStockCount,
  missingCount,
  addReference,
  updateReference,
  removeReference,
  toggleReferenceAvailable,
  deleteIngredient,
} = useInventory()
const { showToast } = useToast()

function handleInventoryEscape(event) {
  if (!event.target.closest('[role="dialog"]')) emit('close')
}

const searchQuery    = ref('')
const addModalTarget = ref(null)
const inventoryFilter = ref('all')
const inventoryFilterOptions = computed(() => [
  { value: 'all', label: props.locale === 'fr' ? 'Tous' : 'All' },
  { value: 'in_stock', label: props.locale === 'fr' ? 'En stock' : 'In stock' },
  { value: 'missing', label: props.locale === 'fr' ? 'Manquants' : 'Missing' },
])

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
    showToast(`${ing.name} supprimé`)
  } catch (err) {
    console.error('❌ Erreur suppression ingrédient:', err)
    showToast('Erreur lors de la suppression.')
  } finally {
    ingredientToDelete.value = null
  }
}

// ── Suppression d'une référence (custom modal, plus de suppression directe) ──
const referenceToDelete = ref(null)

const deleteReferenceWarningMessage = computed(() => {
  const target = referenceToDelete.value
  if (!target) return ''
  return `Supprimer la référence "${target.ref.name}" ? Les cocktails qui la spécifient l'afficheront comme indisponible.`
})

function handleDeleteReference(ing, ref) {
  referenceToDelete.value = { type: ing.type, ref }
}

function cancelDeleteReference() {
  referenceToDelete.value = null
}

async function confirmDeleteReference() {
  const target = referenceToDelete.value
  if (!target) return

  try {
    await removeReference(target.type, target.ref.id)
    showToast(`${target.ref.name} supprimée`)
  } catch (err) {
    console.error('❌ Erreur suppression référence:', err)
    showToast('Erreur lors de la suppression.')
  } finally {
    referenceToDelete.value = null
  }
}

const categoryMetadata = {
  spirits:   { label: 'Spiritueux',    icon: categoryIcons.spirits },
  licors:    { label: 'Liqueurs',      icon: categoryIcons.licors },
  modifiers: { label: 'Modificateurs', icon: categoryIcons.modifiers },
  juices:    { label: 'Jus',           icon: categoryIcons.juices },
  syrups:    { label: 'Sirops',        icon: categoryIcons.syrups },
  bitters:   { label: 'Bitters',       icon: categoryIcons.bitters },
  mixers:    { label: 'Mixers',        icon: categoryIcons.mixers },
  garnish:   { label: 'Garniture',     icon: categoryIcons.garnish },
  others:    { label: 'Autres',        icon: categoryIcons.others },
}

// Catégories pour lesquelles l'ABV générique de l'ingrédient est éditable
// (sert de valeur par défaut dans le calcul de coût/ABV tant qu'aucune
// référence précise n'est renseignée)
const ABV_EDITABLE_CATEGORIES = new Set(['spirits', 'licors', 'modifiers', 'mixers'])

function hasAbv(categoryKey) {
  return ABV_EDITABLE_CATEGORIES.has(categoryKey)
}

function isIngredientAvailable(ing) {
  if (ing.available) return true
  return (ing.references || []).some(r => r.available)
}

const totalCount = computed(() => ingredients.value.length)
const expandedCategories = ref(new Set())

const filteredIngredients = computed(() =>
  ingredients.value.filter(ing => matchesInventoryFilter(ing, inventoryFilter.value))
)

const defaultExpandedCategories = computed(() => {
  const groups = {}
  filteredIngredients.value.forEach(ing => {
    if (!groups[ing.category]) groups[ing.category] = []
    groups[ing.category].push(ing)
  })

  return new Set(
    Object.entries(groups)
      .filter(([, items]) => items.some(isIngredientAvailable))
      .map(([key]) => key)
  )
})

const categorizedIngredients = computed(() => {
  const groups = {}

  filteredIngredients.value.forEach(ing => {
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

      const inStockCount = ings.filter(isIngredientAvailable).length

      return {
        key,
        label: categoryMetadata[key]?.label || key,
        icon: categoryMetadata[key]?.icon || categoryIcons.others,
        ingredients: ings,
        totalCount: ings.length,
        inStockCount,
        progress: ings.length ? (inStockCount / ings.length) * 100 : 0,
      }
    })
})

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return filteredIngredients.value.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.type.toLowerCase().includes(q)
  )
})

function toggleExpanded(key) {
  const next = new Set(expandedCategories.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedCategories.value = next
}

function isExpanded(key) {
  return expandedCategories.value.has(key) || defaultExpandedCategories.value.has(key)
}
</script>