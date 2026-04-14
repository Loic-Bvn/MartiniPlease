<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--catalog">

      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">📚 catalogue de recettes</h2>
        <button @click="$emit('close')" class="modal-close-btn">
          <X :size="20" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="catalog-tabs">
        <button :class="['catalog-tab', { active: activeTab === 'browse' }]" @click="activeTab = 'browse'">
          🌐 Catalogue global
        </button>
        <button :class="['catalog-tab', { active: activeTab === 'mine' }]" @click="activeTab = 'mine'">
          🍾 Mes recettes
          <span v-if="submittableCount > 0" class="catalog-tab-badge">{{ submittableCount }}</span>
        </button>
      </div>

      <!-- ── Tab : catalog global ── -->
      <div v-if="activeTab === 'browse'" class="modal-body">
        <div class="catalog-filters">
          <div class="search-container" style="flex:1;">
            <Search class="search-icon" :size="16" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Rechercher un cocktail..."
              class="search-input"
              @input="debouncedFetch"
            />
          </div>
          <select v-model="filters.spirit" @change="doFetch" class="form-input catalog-filter-select">
            <option value="">Tous les spirits</option>
            <optgroup v-for="cat in spiritCategories" :key="cat.key" :label="cat.label">
              <option v-for="s in cat.spirits" :key="s.key" :value="s.key">{{ s.label }}</option>
            </optgroup>
          </select>
          <select v-model="filters.season" @change="doFetch" class="form-input catalog-filter-select">
            <option value="">Toutes saisons</option>
            <option value="spring">🌸 Printemps</option>
            <option value="summer">☀️ Été</option>
            <option value="fall">🍂 Automne</option>
            <option value="winter">❄️ Hiver</option>
          </select>
        </div>

        <div v-if="loading" class="loading-state">Chargement du catalog...</div>

        <div v-else-if="catalog.length === 0" class="catalog-empty">
          <span style="font-size:2rem">🍸</span>
          <p>Aucune recette trouvée</p>
        </div>

        <div v-else class="catalog-list">
          <div v-for="cocktail in catalog" :key="cocktail.id" class="catalog-item">
            <div class="catalog-item-info">
              <div class="catalog-item-name">{{ cocktail.name }}</div>
              <div class="catalog-item-meta">
                <span v-if="cocktail.base_spirit" class="catalog-chip">{{ cocktail.base_spirit }}</span>
                <span v-if="cocktail.category" class="catalog-chip">{{ cocktail.category }}</span>
                <span v-if="cocktail.difficulty" class="catalog-chip">
                  {{ { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' }[cocktail.difficulty] }}
                </span>
                <span v-if="cocktail.abv" class="catalog-chip">{{ cocktail.abv }}%</span>
              </div>
              <div v-if="cocktail.description" class="catalog-item-desc">{{ cocktail.description }}</div>
            </div>

            <div class="catalog-item-actions">
              <span v-if="isImported(cocktail.id)" class="catalog-badge catalog-badge--done">✓ Importé</span>
              <button
                v-else
                @click="handleImport(cocktail)"
                :disabled="importing === cocktail.id"
                class="btn-modal-primary catalog-btn-import"
              >
                {{ importing === cocktail.id ? '⏳' : '⬇ Importer' }}
              </button>
              <button
                @click="togglePreview(cocktail.id)"
                class="btn-modal-secondary catalog-btn-preview"
                title="Voir la recette"
              >
                <ChevronDown v-if="previewId !== cocktail.id" :size="14" />
                <ChevronUp v-else :size="14" />
              </button>
            </div>

            <div v-if="previewId === cocktail.id" class="catalog-preview">
              <div v-if="cocktail.recipe?.length" class="catalog-recipe">
                <div v-for="(line, i) in cocktail.recipe" :key="i" class="catalog-recipe-line">
                  <span class="catalog-recipe-ingredient">{{ line.Ingredient }}</span>
                  <span class="catalog-recipe-qty">
                    {{ line.Oz ? `${line.Oz} oz` : line.Ml ? `${line.Ml} ml` : line.Dashes ? `${line.Dashes} dashes` : '' }}
                  </span>
                </div>
              </div>
              <div v-if="cocktail.creator" class="catalog-creator">Source : {{ cocktail.creator }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab : Mes recettes ── -->
      <div v-if="activeTab === 'mine'" class="modal-body">
        <p class="catalog-mine-hint">
          Partagez vos créations avec tous les bartenders MartiniPlease.
          Seules les recettes <strong>modifiées depuis leur dernier import</strong> peuvent être proposées.
        </p>

        <div v-if="barCocktails.length === 0" class="catalog-empty">
          <span style="font-size:2rem">🍾</span>
          <p>Aucun cocktail dans votre bar</p>
        </div>

        <div v-else class="catalog-list">
          <div v-for="cocktail in barCocktails" :key="cocktail.id" class="catalog-item">
            <div class="catalog-item-info">
              <div class="catalog-item-name">{{ cocktail.name }}</div>
              <div class="catalog-item-meta">
                <span v-if="cocktail.base_spirit" class="catalog-chip">{{ cocktail.base_spirit }}</span>
                <span v-if="cocktail.difficulty" class="catalog-chip">
                  {{ { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' }[cocktail.difficulty] }}
                </span>
              </div>
            </div>

            <div class="catalog-item-actions">
              <!-- Déjà soumis ET non modifié → grisé -->
              <span
                v-if="isSubmitted(cocktail.id) && modifiedStates[cocktail.id] === false"
                class="catalog-badge catalog-badge--unchanged"
                title="Identique à la version déjà proposée"
              >
                = Inchangé
              </span>

              <!-- Déjà soumis mais modifié depuis → fork possible -->
              <button
                v-else-if="isSubmitted(cocktail.id) && modifiedStates[cocktail.id] === true"
                @click="handleSubmit(cocktail)"
                :disabled="submitting === cocktail.id"
                class="btn-modal-primary catalog-btn-import catalog-btn--fork"
              >
                {{ submitting === cocktail.id ? '⏳' : '🔀 Proposer (fork)' }}
              </button>

              <!-- Jamais soumis -->
              <button
                v-else-if="!isSubmitted(cocktail.id)"
                @click="handleSubmit(cocktail)"
                :disabled="submitting === cocktail.id || modifiedStates[cocktail.id] === false"
                class="btn-modal-primary catalog-btn-import"
              >
                {{ submitting === cocktail.id ? '⏳' : '🌐 Proposer' }}
              </button>

              <!-- Vérification en cours -->
              <span v-else class="catalog-badge catalog-badge--checking">…</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { X, Search, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useCatalog } from '@/composables/useCatalog'
import { useCocktails } from '@/composables/useCocktails'

const emit = defineEmits(['close', 'imported'])

const {
  catalog,
  loading,
  fetchCatalog,
  importCocktail,
  submitToCatalog,
  isImported,
  isSubmitted,
  isModified,
} = useCatalog()

const { cocktails } = useCocktails()

// ── State ─────────────────────────────────────────────
const activeTab  = ref('browse')
const previewId  = ref(null)
const importing  = ref(null)
const submitting = ref(null)

// Cache des résultats isModified() par cocktail.id : true | false | undefined (en cours)
const modifiedStates = ref({})

const filters = ref({ search: '', spirit: '', season: '' })
let debounceTimer = null

// ── Computed ──────────────────────────────────────────
const barCocktails = computed(() => cocktails.value ?? [])

// Nombre de cocktails proposables (non soumis OU soumis + modifiés)
const submittableCount = computed(() =>
  barCocktails.value.filter(c =>
    !isSubmitted(c.id) || modifiedStates.value[c.id] === true
  ).length
)

// ── Lifecycle ──────────────────────────────────────────
onMounted(async () => {
  await doFetch()
})

// Quand on bascule sur "Mes recettes", vérifier l'état de modification
// de tous les cocktails en arrière-plan (sans bloquer le rendu).
watch(activeTab, (tab) => {
  if (tab !== 'mine') return
  for (const cocktail of barCocktails.value) {
    if (modifiedStates.value[cocktail.id] !== undefined) continue
    isModified(cocktail).then(result => {
      modifiedStates.value = { ...modifiedStates.value, [cocktail.id]: result }
    })
  }
})

// ── Methods ───────────────────────────────────────────
async function doFetch() {
  await fetchCatalog({
    search: filters.value.search,
    spirit: filters.value.spirit,
    season: filters.value.season,
  })
}

function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 300)
}

function togglePreview(id) {
  previewId.value = previewId.value === id ? null : id
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

async function handleSubmit(cocktail) {
  submitting.value = cocktail.id
  try {
    const result = await submitToCatalog(cocktail)
    if (result.success || result.error === 'unchanged') {
      modifiedStates.value = { ...modifiedStates.value, [cocktail.id]: false }
    }
  } finally {
    submitting.value = null
  }
}

// ── Spirit categories ──────────────────────────────────
const spiritCategories = [
  { key: 'Whiskey_Family', label: '🥃 Whiskey', spirits: [
    { key: 'bourbon', label: 'Bourbon' }, { key: 'rye', label: 'Rye' },
    { key: 'scotch', label: 'Scotch' }, { key: 'irish_whiskey', label: 'Irish Whiskey' },
    { key: 'peated_whisky', label: 'Islay / Peated' }, { key: 'whiskey', label: 'Whiskey (autre)' },
  ]},
  { key: 'Rum_Family', label: '🍹 Rhum', spirits: [
    { key: 'rum', label: 'Rum blanc' }, { key: 'rum_agricol', label: 'Rhum Agricole' },
    { key: 'rum_jamaican', label: 'Rhum Jamaïcain' }, { key: 'rum_cuban', label: 'Rhum Cubain' },
    { key: 'rum_overproof', label: 'Overproof' }, { key: 'cachaca', label: 'Cachaça' },
  ]},
  { key: 'Agave_Family', label: '🌵 Agave', spirits: [
    { key: 'tequila', label: 'Tequila Blanco' }, { key: 'tequila_reposado', label: 'Tequila Reposado' },
    { key: 'mezcal', label: 'Mezcal' },
  ]},
  { key: 'Gin', label: '🌿 Gin', spirits: [
    { key: 'gin', label: 'Gin' }, { key: 'gin_dry', label: 'Dry Gin' },
    { key: 'gin_navy', label: 'Navy Strength' }, { key: 'genever', label: 'Genièvre' },
  ]},
  { key: 'Vodka', label: '❄️ Vodka', spirits: [{ key: 'vodka', label: 'Vodka' }] },
  { key: 'Brandy_Family', label: '🍇 Brandy', spirits: [
    { key: 'cognac', label: 'Cognac' }, { key: 'brandy', label: 'Brandy' },
    { key: 'calvados', label: 'Calvados' }, { key: 'pisco', label: 'Pisco' },
  ]},
]
</script>