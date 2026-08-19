<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--catalog" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title">

      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title" id="catalog-modal-title">📚 {{ locale === 'fr' ? 'Importer une recette' : 'Import a recipe' }}</h2>
        <button @click="$emit('close')" class="modal-close-btn" :aria-label="locale === 'fr' ? 'Fermer' : 'Close'">
          <X :size="20" />
        </button>
      </div>

      <!-- Intro : explique le fonctionnement push/pull -->
      <div class="catalog-intro">
        <p>
          {{ locale === 'fr'
            ? 'Piochez une recette partagée par la communauté et ajoutez-la à votre bar.'
            : 'Browse recipes shared by the community and add them to your bar.' }}
        </p>
        <p class="catalog-intro-secondary">
          {{ locale === 'fr'
            ? 'Pour partager une recette depuis votre bar, ouvrez sa carte et cliquez sur '
            : 'To share a recipe from your bar, open its card and click ' }}
          <Upload :size="13" class="catalog-intro-icon" />
          {{ locale === 'fr' ? '.' : '.' }}
        </p>
      </div>

      <div class="modal-body">
        <!-- ── Filtres ── -->
        <div class="catalog-filters">
          <div class="search-container" style="flex:1;">
            <Search class="search-icon" :size="16" />
            <input
              v-model="filters.search"
              type="text"
              :placeholder="locale === 'fr' ? 'Rechercher un cocktail...' : 'Search a cocktail...'"
              class="search-input"
              @input="debouncedFetch"
            />
          </div>
          <select v-model="filters.spirit" @change="doFetch" class="form-input catalog-filter-select">
            <option value="">{{ locale === 'fr' ? 'Tous les spiritueux' : 'All spirits' }}</option>
            <optgroup v-for="cat in spiritCategories" :key="cat.key" :label="cat.label">
              <option v-for="s in cat.spirits" :key="s.key" :value="s.key">{{ s.label }}</option>
            </optgroup>
          </select>
          <select v-model="filters.cocktailStyle" @change="doFetch" class="form-input catalog-filter-select">
            <option value="">{{ locale === 'fr' ? 'Tous les styles' : 'All styles' }}</option>
            <option v-for="s in cocktailStyleOptions" :key="s" :value="s">{{ STYLE_LABELS[s] || s }}</option>
          </select>
          <select v-model="filters.profile" @change="doFetch" class="form-input catalog-filter-select">
            <option value="">{{ locale === 'fr' ? 'Tous les profils' : 'All profiles' }}</option>
            <option v-for="p in profileOptions" :key="p.key" :value="p.key">{{ p.icon }} {{ p.label }}</option>
          </select>
        </div>

        <button v-if="hasActiveFilters" @click="clearFilters" class="btn-modal-secondary catalog-clear-filters">
          {{ locale === 'fr' ? '✕ Effacer les filtres' : '✕ Clear filters' }}
        </button>

        <!-- ── États ── -->
        <div v-if="loading" class="loading-state">
          {{ locale === 'fr' ? 'Chargement du catalogue...' : 'Loading catalog...' }}
        </div>

        <div v-else-if="catalog.length === 0" class="catalog-empty">
          <span style="font-size:2rem">🍸</span>
          <p>{{ locale === 'fr' ? 'Aucune recette trouvée' : 'No recipe found' }}</p>
        </div>

        <!-- ── Liste ── -->
        <div v-else class="catalog-list">
          <div v-for="cocktail in catalog" :key="cocktail.id" class="catalog-item">
            <div class="catalog-item-body">
              <div class="catalog-item-header">
                <div class="catalog-item-title-row">
                  <span class="catalog-item-name">{{ cocktail.name }}</span>
                  <span v-if="cocktail.abv != null" class="catalog-item-abv"> - {{ cocktail.abv }}°</span>
                </div>

                <div class="catalog-item-meta-block">
                  <span class="catalog-item-meta">
                    <span class="catalog-item-meta-label">{{ locale === 'fr' ? 'Proposé par' : 'Submitted by' }}</span>
                    <span class="catalog-item-meta-value">{{ getSubmittedByLabel(cocktail) }}</span>
                  </span>
                </div>
              </div>

              <div class="catalog-item-main-column">
                <div v-if="cocktail.recipe?.length" class="recipe-compact catalog-item-recipe">
                  <div v-for="(ing, i) in cocktail.recipe" :key="i" class="recipe-line">
                    <div class="ingredient-info">
                      <span :class="['recipe-bullet', isAvailable(ing) ? 'recipe-bullet--available' : 'recipe-bullet--missing']"></span>
                      <span :class="['ingredient-name', !isAvailable(ing) ? 'ingredient-name--missing' : '']">
                        {{ getIngredientLabel(ing.Ingredient, locale) }}
                      </span>
                    </div>
                    <span class="ingredient-quantity">{{ formatQty(ing) }}</span>
                  </div>
                </div>

                <div class="catalog-item-footer-row">
                  <div class="catalog-chip-row">
                    <span v-if="cocktail.base_spirit" class="catalog-chip">{{ getIngredientLabel(cocktail.base_spirit, locale) }}</span>
                    <span v-if="cocktail.cocktail_style" class="catalog-chip">{{ STYLE_LABELS[cocktail.cocktail_style] || cocktail.cocktail_style }}</span>
                  </div>

                  <div class="catalog-item-image-actions">
                    <button
                      v-if="!isAlreadyInBar(cocktail.id)"
                      @click="handleImport(cocktail)"
                      :disabled="importing === cocktail.id"
                      class="btn-modal-primary catalog-btn-import"
                    >
                      {{ importing === cocktail.id ? '⏳' : (locale === 'fr' ? '⬇ Importer' : '⬇ Import') }}
                    </button>
                    <span v-else class="catalog-badge catalog-badge--done">
                      ✓ {{ locale === 'fr' ? 'Déjà dans votre bar' : 'Already in your bar' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="catalog-item-image-column">
              <div v-if="cocktail.image" class="catalog-item-image-wrap">
                <img :src="cocktail.image" :alt="cocktail.name" class="catalog-item-image" loading="lazy" />
              </div>
              <div v-else class="catalog-item-image-wrap catalog-item-image-placeholder">
                <Martini :size="28" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, Search, Upload, Martini } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useCatalog } from '@/composables/useCatalog'
import { useCocktails } from '@/composables/useCocktails'
import { useInventory } from '@/composables/useInventory'
import { getIngredientLabel } from '../../constants/typeLabels.js'
import { getBaseSpiritGroups, getCocktailStyles, getProfileOptions } from '@/lib/cocktail-constants'

const props = defineProps({
  locale: { type: String, default: 'fr' },
  unit:   { type: String, default: 'oz' },
})
const emit = defineEmits(['close', 'imported'])

function handleKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

const { catalog, loading, fetchCatalog, importCocktail } = useCatalog()
const { cocktails: barCocktails } = useCocktails()
const { barInventory } = useInventory()

// ── State ─────────────────────────────────────────────
const importing = ref(null)
const barNameById = ref({})

const filters = ref({ search: '', spirit: '', cocktailStyle: '', profile: '' })
let debounceTimer = null

// ── Options de filtre (partagées avec le reste de l'app) ──
const spiritCategories = getBaseSpiritGroups()
const cocktailStyleOptions = getCocktailStyles()
const profileOptions = getProfileOptions()

const STYLE_LABELS = {
  sour:          '🍋 Sour',
  fizz:          '🫧 Fizz',
  highball:      '🥃 Highball',
  tiki:          '🌺 Tiki',
  negroni:       '🔴 Negroni',
  old_fashioned: '🟠 Old Fashioned',
  classic:       '🎩 Classic',
  modern:        '✨ Modern',
  creamy:        '🥛 Creamy',
  flip:          '🥚 Flip',
  spritz:        '🍾 Spritz',
}

// ── Computed ──────────────────────────────────────────
const hasActiveFilters = computed(() =>
  !!filters.value.search || !!filters.value.spirit || !!filters.value.cocktailStyle || !!filters.value.profile
)

// Cocktails du catalog déjà présents dans le bar, dérivé de bar_cocktails_debug.catalog_id
// (source de vérité en DB — contrairement à l'ancien Set "imported" qui ne
// vivait que le temps de la session et oubliait tout à la réouverture de la modal)
const importedCatalogIds = computed(() =>
  new Set(barCocktails.value.filter(c => c.catalog_id).map(c => c.catalog_id))
)
function isAlreadyInBar(catalogId) {
  return importedCatalogIds.value.has(catalogId)
}

// ── Methods ───────────────────────────────────────────
async function doFetch() {
  await fetchCatalog({
    search: filters.value.search,
    spirit: filters.value.spirit,
    cocktailStyle: filters.value.cocktailStyle,
    profiles: filters.value.profile ? [filters.value.profile] : [],
  })
  await refreshCatalogBarNames()
}

function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 300)
}

function clearFilters() {
  filters.value = { search: '', spirit: '', cocktailStyle: '', profile: '' }
  doFetch()
}

async function refreshCatalogBarNames() {
  try {
    const ids = [...new Set((catalog.value || [])
      .map(c => c.submitted_by_bar_id)
      .filter(Boolean))]

    if (!ids.length) {
      barNameById.value = {}
      return
    }

    const { data, error } = await supabase
      .from('bars')
      .select('id, name')
      .in('id', ids)

    if (error) {
      console.error('❌ refreshCatalogBarNames:', error)
      barNameById.value = {}
      return
    }

    barNameById.value = Object.fromEntries((data || []).map(bar => [bar.id, bar.name]))
  } catch (err) {
    console.error('❌ refreshCatalogBarNames:', err)
    barNameById.value = {}
  }
}

function getSubmittedByLabel(cocktail) {
  if (cocktail.submitted_by_bar_id) {
    return barNameById.value[cocktail.submitted_by_bar_id] || (props.locale === 'fr' ? 'Bar public' : 'Public bar')
  }
  return props.locale === 'fr' ? 'Bar public' : 'Public bar'
}

function isAvailable(ing) {
  if (ing.Ingredient === 'garnish') return true
  return barInventory.value.has(ing.Ingredient)
}

function formatQty(ing) {
  if (props.unit === 'ml') {
    if (ing.Ml) return `${ing.Ml}ml`
    if (ing.Dashes) return `${ing.Dashes} dash${ing.Dashes > 1 ? 'es' : ''}`
    return ''
  }
  if (ing.Oz) return `${ing.Oz}oz`
  if (ing.Dashes) return `${ing.Dashes} dash${ing.Dashes > 1 ? 'es' : ''}`
  return ''
}

async function handleImport(cocktail) {
  importing.value = cocktail.id
  try {
    const result = await importCocktail(cocktail)
    if (result.success) emit('imported', result.data)
  } finally {
    importing.value = null
  }
}

doFetch()
</script>