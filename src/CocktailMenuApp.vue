<template>
  <div class="min-h-screen menu-app">

    <!-- Header -->
    <div class="header">
      <div class="header-container">
        <div class="header-top">
          <div class="header-brand">
            <img src="/logo_square.png" alt="Martini Please" class="header-logo" />
            <h1 class="header-title">Martini Please</h1>
          </div>
          <div class="search-container header-search-inline">
            <Search class="search-icon" :size="16" />
            <input type="text" placeholder="Rechercher un cocktail ou un ingrédient..." v-model="searchTerm" class="search-input" />
          </div>
          <div class="header-right">
            <div class="header-actions">
              <button @click="isBartenderMode ? exitBartenderMode() : showPasswordModal = true" :class="['btn-mode', isBartenderMode ? 'btn-mode-active' : 'btn-mode-inactive']">
                <Unlock v-if="isBartenderMode" :size="15" style="display:inline-block;width:15px;height:15px;flex-shrink:0" />
                <Lock v-else :size="15" style="display:inline-block;width:15px;height:15px;flex-shrink:0" />
                <span class="btn-mode-label">{{ isBartenderMode ? 'Mode Drinker' : 'Mode Bartender' }}</span>
              </button>
              <template v-if="isBartenderMode">
                <button @click="openNewCardModal()" class="btn-new-card">
                  <BookOpen :size="15" /><span class="btn-label-hide"> Nouvelle carte</span>
                </button>
                <button @click="openNewModal" class="btn-new-cocktail">
                  <Plus :size="15" /><span class="btn-label-hide"> Nouveau cocktail</span>
                </button>
              </template>
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div class="header-search-row">
          <div class="search-container">
            <Search class="search-icon" :size="16" />
            <input type="text" placeholder="Rechercher..." v-model="searchTerm" class="search-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main -->
    <div class="main-content">

      <!-- Inventaire -->
      <div v-if="isBartenderMode" class="section-card">
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

      <!-- Filtres + Cartes côte à côte -->
      <div class="side-by-side">

        <!-- Filtres -->
        <div class="section-card">
          <button @click="showFilters = !showFilters" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showFilters }" />
            <h2 class="section-title">🔍 Filtres</h2>
            <span></span>
          </button>

          <div v-if="showFilters" class="filters-dropdown-content">

            <!-- Mode de filtrage -->
            <div class="filter-group">
              <label class="filter-label">Mode de recherche</label>
              <div class="filter-mode-toggle">
                <button @click="filterMode = 'main'" :class="['filter-mode-btn', { active: filterMode === 'main' }]">
                  🎯 Ingrédient principal
                </button>
                <button @click="filterMode = 'contains'" :class="['filter-mode-btn', { active: filterMode === 'contains' }]">
                  🔍 Contient
                </button>
              </div>
            </div>

            <!-- Spiritueux de base -->
            <div class="filter-group">
              <label class="filter-label">Spiritueux de base</label>
              <div class="chips-container">
                <button
                  v-for="spirit in baseSpirits"
                  :key="spirit.key"
                  @click="toggleFamily(spirit.key)"
                  :class="['chip', { active: selectedFamilies.includes(spirit.key) }]"
                >
                  {{ spirit.label }}
                </button>
              </div>

              <!-- Sous-types : apparaissent si exactement une famille avec sous-types est active -->
              <transition name="fade">
                <div v-if="activeSubSpirits.length" class="chips-container chips-container--sub">
                  <button
                    v-for="sub in activeSubSpirits"
                    :key="sub.key"
                    @click="toggleFilter(selectedSubSpirits, sub.key)"
                    :class="['chip chip--sub', { active: selectedSubSpirits.includes(sub.key) }]"
                  >
                    {{ sub.label }}
                  </button>
                </div>
              </transition>
            </div>

            <!-- Liqueurs -->
            <div class="filter-group">
              <label class="filter-label">Liqueurs</label>
              <div class="chips-container">
                <button
                  v-for="liqueur in liqueurFamilies"
                  :key="liqueur.key"
                  @click="toggleFilter(selectedFamilies, liqueur.key)"
                  :class="['chip', { active: selectedFamilies.includes(liqueur.key) }]"
                >
                  {{ liqueur.label }}
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

            <!-- ABV -->
            <div class="filter-group">
              <label class="filter-label">Alcool</label>
              <div class="chips-container">
                <button
                  @click="abvFilter = abvFilter === 'mocktail' ? null : 'mocktail'"
                  :class="['chip', { active: abvFilter === 'mocktail' }]"
                >
                  🧃 Mocktail
                </button>
                <button
                  @click="abvFilter = abvFilter === 'low' ? null : 'low'"
                  :class="['chip', { active: abvFilter === 'low' }]"
                >
                  🍃 Low ABV <span class="chip-hint">&lt; 15°</span>
                </button>
              </div>
            </div>

            <!-- Tags actifs -->
            <div v-if="hasActiveFilters" class="active-filters-bar">
              <span v-for="f in selectedFamilies" :key="f" class="filter-tag">
                {{ getFamilyLabel(f) }}
                <X @click="toggleFamily(f)" :size="14" />
              </span>
              <span v-for="s in selectedSubSpirits" :key="s" class="filter-tag filter-tag--sub">
                {{ getSubSpiritLabel(s) }}
                <X @click="toggleFilter(selectedSubSpirits, s)" :size="14" />
              </span>
              <span v-for="s in selectedSeasons" :key="s" class="filter-tag">
                {{ getSeasonLabel(s) }}
                <X @click="toggleFilter(selectedSeasons, s)" :size="14" />
              </span>
              <span v-if="abvFilter === 'mocktail'" class="filter-tag">
                🧃 Mocktail <X @click="abvFilter = null" :size="14" />
              </span>
              <span v-if="abvFilter === 'low'" class="filter-tag">
                🍃 Low ABV <X @click="abvFilter = null" :size="14" />
              </span>
              <button @click="clearFilters" class="clear-all-btn">Effacer tout</button>
            </div>
          </div>
        </div>

        <!-- Cartes custom -->
        <div class="section-card">
          <button @click="showCards = !showCards" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showCards }" />
            <h2 class="section-title">
              📜 Cartes
              <span class="count-badge">{{ menuCards.length }}</span>
            </h2>
            <span></span>
          </button>
          <div v-if="showCards" class="cards-content">
            <div v-if="menuCards.length === 0" class="cards-empty">
              Aucune carte créée — crée ta première carte !
            </div>
            <div v-else class="cards-grid">
              <div v-for="card in menuCards" :key="card.id" class="menu-card-item">
                <div class="menu-card-info">
                  <span class="menu-card-name">{{ card.name }}</span>
                  <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
                </div>
                <div class="menu-card-actions">
                  <button @click="viewingCard = card" class="btn-icon btn-icon--view" title="Visualiser">
                    <Eye :size="16" />
                  </button>
                  <template v-if="isBartenderMode">
                    <button @click="openEditCardModal(card)" class="btn-icon btn-icon--edit" title="Modifier">
                      <Pencil :size="16" />
                    </button>
                    <button @click="handleDeleteCard(card.id)" class="btn-icon btn-icon--delete" title="Supprimer">
                      <Trash2 :size="16" />
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div><!-- fin side-by-side -->

      <!-- Liste cocktails -->
      <div>
        <h2 class="cocktails-header">
          {{ filteredCocktails.length }} cocktail{{ filteredCocktails.length > 1 ? 's' : '' }} trouvé{{ filteredCocktails.length > 1 ? 's' : '' }}
          <span v-if="showOnlyMakeable" class="cocktails-header-makeable">
            ({{ makeableCount }} réalisables)
          </span>
        </h2>
        <div v-if="cocktailsLoading" class="loading-state">Chargement des cocktails...</div>
        <div v-else-if="filteredCocktails.length === 0" class="empty-state">Aucun cocktail trouvé avec ces critères</div>
        <div v-else class="cocktails-grid">
          <CocktailCard
            v-for="cocktail in filteredCocktails"
            :key="cocktail.id"
            :cocktail="cocktail"
            :isBartenderMode="isBartenderMode"
            @edit="openEditModal"
            @delete="handleDelete"
          />
        </div>
      </div>

    </div>

    <PasswordModal v-if="showPasswordModal" @close="showPasswordModal = false" @success="enterBartenderMode" />
    <MenuCardView v-if="viewingCard" :card="viewingCard" :cocktails="cocktails" @close="viewingCard = null" />
    <MenuCardModal v-if="showCardModal" :card="editingCard" :cocktails="cocktails" @save="handleSaveCard" @close="showCardModal = false" />
    <CocktailModal v-if="showCocktailModal" :cocktail="editingCocktail" @save="handleSave" @close="showCocktailModal = false" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, ChevronDown, X, Plus, BookOpen, Pencil, Trash2, Eye, Lock, Unlock } from 'lucide-vue-next'

import { useCocktails } from '@/composables/useCocktails'
import { useInventory } from '@/composables/useInventory'
import { useMenuCards } from '@/composables/useMenuCards'

import CocktailCard from '@/Components/CocktailCard.vue'
import InventoryManager from '@/Components/Modals/InventoryManager.vue'
import CocktailModal from '@/Components/Modals/CocktailModal.vue'
import MenuCardModal from '@/Components/Modals/MenuCardModal.vue'
import MenuCardView from '@/Components/MenuCardView.vue'
import PasswordModal from '@/Components/Modals/PasswordModal.vue'
import ThemeToggle from '@/Components/ThemeToggle.vue'

const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients } = useInventory()
const { menuCards, fetchMenuCards, createMenuCard, updateMenuCard, deleteMenuCard } = useMenuCards()

// Mode bartender
const isBartenderMode   = ref(false)
const showPasswordModal = ref(false)
function enterBartenderMode() { isBartenderMode.value = true }
function exitBartenderMode()  { isBartenderMode.value = false }

// UI
const showInventory     = ref(false)
const showFilters       = ref(false)
const showCards         = ref(false)
const showCocktailModal = ref(false)
const showCardModal     = ref(false)
const editingCocktail   = ref(null)
const editingCard       = ref(null)
const viewingCard       = ref(null)

// Filtres
const searchTerm         = ref('')
const selectedFamilies   = ref([])  // filtre sur `category` (ex: "Whiskey")
const selectedSubSpirits = ref([])  // filtre sur `base_spirit` (ex: "bourbon")
const selectedSeasons    = ref([])
const showOnlyMakeable   = ref(false)
const filterMode         = ref('main') // 'main' = ingrédient principal | 'contains' = dans la recette
const abvFilter          = ref(null)   // null | 'mocktail' | 'low'

// ── Référentiels ──────────────────────────────────────────────────────────────

// baseSpirits : familles de spiritueux → correspondent au champ `category` en base
// subSpirits  : sous-types → correspondent au champ `base_spirit` en base
const baseSpirits = [
  {
    key: 'Whiskey', label: '🥃 Whiskey',
    subs: [
      { key: 'bourbon',       label: '🌽 Bourbon'      },
      { key: 'rye',           label: '🌾 Rye'          },
      { key: 'scotch',        label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotch'       },
      { key: 'irish_whiskey', label: '☘️ Irish'        },
      { key: 'peated_whisky', label: '🔥 Peated/Islay' },
      { key: 'whiskey',       label: '🥃 Autre Whiskey'},
    ]
  },
  {
    key: 'Rum', label: '🍹 Rum',
    subs: [
      { key: 'rum',          label: '🍹 Rum blanc'   },
      { key: 'rum_agricol',  label: '🌿 Rhum Agricole'},
      { key: 'rum_jamaican', label: '🇯🇲 Jamaïcain'  },
      { key: 'rum_cuban',    label: '🇨🇺 Cubain'     },
      { key: 'rum_overproof',label: '💥 Overproof'   },
      { key: 'cachaca',      label: '🇧🇷 Cachaça'    },
    ]
  },
  {
    key: 'Agave', label: '🌵 Agave',
    subs: [
      { key: 'tequila',          label: '🌵 Tequila Blanco'  },
      { key: 'tequila_reposado', label: '🪵 Tequila Reposado'},
      { key: 'mezcal',           label: '🔥 Mezcal'          },
    ]
  },
  {
    key: 'Gin', label: '🌿 Gin',
    subs: [
      { key: 'gin',      label: '🌿 Gin'         },
      { key: 'gin_dry',  label: '🍋 Dry Gin'     },
      { key: 'gin_navy', label: '⚓ Navy Strength'},
      { key: 'genever',  label: '🇳🇱 Genièvre'  },
    ]
  },
  {
    key: 'Brandy', label: '🍇 Brandy',
    subs: [
      { key: 'cognac',   label: '🇫🇷 Cognac'  },
      { key: 'calvados', label: '🍎 Calvados' },
      { key: 'pisco',    label: '🇵🇪 Pisco'   },
      { key: 'grappa',   label: '🍇 Grappa'   },
      { key: 'brandy',   label: '🍇 Brandy'   },
    ]
  },
  { key: 'Vodka',    label: '❄️ Vodka',    subs: [] },
  { key: 'Absinthe', label: '🌱 Absinthe', subs: [] },
  { key: 'Aquavit',  label: '🌾 Aquavit',  subs: [] },
]

const liqueurFamilies = [
  { key: 'Liqueur Amer',     label: '🍊 Amer'     },
  { key: 'Liqueur Agrume',   label: '🍋 Agrume'   },
  { key: 'Liqueur Fruits',   label: '🍒 Fruits'   },
  { key: 'Liqueur Herbes',   label: '🌿 Herbes'   },
  { key: 'Liqueur Noix',     label: '🌰 Noix'     },
  { key: 'Liqueur Dessert',  label: '☕ Dessert'   },
  { key: 'Liqueur Anisée',   label: '⭐ Anisée'  },
]

// Lookup label global
const allFamilyLabels = Object.fromEntries([
  ...baseSpirits.map(s => [s.key, s.label]),
  ...liqueurFamilies.map(l => [l.key, l.label]),
])
const allSubLabels = Object.fromEntries(
  baseSpirits.flatMap(s => s.subs.map(sub => [sub.key, sub.label]))
)

const seasons = [
  { key: 'all',    icon: '🍸', label: 'Toutes'    },
  { key: 'spring', icon: '🌸', label: 'Printemps' },
  { key: 'summer', icon: '☀️', label: 'Été'       },
  { key: 'fall',   icon: '🍂', label: 'Automne'   },
  { key: 'winter', icon: '❄️', label: 'Hiver'     },
]

// ── Sous-types actifs ─────────────────────────────────────────────────────────
// Affiche les sous-types des familles de spiritueux actuellement sélectionnées
const activeSubSpirits = computed(() => {
  const subs = []
  for (const family of baseSpirits) {
    if (selectedFamilies.value.includes(family.key) && family.subs.length) {
      subs.push(...family.subs)
    }
  }
  return subs
})

// ── Helpers filtres ───────────────────────────────────────────────────────────

function toggleFilter(array, value) {
  const idx = array.indexOf(value)
  if (idx > -1) array.splice(idx, 1)
  else array.push(value)
}

// Quand on déselectionne une famille, on purge ses sous-types actifs
function toggleFamily(familyKey) {
  const isActive = selectedFamilies.value.includes(familyKey)
  toggleFilter(selectedFamilies.value, familyKey)
  if (isActive) {
    const family = baseSpirits.find(s => s.key === familyKey)
    if (family?.subs.length) {
      const subKeys = family.subs.map(s => s.key)
      selectedSubSpirits.value = selectedSubSpirits.value.filter(k => !subKeys.includes(k))
    }
  }
}

function clearFilters() {
  selectedFamilies.value   = []
  selectedSubSpirits.value = []
  selectedSeasons.value    = []
  abvFilter.value          = null
}

function getFamilyLabel(key)    { return allFamilyLabels[key] ?? key }
function getSubSpiritLabel(key) { return allSubLabels[key] ?? key }
function getSeasonLabel(key) {
  const s = seasons.find(s => s.key === key)
  return s ? `${s.icon} ${s.label}` : key
}

// ── Stats inventaire ──────────────────────────────────────────────────────────
const selectedCount = computed(() => barInventory.value.size)
const totalCount    = computed(() => ingredients.value.length)

function isMakeable(cocktail) {
  const recipe = cocktail.recipe || []
  if (!recipe.length) return false
  return recipe.every(ing => ing.Type === 'garnish' || barInventory.value.has(ing.Type))
}
const makeableCount = computed(() => cocktails.value.filter(isMakeable).length)

// ── Filtrage ──────────────────────────────────────────────────────────────────
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

  // Famille + sous-type
  if (selectedFamilies.value.length || selectedSubSpirits.value.length) {
    // Les sous-types à matcher (si sélectionnés, ils affinent ; sinon on utilise la famille)
    const activeSubs  = selectedSubSpirits.value
    const activeFamilies = selectedFamilies.value

    // Map type → family pour le mode "contains"
    // On s'appuie sur baseSpirits : chaque sub.key appartient à une family.key
    const typeToFamily = {}
    for (const family of baseSpirits) {
      for (const sub of family.subs) {
        typeToFamily[sub.key] = family.key
      }
      typeToFamily[family.key.toLowerCase()] = family.key // fallback générique
    }

    list = list.filter(c => {
      if (filterMode.value === 'main') {
        // Mode "ingrédient principal" : regarde category et base_spirit
        const familyMatch = activeFamilies.length === 0 || activeFamilies.includes(c.category)
        const subMatch    = activeSubs.length === 0     || activeSubs.includes(c.base_spirit)
        return familyMatch && subMatch
      } else {
        // Mode "contient" : cherche dans recipe[].Type
        const recipeTypes = (c.recipe || []).map(ing => ing.Type)

        // Si des sous-types sont sélectionnés → match sur les types exacts
        if (activeSubs.length) {
          return activeSubs.some(sub => recipeTypes.includes(sub))
        }
        // Sinon → match sur la famille : un des types de la recette appartient à une famille sélectionnée
        return activeFamilies.some(family => {
          const familyDef = baseSpirits.find(s => s.key === family)
          if (familyDef) {
            // Famille avec sous-types connus → on vérifie si un type de la recette est dans les subs
            const subKeys = familyDef.subs.map(s => s.key)
            // Inclure aussi le type générique (ex: "whiskey", "rum", "gin"...)
            const genericKey = family.toLowerCase()
            return recipeTypes.some(t => subKeys.includes(t) || t === genericKey)
          }
          // Famille sans sous-types (Vodka, Absinthe…) → match direct sur le type
          return recipeTypes.includes(family.toLowerCase())
        })
      }
    })
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

  // ABV
  if (abvFilter.value === 'mocktail') {
    list = list.filter(c => c.abv === 0 || c.abv === null)
  } else if (abvFilter.value === 'low') {
    list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)
  }

  return list
})

const hasActiveFilters = computed(() =>
  selectedFamilies.value.length > 0 ||
  selectedSubSpirits.value.length > 0 ||
  selectedSeasons.value.length > 0 ||
  abvFilter.value !== null
)

// ── CRUD menu cards ───────────────────────────────────────────────────────────
function openNewCardModal()      { editingCard.value = null; showCardModal.value = true }
function openEditCardModal(card) { editingCard.value = card; showCardModal.value = true }

async function handleSaveCard(data) {
  if (data.id) await updateMenuCard(data.id, data)
  else         await createMenuCard(data)
  showCardModal.value = false
}
async function handleDeleteCard(id) {
  if (!confirm('Supprimer cette carte ?')) return
  await deleteMenuCard(id)
}

// ── CRUD cocktails ────────────────────────────────────────────────────────────
function openEditModal(cocktail) { editingCocktail.value = cocktail; showCocktailModal.value = true }
function openNewModal()          { editingCocktail.value = null;      showCocktailModal.value = true }

async function handleSave(data) {
  if (data.id) await updateCocktail(data.id, data)
  else         await createCocktail(data)
  showCocktailModal.value = false
}
async function handleDelete(id) {
  if (!confirm('Supprimer ce cocktail ?')) return
  await deleteCocktail(id)
}

onMounted(async () => {
  await Promise.all([fetchCocktails(), fetchIngredients(), fetchMenuCards()])
})
</script>