<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--catalogue">

      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">📚 Catalogue de recettes</h2>
        <button @click="$emit('close')" class="modal-close-btn">
          <X :size="20" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="catalogue-tabs">
        <button :class="['catalogue-tab', { active: activeTab === 'browse' }]" @click="activeTab = 'browse'">
          🌐 Catalogue global
        </button>
        <button :class="['catalogue-tab', { active: activeTab === 'mine' }]" @click="activeTab = 'mine'">
          🍾 Mes recettes
          <span v-if="submittableCount > 0" class="catalogue-tab-badge">{{ submittableCount }}</span>
        </button>
      </div>

      <!-- ── Tab : Catalogue global ── -->
      <div v-if="activeTab === 'browse'" class="modal-body">
        <div class="catalogue-filters">
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
          <select v-model="filters.spirit" @change="doFetch" class="form-input catalogue-filter-select">
            <option value="">Tous les spirits</option>
            <optgroup v-for="cat in spiritCategories" :key="cat.key" :label="cat.label">
              <option v-for="s in cat.spirits" :key="s.key" :value="s.key">{{ s.label }}</option>
            </optgroup>
          </select>
          <select v-model="filters.season" @change="doFetch" class="form-input catalogue-filter-select">
            <option value="">Toutes saisons</option>
            <option value="spring">🌸 Printemps</option>
            <option value="summer">☀️ Été</option>
            <option value="fall">🍂 Automne</option>
            <option value="winter">❄️ Hiver</option>
          </select>
        </div>

        <div v-if="loading" class="loading-state">Chargement du catalogue...</div>

        <div v-else-if="catalogue.length === 0" class="catalogue-empty">
          <span style="font-size:2rem">🍸</span>
          <p>Aucune recette trouvée</p>
        </div>

        <div v-else class="catalogue-list">
          <div v-for="cocktail in catalogue" :key="cocktail.id" class="catalogue-item">
            <div class="catalogue-item-info">
              <div class="catalogue-item-name">{{ cocktail.name }}</div>
              <div class="catalogue-item-meta">
                <span v-if="cocktail.base_spirit" class="catalogue-chip">{{ cocktail.base_spirit }}</span>
                <span v-if="cocktail.category" class="catalogue-chip">{{ cocktail.category }}</span>
                <span v-if="cocktail.difficulty" class="catalogue-chip">
                  {{ { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' }[cocktail.difficulty] }}
                </span>
                <span v-if="cocktail.abv" class="catalogue-chip">{{ cocktail.abv }}%</span>
              </div>
              <div v-if="cocktail.description" class="catalogue-item-desc">{{ cocktail.description }}</div>
            </div>

            <div class="catalogue-item-actions">
              <span v-if="isImported(cocktail.id)" class="catalogue-badge catalogue-badge--done">✓ Importé</span>
              <button
                v-else
                @click="handleImport(cocktail)"
                :disabled="importing === cocktail.id"
                class="btn-modal-primary catalogue-btn-import"
              >
                {{ importing === cocktail.id ? '⏳' : '⬇ Importer' }}
              </button>
              <button
                @click="togglePreview(cocktail.id)"
                class="btn-modal-secondary catalogue-btn-preview"
                title="Voir la recette"
              >
                <ChevronDown v-if="previewId !== cocktail.id" :size="14" />
                <ChevronUp v-else :size="14" />
              </button>
            </div>

            <div v-if="previewId === cocktail.id" class="catalogue-preview">
              <div v-if="cocktail.recipe?.length" class="catalogue-recipe">
                <div v-for="(line, i) in cocktail.recipe" :key="i" class="catalogue-recipe-line">
                  <span class="catalogue-recipe-ingredient">{{ line.Ingredient }}</span>
                  <span class="catalogue-recipe-qty">
                    {{ line.Oz ? `${line.Oz} oz` : line.Ml ? `${line.Ml} ml` : line.Dashes ? `${line.Dashes} dashes` : '' }}
                  </span>
                </div>
              </div>
              <div v-if="cocktail.creator" class="catalogue-creator">Source : {{ cocktail.creator }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab : Mes recettes ── -->
      <div v-if="activeTab === 'mine'" class="modal-body">
        <p class="catalogue-mine-hint">
          Partagez vos créations avec tous les bartenders MartiniPlease.
          Seules les recettes <strong>modifiées depuis leur dernier import</strong> peuvent être proposées.
        </p>

        <div v-if="barCocktails.length === 0" class="catalogue-empty">
          <span style="font-size:2rem">🍾</span>
          <p>Aucun cocktail dans votre bar</p>
        </div>

        <div v-else class="catalogue-list">
          <div v-for="cocktail in barCocktails" :key="cocktail.id" class="catalogue-item">
            <div class="catalogue-item-info">
              <div class="catalogue-item-name">{{ cocktail.name }}</div>
              <div class="catalogue-item-meta">
                <span v-if="cocktail.base_spirit" class="catalogue-chip">{{ cocktail.base_spirit }}</span>
                <span v-if="cocktail.difficulty" class="catalogue-chip">
                  {{ { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' }[cocktail.difficulty] }}
                </span>
              </div>
            </div>

            <div class="catalogue-item-actions">
              <!-- Déjà soumis ET non modifié → grisé avec tooltip -->
              <span
                v-if="isSubmitted(cocktail.id) && modifiedStates[cocktail.id] === false"
                class="catalogue-badge catalogue-badge--unchanged"
                title="Identique à la version déjà proposée"
              >
                = Inchangé
              </span>

              <!-- Déjà soumis mais modifié depuis → peut re-proposer (fork) -->
              <button
                v-else-if="isSubmitted(cocktail.id) && modifiedStates[cocktail.id] === true"
                @click="handleSubmit(cocktail)"
                :disabled="submitting === cocktail.id"
                class="btn-modal-primary catalogue-btn-import catalogue-btn--fork"
              >
                {{ submitting === cocktail.id ? '⏳' : '🔀 Proposer (fork)' }}
              </button>

              <!-- Jamais soumis -->
              <button
                v-else-if="!isSubmitted(cocktail.id)"
                @click="handleSubmit(cocktail)"
                :disabled="submitting === cocktail.id || modifiedStates[cocktail.id] === false"
                class="btn-modal-primary catalogue-btn-import"
              >
                {{ submitting === cocktail.id ? '⏳' : '🌐 Proposer' }}
              </button>

              <!-- État en cours de vérification -->
              <span v-else class="catalogue-badge catalogue-badge--checking">…</span>
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
import { useCatalogue } from '@/composables/useCatalogue'
import { useCocktails } from '@/composables/useCocktails'

const emit = defineEmits(['close', 'imported'])

const {
  catalogue, loading,
  fetchCatalogue, fetchImported, fetchSubmitted,
  importCocktail, submitToCatalogue,
  isImported, isSubmitted, isModified,
} = useCatalogue()

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

// Nombre de cocktails proposables (non soumis OU soumis+modifiés)
const submittableCount = computed(() =>
  barCocktails.value.filter(c =>
    !isSubmitted(c.id) || modifiedStates.value[c.id] === true
  ).length
)

// ── Lifecycle ──────────────────────────────────────────
onMounted(async () => {
  await Promise.all([doFetch(), fetchImported(), fetchSubmitted()])
})

// Quand on bascule sur l'onglet "Mes recettes", vérifier l'état de modification
// de tous les cocktails du bar (en parallèle, sans bloquer l'UI)
watch(activeTab, async (tab) => {
  if (tab !== 'mine') return
  for (const cocktail of barCocktails.value) {
    if (modifiedStates.value[cocktail.id] !== undefined) continue
    // Lance en async sans await pour ne pas bloquer le rendu
    isModified(cocktail).then(result => {
      modifiedStates.value = { ...modifiedStates.value, [cocktail.id]: result }
    })
  }
})

// ── Methods ───────────────────────────────────────────
async function doFetch() {
  await fetchCatalogue({ search: filters.value.search, spirit: filters.value.spirit, season: filters.value.season })
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
    const result = await submitToCatalogue(cocktail)
    if (result.success) {
      // Mettre à jour l'état local : la recette vient d'être soumise, hash = actuel
      modifiedStates.value = { ...modifiedStates.value, [cocktail.id]: false }
    } else if (result.error === 'unchanged') {
      // Ne devrait pas arriver (bouton déjà désactivé) mais sécurité
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

<style scoped>
.modal-container--catalogue {
  max-width: 720px;
  width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.catalogue-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 1rem;
  gap: 0.25rem;
  flex-shrink: 0;
}

.catalogue-tab {
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.catalogue-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

.catalogue-tab-badge {
  background: var(--primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0 0.35rem;
  border-radius: 999px;
  line-height: 1.4;
}

.catalogue-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.catalogue-filter-select { width: auto; min-width: 140px; flex-shrink: 0; }

.catalogue-list { display: flex; flex-direction: column; gap: 0.5rem; }

.catalogue-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  flex-wrap: wrap;
}

.catalogue-item-info { flex: 1; min-width: 0; }
.catalogue-item-name { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem; color: var(--text); }
.catalogue-item-meta { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.25rem; }
.catalogue-item-desc {
  font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-top: 0.25rem;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.catalogue-chip {
  font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 999px;
  background: var(--bg-alt, var(--surface-alt)); color: var(--text-muted); border: 1px solid var(--border);
}

.catalogue-item-actions { display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0; }
.catalogue-btn-import { font-size: 0.8rem; padding: 0.35rem 0.75rem; white-space: nowrap; }
.catalogue-btn-preview { padding: 0.35rem 0.5rem; font-size: 0.8rem; }
.catalogue-btn--fork { background: var(--primary-muted, #7c3aed22) !important; }

.catalogue-badge {
  font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 999px; font-weight: 600;
}
.catalogue-badge--done      { background: #d1fae5; color: #065f46; }
.catalogue-badge--submitted { background: #dbeafe; color: #1e40af; }
.catalogue-badge--unchanged { background: var(--bg-alt, #f3f4f6); color: var(--text-muted); cursor: default; }
.catalogue-badge--checking  { background: transparent; color: var(--text-muted); font-size: 0.9rem; }

.catalogue-preview {
  width: 100%; border-top: 1px solid var(--border); padding-top: 0.6rem; margin-top: 0.25rem;
}
.catalogue-recipe { display: flex; flex-direction: column; gap: 0.2rem; }
.catalogue-recipe-line { display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.15rem 0; }
.catalogue-recipe-ingredient { color: var(--text); }
.catalogue-recipe-qty { color: var(--text-muted); font-variant-numeric: tabular-nums; }
.catalogue-creator { margin-top: 0.4rem; font-size: 0.75rem; color: var(--text-muted); font-style: italic; }

.catalogue-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 2rem 0; color: var(--text-muted); font-size: 0.9rem;
}

.catalogue-mine-hint {
  font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;
  padding: 0.6rem 0.75rem; background: var(--surface-alt, var(--bg-alt));
  border-radius: 6px; border-left: 3px solid var(--primary);
}

.loading-state { text-align: center; color: var(--text-muted); padding: 2rem 0; }
</style>