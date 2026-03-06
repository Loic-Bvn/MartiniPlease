<template>
  <div class="min-h-screen menu-app">

    <!-- Header -->
    <div class="header">
      <div class="header-container">
        <div class="header-top">
          <!-- Brand -->
          <div class="header-brand">
            <img src="/logo.png" alt="Martini Please" class="header-logo" />
            <h1 class="header-title">Martini Please</h1>
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

          <!-- Boutons header -->
          <div class="flex gap-2 items-center">
            <!-- Mode toggle -->
            <button @click="isBartenderMode ? exitBartenderMode() : showPasswordModal = true" :class="['btn-mode', isBartenderMode ? 'btn-mode-active' : 'btn-mode-inactive']">
              <component :is="isBartenderMode ? 'Unlock' : 'Lock'" :size="15" />
              {{ isBartenderMode ? 'Mode Drinker' : 'Mode Bartender' }}
            </button>
            <template v-if="isBartenderMode">
              <button @click="openNewCardModal()" class="btn-new-card">
                <BookOpen :size="15" /> Nouvelle carte
              </button>
              <button @click="openNewModal" class="btn-new-cocktail">
                <Plus :size="15" /> Nouveau cocktail
              </button>
            </template>
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
                v-for="spirit in allSpirits"
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
            <div
              v-for="card in menuCards"
              :key="card.id"
              class="menu-card-item"
            >
              <div class="menu-card-info">
                <span class="menu-card-name">{{ card.name }}</span>
                <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
              </div>
              <div class="menu-card-actions">
                <button @click="viewingCard = card" class="btn-icon text-gray-400 hover:text-amber-500" title="Visualiser">
                  <Eye :size="16" />
                </button>
                <template v-if="isBartenderMode">
                  <button @click="openEditCardModal(card)" class="btn-icon text-gray-400 hover:text-blue-500" title="Modifier">
                    <Pencil :size="16" />
                  </button>
                  <button @click="handleDeleteCard(card.id)" class="btn-icon text-gray-400 hover:text-red-500" title="Supprimer">
                    <Trash2 :size="16" />
                  </button>
                </template>
              </div>
            </div>
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
            :isBartenderMode="isBartenderMode"
            @edit="openEditModal"
            @delete="handleDelete"
          />
        </div>
      </div>

    </div>

    <!-- Modal mot de passe bartender -->
    <PasswordModal
      v-if="showPasswordModal"
      :onClose="() => showPasswordModal = false"
      :onSuccess="enterBartenderMode"
    />

    <!-- Vue full screen d'une carte -->
    <MenuCardView
      v-if="viewingCard"
      :card="viewingCard"
      :cocktails="cocktails"
      @close="viewingCard = null"
    />

    <!-- Modal cartes custom -->
    <MenuCardModal
      v-if="showCardModal"
      :card="editingCard"
      :cocktails="cocktails"
      @save="handleSaveCard"
      @close="showCardModal = false"
    />

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

const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients } = useInventory()
const { menuCards, fetchMenuCards, createMenuCard, updateMenuCard, deleteMenuCard } = useMenuCards()

// Mode bartender
const isBartenderMode   = ref(false)
const showPasswordModal = ref(false)

function enterBartenderMode() {
  isBartenderMode.value = true
}
function exitBartenderMode() {
  isBartenderMode.value = false
}

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
const searchTerm       = ref('')
const selectedSpirits  = ref([])
const selectedSeasons  = ref([])
const showOnlyMakeable = ref(false)

// Référentiels filtres
const spiritCategories = [
  { key: 'Whiskey_Family', label: '🥃 Whiskey',  members: ['Whiskey_Family', 'whiskey', 'bourbon', 'scotch', 'rye'],
    spirits: [
      { key: 'bourbon', label: '🥃 Bourbon' },
      { key: 'rye',     label: '🌾 Rye' },
      { key: 'scotch',  label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotch' },
      { key: 'whiskey', label: '🥃 Whiskey' },
    ]},
  { key: 'Rum_Family',    label: '🍹 Rhum',      members: ['Rum_Family', 'rum', 'cachaca'],
    spirits: [
      { key: 'rum',     label: '🍹 Rum' },
      { key: 'cachaca', label: '🇧🇷 Cachaça' },
    ]},
  { key: 'Agave_Family',  label: '🌵 Agave',     members: ['Agave_Family', 'tequila', 'mezcal'],
    spirits: [
      { key: 'tequila', label: '🌵 Tequila' },
      { key: 'mezcal',  label: '🔥 Mezcal' },
    ]},
  { key: 'Gin',           label: '🌿 Gin',       members: ['Gin', 'gin'] },
  { key: 'Vodka',         label: '❄️ Vodka',     members: ['Vodka', 'vodka'] },
  { key: 'Brandy_Family', label: '🍇 Brandy',    members: ['Brandy_Family', 'brandy', 'cognac', 'calvados'],
    spirits: [
      { key: 'cognac',   label: '🇫🇷 Cognac' },
      { key: 'calvados', label: '🍎 Calvados' },
      { key: 'brandy',   label: '🍇 Brandy' },
    ]},
  { key: 'Pisco',         label: '🫙 Pisco',     members: ['Pisco', 'pisco'] },
  { key: 'Absinthe',      label: '🌱 Absinthe',  members: ['Absinthe', 'absinthe'] },
  { key: 'Other',         label: '✨ Autre',      members: ['Other'] },
]

// Lookup plat : key → membres qu'il couvre
const spiritMembersMap = Object.fromEntries(
  spiritCategories.flatMap(f => [
    [f.key, f.members],
    ...(f.spirits || []).map(s => [s.key, [s.key]]),
  ])
)

// Liste plate de tous les spirits individuels pour les chips de filtre
const allSpirits = spiritCategories.flatMap(f =>
  f.spirits?.length
    ? f.spirits
    : [{ key: f.key, label: f.label }]
)

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
    const allMembers = [...new Set(
      selectedSpirits.value.flatMap(key => spiritMembersMap[key] || [key])
    )]
    list = list.filter(c => allMembers.includes(c.category))
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
  for (const f of spiritCategories) {
    if (f.key === key) return f.label
    const s = f.spirits?.find(s => s.key === key)
    if (s) return s.label
  }
  return key
}

function getSeasonLabel(key) {
  const s = seasons.find(s => s.key === key)
  return s ? `${s.icon} ${s.label}` : key
}

// CRUD menu cards
function openNewCardModal() {
  editingCard.value = null
  showCardModal.value = true
}

function openEditCardModal(card) {
  editingCard.value = card
  showCardModal.value = true
}

async function handleSaveCard(data) {
  if (data.id) {
    await updateMenuCard(data.id, data)
  } else {
    await createMenuCard(data)
  }
  showCardModal.value = false
}

async function handleDeleteCard(id) {
  if (!confirm('Supprimer cette carte ?')) return
  await deleteMenuCard(id)
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
  await Promise.all([fetchCocktails(), fetchIngredients(), fetchMenuCards()])
})
</script>

<style scoped>
.spirit-families {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.spirit-family-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.chip-family {
  font-weight: 700;
}

.chip-member {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  opacity: 0.85;
  border-style: dashed;
}

.chip-member.active {
  opacity: 1;
  border-style: solid;
}

.spirit-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding-left: 0.25rem;
  border-left: 2px solid #e5e7eb;
  margin-left: 0.25rem;
}

.btn-mode {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-mode-inactive {
  background: #f3f4f6;
  color: #6b7280;
}
.btn-mode-inactive:hover {
  background: #e5e7eb;
  color: #374151;
}
.btn-mode-active {
  background: #7c3aed;
  color: white;
}
.btn-mode-active:hover {
  background: #6d28d9;
}

.btn-new-card {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #374151;
  border: 1.5px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-new-card:hover {
  border-color: #f59e0b;
  color: #f59e0b;
}

.cards-content {
  padding: 1rem;
}

.cards-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 1.5rem 0;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  background: #fafafa;
  border: 1px solid #f3f4f6;
  border-radius: 0.6rem;
  transition: border-color 0.15s;
}

.menu-card-item:hover {
  border-color: #fde68a;
  background: #fffbeb;
}

.menu-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.menu-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.menu-card-count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.menu-card-actions {
  display: flex;
  gap: 0.25rem;
}

.count-badge {
  margin-left: 0.5rem;
  padding: 0.1rem 0.6rem;
  background: #3b82f6;
  color: white;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.header-logo {
  height: 48px;
  width: auto;
  object-fit: contain;
  /* L'image est noire sur fond transparent — on l'inverse si le header est blanc */
  filter: invert(0);
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