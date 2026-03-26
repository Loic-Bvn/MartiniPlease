<template>
  <div class="min-h-screen menu-app">

    <!-- Header -->
    <div class="header">
      <div class="header-container">
        <div class="header-top">
          <div class="header-brand" @click="handleLogoClick" style="cursor: pointer;">
            <img src="/logo_square.png" alt="Martini Please" class="header-logo" />
            <h1 class="header-title">{{ activeBarName }}</h1>
          </div>
          <!-- Barre de recherche masquée sur l'écran d'accueil -->
          <div v-if="activeBarId" class="search-container header-search-inline">
            <Search class="search-icon" :size="16" />
            <input type="text" :placeholder="t.searchPlaceholder" v-model="searchTerm" class="search-input" />
          </div>
          <div class="header-right" style="display:flex; align-items:center; gap:0.5rem;">
            <div class="header-actions">

              <!-- Bartender connecté -->
              <template v-if="activeBarId && isLoggedIn">
                <button @click="openNewModal" class="btn-new-cocktail">
                  <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCocktail }}</span>
                </button>
              </template>

              <!-- Drinker (visible uniquement si bar chargé et pas bartender connecté) -->
              <DrinkerPanel v-if="activeBarId && !isLoggedIn" :bar-id="activeBarId" />

              <button @click="locale = locale === 'fr' ? 'en' : 'fr'" class="btn-mode btn-mode-inactive">
                {{ locale === 'fr' ? '🇬🇧' : '🇫🇷' }}
              </button>
              <button v-if="activeBarId" @click="unit = unit === 'oz' ? 'ml' : 'oz'" class="btn-mode btn-mode-inactive" :title="unit === 'oz' ? 'Passer en ml' : 'Switch to oz'">
                {{ unit === 'oz' ? 'ml' : 'oz' }}
              </button>
            </div>
            <ThemeToggle />

            <!-- Menu burger tout à droite (bartender uniquement) -->
            <div v-if="isLoggedIn" class="burger-wrapper">
              <button @click="burgerOpen = !burgerOpen" class="btn-mode btn-mode-inactive" title="Plus d'options">
                <Menu :size="15" />
              </button>
              <transition name="fade">
                <div v-if="burgerOpen" class="burger-dropdown" @click.stop>
                  <div v-if="activeBarId" class="burger-item burger-item--info">
                    <span>🔑 {{ inviteCode }}</span>
                    <span class="burger-item-hint">Code d'invitation</span>
                  </div>
                  <div v-if="activeBarId" class="burger-divider" />
                  <button v-if="activeBarId" @click="openNewCardModal(); burgerOpen = false" class="burger-item">
                    <BookOpen :size="15" />
                    {{ t.newCard }}
                  </button>
                  <div v-if="activeBarId" class="burger-divider" />
                  <button @click="handleSignOut(); burgerOpen = false" class="burger-item burger-item--danger">
                    <LogOut :size="15" />
                    {{ locale === 'fr' ? 'Se déconnecter' : 'Sign out' }}
                  </button>
                </div>
              </transition>
              <div v-if="burgerOpen" class="burger-overlay" @click="burgerOpen = false" />
            </div>
          </div>
        </div>
        <!-- Barre de recherche mobile masquée sur l'écran d'accueil -->
        <div v-if="activeBarId" class="header-search-row">
          <div class="search-container">
            <Search class="search-icon" :size="16" />
            <input type="text" :placeholder="t.searchPlaceholderShort" v-model="searchTerm" class="search-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- État : pas connecté + pas de bar -->
    <div v-if="!isLoggedIn && !activeBarId" class="main-content">
      <div class="welcome-screen">
        <img src="/logo_square.png" alt="Martini Please" class="welcome-logo" />
        <h2 class="welcome-title">Martini Please</h2>
        <p class="welcome-subtitle">{{ locale === 'fr' ? 'Gérez votre bar, explorez les cocktails.' : 'Manage your bar, explore cocktails.' }}</p>

        <div class="welcome-cards">

          <!-- Bloc Bartender -->
          <div class="welcome-card">
            <div class="welcome-card-header">
              <span class="welcome-card-icon">🍾</span>
              <div>
                <div class="welcome-card-title">Bartender</div>
                <div class="welcome-card-desc">{{ locale === 'fr' ? 'Gérez votre stock et vos recettes' : 'Manage your stock and recipes' }}</div>
              </div>
            </div>
            <button @click="showAuthModal = true" class="password-btn-submit welcome-btn">
              {{ locale === 'fr' ? 'Créer ou accéder à mon bar' : 'Create or access my bar' }}
            </button>
          </div>

          <!-- Bloc Drinker -->
          <div class="welcome-card">
            <div class="welcome-card-header">
              <span class="welcome-card-icon">🥂</span>
              <div>
                <div class="welcome-card-title">Drinker</div>
                <div class="welcome-card-desc">{{ locale === 'fr' ? 'Explorez la carte d\'un bar' : 'Explore a bar\'s menu' }}</div>
              </div>
            </div>
            <button class="welcome-demo" @click="joinDemo">
              🍹 {{ locale === 'fr' ? 'Voir la démo' : 'View demo' }}
              <span class="welcome-demo-code">DEMO-0000</span>
            </button>
            <div class="welcome-code-row">
              <input
                v-model="inviteCodeInput"
                type="text"
                :placeholder="locale === 'fr' ? 'Code du bar (ex: STAR-7514)' : 'Bar code (ex: STAR-7514)'"
                class="password-form-input welcome-code-input"
                @keyup.enter="joinByCode"
              />
              <button @click="joinByCode" class="password-btn-submit">
                {{ locale === 'fr' ? 'Rejoindre' : 'Join' }}
              </button>
            </div>
            <p v-if="codeError" class="password-form-error">{{ codeError }}</p>
          </div>

        </div>
      </div>
    </div>

    <!-- Sélecteur de bar (bartender connecté avec plusieurs bars) -->
    <div v-else-if="isLoggedIn && hasMultipleBars" class="main-content">
      <div class="welcome-screen">
        <img src="/logo_square.png" alt="Martini Please" class="welcome-logo" />
        <h2 class="welcome-title">{{ locale === 'fr' ? 'Quel bar ?' : 'Which bar?' }}</h2>
        <p class="welcome-subtitle">{{ locale === 'fr' ? 'Sélectionne le bar auquel accéder.' : 'Select the bar you want to access.' }}</p>
        <div class="welcome-cards">
          <div
            v-for="b in bars"
            :key="b.id"
            class="welcome-card"
            style="cursor: pointer;"
            @click="selectBar(b)"
          >
            <div class="welcome-card-header">
              <span class="welcome-card-icon">🍾</span>
              <div>
                <div class="welcome-card-title">{{ b.name }}</div>
                <div class="welcome-card-desc">{{ locale === 'fr' ? 'Code :' : 'Code:' }} {{ b.invite_code }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main (bar chargé) -->
    <div v-else class="main-content">

      <!-- Inventaire (bartender mode) -->
      <div v-if="isLoggedIn" class="section-card">
        <button @click="showInventory = !showInventory" class="expand-actions-btn">
          <ChevronDown :size="18" :class="{ rotated: showInventory }" />
          <h2 class="section-title">
            {{ t.stock }}
            <span class="count-badge">{{ selectedCount }} / {{ totalCount }}</span>
          </h2>
          <span></span>
        </button>
        <InventoryManager v-if="showInventory" />
      </div>

      <!-- Filtres + Cartes + Profil drinker côte à côte -->
      <div class="side-by-side">

        <!-- Filtres -->
        <div class="section-card">
          <button @click="showFilters = !showFilters" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showFilters }" />
            <h2 class="section-title">{{ t.filterTitle }}</h2>
            <span></span>
          </button>

          <div v-if="showFilters" class="filters-dropdown-content">

            <div class="filter-group">
              <label class="filter-label">{{ t.filterMode }}</label>
              <div class="filter-mode-toggle">
                <button @click="filterMode = 'main'" :class="['filter-mode-btn', { active: filterMode === 'main' }]">
                  {{ t.filterMain }}
                </button>
                <button @click="filterMode = 'contains'" :class="['filter-mode-btn', { active: filterMode === 'contains' }]">
                  {{ t.filterContains }}
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterSpirits }}</label>
              <div class="chips-container">
                <button
                  v-for="spirit in baseSpirits"
                  :key="spirit.key"
                  @click="toggleFamily(spirit.key)"
                  :class="['chip', { active: selectedFamilies.includes(spirit.key) }]"
                >{{ spirit.label }}</button>
              </div>
              <transition name="fade">
                <div v-if="activeSubSpirits.length" class="chips-container chips-container--sub">
                  <button
                    v-for="sub in activeSubSpirits"
                    :key="sub.key"
                    @click="toggleFilter(selectedSubSpirits, sub.key)"
                    :class="['chip chip--sub', { active: selectedSubSpirits.includes(sub.key) }]"
                  >{{ sub.label }}</button>
                </div>
              </transition>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterLiqueurs }}</label>
              <div class="chips-container">
                <button
                  v-for="liqueur in liqueurFamilies"
                  :key="liqueur.key"
                  @click="toggleFilter(selectedFamilies, liqueur.key)"
                  :class="['chip', { active: selectedFamilies.includes(liqueur.key) }]"
                >{{ liqueur.label }}</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterSeason }}</label>
              <div class="chips-container">
                <button
                  v-for="season in seasons"
                  :key="season.key"
                  @click="season.key === 'all' ? selectedSeasons = [] : toggleFilter(selectedSeasons, season.key)"
                  :class="['chip', { active: season.key === 'all' ? selectedSeasons.length === 0 : selectedSeasons.includes(season.key) }]"
                >{{ season.icon }} {{ season.label }}</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterAvail }}</label>
              <div class="chips-container">
                <button @click="showOnlyMakeable = !showOnlyMakeable" :class="['chip', { active: showOnlyMakeable }]">
                  {{ t.filterMakeable }}
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterAbv }}</label>
              <div class="chips-container">
                <button @click="abvFilter = abvFilter === 'mocktail' ? null : 'mocktail'" :class="['chip', { active: abvFilter === 'mocktail' }]">
                  🧃 Mocktail
                </button>
                <button @click="abvFilter = abvFilter === 'low' ? null : 'low'" :class="['chip', { active: abvFilter === 'low' }]">
                  🍃 Low ABV <span class="chip-hint">&lt; 15°</span>
                </button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterProfile }}</label>
              <div class="chips-container">
                <button
                  v-for="p in profileFilters"
                  :key="p.key"
                  @click="toggleFilter(selectedProfiles, p.key)"
                  :class="['chip', { active: selectedProfiles.includes(p.key) }]"
                >{{ p.label }}</button>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">{{ t.filterStyle }}</label>
              <div class="chips-container">
                <button
                  v-for="s in styleFilters"
                  :key="s.key"
                  @click="toggleFilter(selectedStyles, s.key)"
                  :class="['chip', { active: selectedStyles.includes(s.key) }]"
                >{{ s.label }}</button>
              </div>
            </div>

            <!-- Filtre favoris (si drinker connecté) -->
            <div v-if="hasDrinker" class="filter-group">
              <label class="filter-label">{{ locale === 'fr' ? 'Mes favoris' : 'My favorites' }}</label>
              <div class="chips-container">
                <button @click="showOnlyFavorites = !showOnlyFavorites" :class="['chip', { active: showOnlyFavorites }]">
                  ❤️ {{ locale === 'fr' ? 'Mes favoris uniquement' : 'My favorites only' }}
                </button>
              </div>
            </div>

            <div v-if="hasActiveFilters" class="active-filters-bar">
              <span v-for="f in selectedFamilies" :key="f" class="filter-tag">
                {{ getFamilyLabel(f) }}<X @click="toggleFamily(f)" :size="14" />
              </span>
              <span v-for="s in selectedSubSpirits" :key="s" class="filter-tag filter-tag--sub">
                {{ getSubSpiritLabel(s) }}<X @click="toggleFilter(selectedSubSpirits, s)" :size="14" />
              </span>
              <span v-for="s in selectedSeasons" :key="s" class="filter-tag">
                {{ getSeasonLabel(s) }}<X @click="toggleFilter(selectedSeasons, s)" :size="14" />
              </span>
              <span v-if="abvFilter === 'mocktail'" class="filter-tag">
                🧃 Mocktail <X @click="abvFilter = null" :size="14" />
              </span>
              <span v-if="abvFilter === 'low'" class="filter-tag">
                🍃 Low ABV <X @click="abvFilter = null" :size="14" />
              </span>
              <span v-for="p in selectedProfiles" :key="p" class="filter-tag">
                {{ profileFilters.find(f => f.key === p)?.label }}
                <X @click="toggleFilter(selectedProfiles, p)" :size="14" />
              </span>
              <span v-for="s in selectedStyles" :key="s" class="filter-tag">
                {{ styleFilters.find(f => f.key === s)?.label }}
                <X @click="toggleFilter(selectedStyles, s)" :size="14" />
              </span>
              <button @click="clearFilters" class="clear-all-btn">{{ t.clearAll }}</button>
            </div>
          </div>
        </div>

        <!-- Cartes custom -->
        <div class="section-card">
          <button @click="showCards = !showCards" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showCards }" />
            <h2 class="section-title">
              {{ t.cardsTitle }}
              <span class="count-badge">{{ menuCards.length }}</span>
            </h2>
            <span></span>
          </button>
          <div v-if="showCards" class="cards-content">
            <div v-if="menuCards.length === 0" class="cards-empty">{{ t.noCard }}</div>
            <div v-else class="cards-grid">
              <div v-for="card in menuCards" :key="card.id" class="menu-card-item" @click="viewingCard = card" style="cursor: pointer;">
                <div class="menu-card-info">
                  <span class="menu-card-name">{{ card.name }}</span>
                  <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
                </div>
                <div class="menu-card-actions" @click.stop>
                  <button class="btn-icon btn-icon--view" title="Visualiser" style="pointer-events: none;">
                    <Eye :size="16" />
                  </button>
                  <template v-if="isLoggedIn">
                    <button @click="openEditCardModal(card)" class="btn-icon btn-icon--edit" title="Modifier" style="pointer-events: auto;">
                      <Pencil :size="16" />
                    </button>
                    <button @click="handleDeleteCard(card.id)" class="btn-icon btn-icon--delete" title="Supprimer" style="pointer-events: auto;">
                      <Trash2 :size="16" />
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Profil drinker (visible uniquement si connecté en tant que drinker) -->
        <div v-if="hasDrinker" class="section-card">
          <button @click="showDrinkerPanel = !showDrinkerPanel" class="expand-actions-btn">
            <ChevronDown :size="18" :class="{ rotated: showDrinkerPanel }" />
            <h2 class="section-title">
              👤 {{ drinkerPseudo }}
            </h2>
            <span></span>
          </button>
          <div v-if="showDrinkerPanel" class="filters-dropdown-content">

            <!-- Tabs Favoris / Historique -->
            <div class="auth-tabs" style="margin-bottom: 12px; border-bottom: 1px solid var(--color-border-tertiary);">
              <button :class="['auth-tab', { active: drinkerTab === 'favorites' }]" @click="drinkerTab = 'favorites'">
                ❤️ {{ locale === 'fr' ? 'Favoris' : 'Favorites' }}
                <span class="count-badge">{{ favorites.size }}</span>
              </button>
              <button :class="['auth-tab', { active: drinkerTab === 'history' }]" @click="drinkerTab = 'history'">
                🕐 {{ locale === 'fr' ? 'Historique' : 'History' }}
                <span class="count-badge">{{ history.length }}</span>
              </button>
            </div>

            <!-- Favoris -->
            <div v-if="drinkerTab === 'favorites'">
              <div v-if="favorites.size === 0" class="cards-empty">
                {{ locale === 'fr' ? 'Aucun favori pour l\'instant.' : 'No favorites yet.' }}
              </div>
              <div v-else class="cards-grid">
                <div v-for="cocktail in favoriteCocktails" :key="cocktail.id" class="menu-card-item">
                  <span class="menu-card-name">{{ cocktail.name }}</span>
                  <button @click="toggleFavorite(cocktail.id)" class="btn-icon btn-icon--delete" title="Retirer">
                    <Heart :size="14" fill="currentColor" style="color: #e05c6e" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Historique -->
            <div v-if="drinkerTab === 'history'">
              <div v-if="history.length === 0" class="cards-empty">
                {{ locale === 'fr' ? 'Aucune commande encore.' : 'No orders yet.' }}
              </div>
              <div v-else class="cards-grid">
                <div v-for="(entry, i) in history" :key="i" class="menu-card-item">
                  <span class="menu-card-name">{{ getCocktailName(entry.cocktail_id) }}</span>
                  <span class="menu-card-count">{{ formatDate(entry.ordered_at) }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Liste cocktails -->
      <div>
        <h2 class="cocktails-header">
          {{ filteredCocktails.length }}
          {{ locale === 'fr'
            ? `cocktail${filteredCocktails.length > 1 ? 's' : ''} trouvé${filteredCocktails.length > 1 ? 's' : ''}`
            : `cocktail${filteredCocktails.length > 1 ? 's' : ''} found`
          }}
          <span v-if="showOnlyMakeable" class="cocktails-header-makeable">
            ({{ makeableCount }} {{ locale === 'fr' ? 'réalisables' : 'available' }})
          </span>
        </h2>
        <div v-if="cocktailsLoading" class="loading-state">{{ t.loading }}</div>
        <div v-else-if="filteredCocktails.length === 0" class="empty-state">{{ t.noResult }}</div>
        <div v-else class="cocktails-grid">
          <CocktailCard
            v-for="cocktail in filteredCocktails"
            :key="cocktail.id"
            :cocktail="cocktail"
            :isBartenderMode="isLoggedIn"
            :locale="locale"
            :unit="unit"
            @edit="openEditModal"
            @delete="handleDelete"
          />
        </div>
      </div>

    </div>

    <!-- Modals -->
    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" @success="onAuthSuccess" />
    <MenuCardModal v-if="showCardModal" :card="editingCard" :cocktails="cocktails" :locale="locale" @save="handleSaveCard" @close="showCardModal = false" />
    <CocktailModal v-if="showCocktailModal" :cocktail="editingCocktail" @save="handleSave" @close="showCocktailModal = false" />
    <MenuCardView
      v-if="viewingCard"
      :card="viewingCard"
      :cocktails="cocktails"
      :locale="locale"
      :unit="unit"
      @close="viewingCard = null"
      @toggle-locale="locale = locale === 'fr' ? 'en' : 'fr'"
      @toggle-unit="unit = unit === 'oz' ? 'ml' : 'oz'"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, ChevronDown, X, Plus, BookOpen, Pencil, Trash2, Eye, Lock, Unlock, LogOut, Heart, Menu } from 'lucide-vue-next'

import { useAuth }      from '@/composables/useAuth'
import { useCocktails } from '@/composables/useCocktails'
import { useInventory } from '@/composables/useInventory'
import { useMenuCards } from '@/composables/useMenuCards'
import { useDrinker }   from '@/composables/useDrinker'

import CocktailCard    from '@/Components/CocktailCard.vue'
import InventoryManager from '@/Components/Modals/InventoryManager.vue'
import CocktailModal   from '@/Components/Modals/CocktailModal.vue'
import MenuCardModal   from '@/Components/Modals/MenuCardModal.vue'
import MenuCardView    from '@/Components/MenuCardView.vue'
import AuthModal       from '@/Components/Modals/AuthModal.vue'
import DrinkerPanel    from '@/Components/DrinkerPanel.vue'
import ThemeToggle     from '@/Components/ThemeToggle.vue'
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'
import { supabase }    from '@/lib/supabase'
import { useCatalogue } from '@/composables/useCatalogue'

const { isLoggedIn, currentBarId, currentBarName, inviteCode, bars, hasMultipleBars, initAuth, signOut, fetchBar } = useAuth()

// Bar chargé via code d'invitation (guest sans compte)
const guestBar = ref(null)
const activeBarId   = computed(() => currentBarId.value ?? guestBar.value?.id ?? null)
const activeBarName = computed(() => currentBarName.value || guestBar.value?.name || 'Martini Please')
const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients } = useInventory()
const { menuCards, fetchMenuCards, createMenuCard, updateMenuCard, deleteMenuCard } = useMenuCards()
const { hasDrinker, drinkerPseudo, initDrinker, favorites, history, toggleFavorite, clearDrinker } = useDrinker()
const { fetchSubmitted } = useCatalogue()

// Logo → retour à l'écran de connexion
function handleLogoClick() {
  if (isLoggedIn.value) {
    handleSignOut()
  } else {
    guestBar.value          = null
    cocktails.value         = []
    ingredients.value       = []
    menuCards.value         = []
  }
}

async function handleSignOut() {
  await signOut()
  guestBar.value = null
}

// Sélection d'un bar parmi plusieurs (cas multi-bars)
async function selectBar(b) {
  await fetchBar(b.id)
  await Promise.all([
    fetchCocktails(b.id),
    fetchIngredients(b.id),
    fetchMenuCards(b.id),
  ])
}

const showDrinkerPanel  = ref(false)
const drinkerTab        = ref('favorites')
const burgerOpen        = ref(false)

// Helpers pour le panel drinker
const favoriteCocktails = computed(() => cocktails.value.filter(c => favorites.value.has(c.id)))
function getCocktailName(id) { return cocktails.value.find(c => c.id === id)?.name ?? '—' }
function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// UI
const showAuthModal     = ref(false)
const showInventory     = ref(false)
const showFilters       = ref(false)
const showCards         = ref(false)
const showCocktailModal = ref(false)
const showCardModal     = ref(false)
const editingCocktail   = ref(null)
const editingCard       = ref(null)
const viewingCard       = ref(null)
const locale            = ref('fr')

// Rejoindre un bar via code d'invitation (sans compte)
const inviteCodeInput = ref('')
const codeError       = ref('')

async function joinDemo() {
  inviteCodeInput.value = 'DEMO-0000'
  await joinByCode()
}

async function joinByCode() {
  codeError.value = ''
  const code = inviteCodeInput.value.trim().toUpperCase()
  if (!code) return

  const { data, error } = await supabase
    .from('bars')
    .select('id, name')
    .eq('invite_code', code)
    .single()

  console.log('joinByCode result:', data, error)

  if (error || !data) {
    codeError.value = 'Code invalide. Vérifie avec ton bartender.'
    return
  }

  guestBar.value = data
  await Promise.all([
    fetchCocktails(data.id),
    fetchIngredients(data.id),
    fetchMenuCards(data.id),
    initDrinker(data.id),
  ])
}

async function onAuthSuccess() {
  clearDrinker()
  // Si plusieurs bars sur le compte, fetchBar() aura rempli bars[] sans sélectionner
  // → l'UI affichera le sélecteur de bar ; pas besoin de charger les données ici
  if (!currentBarId.value) return
  await Promise.all([
    fetchCocktails(currentBarId.value),
    fetchIngredients(currentBarId.value),
    fetchMenuCards(currentBarId.value),
  ])
}

// Traductions
const t = computed(() => ({
  filterTitle:            locale.value === 'fr' ? '🔍 Filtres'                          : '🔍 Filters',
  cardsTitle:             locale.value === 'fr' ? '📜 Cartes'                           : '📜 Cards',
  bartenderMode:          locale.value === 'fr' ? 'Mode Bartender'                      : 'Bartender Mode',
  drinkerMode:            locale.value === 'fr' ? 'Mode Drinker'                        : 'Drinker Mode',
  newCard:                locale.value === 'fr' ? 'Nouvelle carte'                      : 'New card',
  newCocktail:            locale.value === 'fr' ? 'Nouveau cocktail'                    : 'New cocktail',
  searchPlaceholder:      locale.value === 'fr' ? 'Rechercher un cocktail ou un ingrédient...' : 'Search a cocktail or ingredient...',
  searchPlaceholderShort: locale.value === 'fr' ? 'Rechercher...'                       : 'Search...',
  filterMode:             locale.value === 'fr' ? 'Mode de recherche'                   : 'Search mode',
  filterMain:             locale.value === 'fr' ? '🎯 Ingrédient principal'             : '🎯 Main ingredient',
  filterContains:         locale.value === 'fr' ? '🔍 Contient'                         : '🔍 Contains',
  filterSpirits:          locale.value === 'fr' ? 'Spiritueux de base'                  : 'Base spirits',
  filterLiqueurs:         locale.value === 'fr' ? 'Liqueurs'                            : 'Liqueurs',
  filterSeason:           locale.value === 'fr' ? 'Saison'                              : 'Season',
  filterAvail:            locale.value === 'fr' ? 'Disponibilité'                       : 'Availability',
  filterMakeable:         locale.value === 'fr' ? '🍸 Cocktails réalisables'            : '🍸 Available cocktails',
  filterAbv:              locale.value === 'fr' ? 'Alcool'                              : 'Alcohol',
  clearAll:               locale.value === 'fr' ? 'Effacer tout'                        : 'Clear all',
  noCard:                 locale.value === 'fr' ? 'Aucune carte créée.' : 'No card yet.',
  loading:                locale.value === 'fr' ? 'Chargement des cocktails...'          : 'Loading cocktails...',
  noResult:               locale.value === 'fr' ? 'Aucun cocktail trouvé avec ces critères' : 'No cocktail found',
  stock:                  locale.value === 'fr' ? '📦 Stock du bar'                     : '📦 Bar stock',
  deleteCard:             locale.value === 'fr' ? 'Supprimer cette carte ?'             : 'Delete this card?',
  deleteCocktail:         locale.value === 'fr' ? 'Supprimer ce cocktail ?'             : 'Delete this cocktail?',
  filterProfile:          locale.value === 'fr' ? 'Profil gustatif'                     : 'Flavor profile',
  filterStyle:            locale.value === 'fr' ? 'Style'                                 : 'Style',
}))

// ── Filtres (identique à l'original) ─────────────────────────────────────────
const searchTerm         = ref('')
const selectedFamilies   = ref([])
const selectedSubSpirits = ref([])
const selectedSeasons    = ref([])
const showOnlyMakeable   = ref(false)
const showOnlyFavorites  = ref(false)
const filterMode         = ref('main')
const abvFilter          = ref(null)
const selectedProfiles   = ref([])
const selectedStyles     = ref([])
const unit               = ref('oz') // 'oz' ou 'ml'

const baseSpirits = computed(() => [
  { key: 'Whiskey', label: getFL('Whiskey', locale.value), subs: [
    { key: 'bourbon',       label: getFL('bourbon', locale.value)       },
    { key: 'rye',           label: getFL('rye', locale.value)           },
    { key: 'scotch',        label: getFL('scotch', locale.value)        },
    { key: 'irish_whiskey', label: getFL('irish_whiskey', locale.value) },
    { key: 'peated_whisky', label: getFL('peated_whisky', locale.value) },
    { key: 'whiskey',       label: getFL('whiskey', locale.value)       },
  ]},
  { key: 'Rum', label: getFL('Rum', locale.value), subs: [
    { key: 'rum',           label: getFL('rum', locale.value)           },
    { key: 'rum_agricol',   label: getFL('rum_agricol', locale.value)   },
    { key: 'rum_jamaican',  label: getFL('rum_jamaican', locale.value)  },
    { key: 'rum_cuban',     label: getFL('rum_cuban', locale.value)     },
    { key: 'rum_overproof', label: getFL('rum_overproof', locale.value) },
    { key: 'cachaca',       label: getFL('cachaca', locale.value)       },
  ]},
  { key: 'Agave', label: getFL('Agave', locale.value), subs: [
    { key: 'tequila',          label: getFL('tequila', locale.value)          },
    { key: 'tequila_reposado', label: getFL('tequila_reposado', locale.value) },
    { key: 'mezcal',           label: getFL('mezcal', locale.value)           },
  ]},
  { key: 'Gin', label: getFL('Gin', locale.value), subs: [
    { key: 'gin',      label: getFL('gin', locale.value)      },
    { key: 'gin_dry',  label: getFL('gin_dry', locale.value)  },
    { key: 'gin_navy', label: getFL('gin_navy', locale.value) },
    { key: 'genever',  label: getFL('genever', locale.value)  },
  ]},
  { key: 'Brandy', label: getFL('Brandy', locale.value), subs: [
    { key: 'cognac',   label: getFL('cognac', locale.value)   },
    { key: 'calvados', label: getFL('calvados', locale.value) },
    { key: 'pisco',    label: getFL('pisco', locale.value)    },
    { key: 'grappa',   label: getFL('grappa', locale.value)   },
    { key: 'brandy',   label: getFL('brandy', locale.value)   },
  ]},
  { key: 'Vodka',    label: getFL('Vodka', locale.value),    subs: [] },
  { key: 'Absinthe', label: getFL('Absinthe', locale.value), subs: [] },
  { key: 'Aquavit',  label: getFL('Aquavit', locale.value),  subs: [] },
])

const liqueurFamilies = computed(() => [
  { key: 'Liqueur Amer',    label: getFL('Liqueur Amer', locale.value)    },
  { key: 'Liqueur Agrume',  label: getFL('Liqueur Agrume', locale.value)  },
  { key: 'Liqueur Fruits',  label: getFL('Liqueur Fruits', locale.value)  },
  { key: 'Liqueur Herbes',  label: getFL('Liqueur Herbes', locale.value)  },
  { key: 'Liqueur Noix',    label: getFL('Liqueur Noix', locale.value)    },
  { key: 'Liqueur Dessert', label: getFL('Liqueur Dessert', locale.value) },
  { key: 'Liqueur Anisée',  label: getFL('Liqueur Anisée', locale.value)  },
])

const profileFilters = computed(() => {
  const labels = {
    Smoky: locale.value === 'fr' ? 'Fumé' : 'Smoky',
    Bitter: locale.value === 'fr' ? 'Amer' : 'Bitter',
    Creamy: locale.value === 'fr' ? 'Crémeux' : 'Creamy',
    Tropical: locale.value === 'fr' ? 'Tropical' : 'Tropical',
    Floral: locale.value === 'fr' ? 'Floral' : 'Floral',
    Nutty: locale.value === 'fr' ? 'Noisetté' : 'Nutty',
    Spicy: locale.value === 'fr' ? 'Épicé' : 'Spicy',
    Herbal: locale.value === 'fr' ? 'Herbacé' : 'Herbal',
    Fruity: locale.value === 'fr' ? 'Fruité' : 'Fruity',
    Citrus: locale.value === 'fr' ? 'Agrume' : 'Citrus',
    Sour: locale.value === 'fr' ? 'Acidulé' : 'Sour',
    Dry: locale.value === 'fr' ? 'Sec' : 'Dry',
    Boozy: locale.value === 'fr' ? 'Corsé' : 'Boozy',
    Refreshing: locale.value === 'fr' ? 'Frais' : 'Refreshing',
    Rich: locale.value === 'fr' ? 'Riche' : 'Rich',
    Sweet: locale.value === 'fr' ? 'Sucré' : 'Sweet',
  }
  return Object.entries(labels).map(([key, label]) => ({ key, label }))
})

const styleFilters = computed(() => {
  const labels = {
    sour:          locale.value === 'fr' ? '🍋 Sour'          : '🍋 Sour',
    fizz:          locale.value === 'fr' ? '🫧 Fizz'          : '🫧 Fizz',
    highball:      locale.value === 'fr' ? '🥃 Highball'      : '🥃 Highball',
    tiki:          locale.value === 'fr' ? '🌺 Tiki'          : '🌺 Tiki',
    negroni:       locale.value === 'fr' ? '🔴 Negroni'       : '🔴 Negroni',
    old_fashioned: locale.value === 'fr' ? '🟠 Old Fashioned' : '🟠 Old Fashioned',
    classic:       locale.value === 'fr' ? '🎩 Classique'     : '🎩 Classic',
    modern:        locale.value === 'fr' ? '✨ Moderne'        : '✨ Modern',
    creamy:        locale.value === 'fr' ? '🥛 Crémeux'       : '🥛 Creamy',
    flip:          locale.value === 'fr' ? '🥚 Flip'          : '🥚 Flip',
    spritz:        locale.value === 'fr' ? '🍾 Spritz'        : '🍾 Spritz',
  }
  return Object.entries(labels).map(([key, label]) => ({ key, label }))
})

const seasons = computed(() => [
  { key: 'all',    icon: '🍸', label: locale.value === 'fr' ? 'Toutes'    : 'All'    },
  { key: 'spring', icon: '🌸', label: locale.value === 'fr' ? 'Printemps' : 'Spring' },
  { key: 'summer', icon: '☀️', label: locale.value === 'fr' ? 'Été'       : 'Summer' },
  { key: 'fall',   icon: '🍂', label: locale.value === 'fr' ? 'Automne'   : 'Fall'   },
  { key: 'winter', icon: '❄️', label: locale.value === 'fr' ? 'Hiver'     : 'Winter' },
])

const allFamilyLabels = computed(() => Object.fromEntries([
  ...baseSpirits.value.map(s => [s.key, s.label]),
  ...liqueurFamilies.value.map(l => [l.key, l.label]),
]))
const allSubLabels = computed(() => Object.fromEntries(
  baseSpirits.value.flatMap(s => s.subs.map(sub => [sub.key, sub.label]))
))
const activeSubSpirits = computed(() => {
  const subs = []
  for (const family of baseSpirits.value) {
    if (selectedFamilies.value.includes(family.key) && family.subs.length) subs.push(...family.subs)
  }
  return subs
})

function toggleFilter(array, value) {
  const idx = array.indexOf(value)
  if (idx > -1) array.splice(idx, 1)
  else array.push(value)
}
function toggleFamily(familyKey) {
  const isActive = selectedFamilies.value.includes(familyKey)
  toggleFilter(selectedFamilies.value, familyKey)
  if (isActive) {
    const family = baseSpirits.value.find(s => s.key === familyKey)
    if (family?.subs.length) {
      const subKeys = family.subs.map(s => s.key)
      selectedSubSpirits.value = selectedSubSpirits.value.filter(k => !subKeys.includes(k))
    }
  }
}
function clearFilters() {
  selectedFamilies.value = []; selectedSubSpirits.value = []
  selectedSeasons.value  = []; selectedProfiles.value = []
  abvFilter.value = null; showOnlyFavorites.value = false; selectedStyles.value = []
}
function getFamilyLabel(key)    { return allFamilyLabels.value[key] ?? key }
function getSubSpiritLabel(key) { return allSubLabels.value[key] ?? key }
function getSeasonLabel(key) {
  const s = seasons.value.find(s => s.key === key)
  return s ? `${s.icon} ${s.label}` : key
}

const selectedCount = computed(() => barInventory.value.size)
const totalCount    = computed(() => ingredients.value.length)

function isMakeable(cocktail) {
  const recipe = cocktail.recipe || []
  if (!recipe.length) return false
  return recipe.every(ing => ing.Type === 'garnish' || barInventory.value.has(ing.Type))
}
const makeableCount = computed(() => cocktails.value.filter(isMakeable).length)

const filteredCocktails = computed(() => {
  let list = cocktails.value

  if (searchTerm.value.trim()) {
    const s = searchTerm.value.toLowerCase().trim()
    list = list.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.recipe?.some(ing => ing.Ingredient?.toLowerCase().includes(s)) ||
      c.creator?.toLowerCase().includes(s) ||
      c.profile?.some(p => p.toLowerCase().includes(s))
    )
  }

  if (selectedFamilies.value.length || selectedSubSpirits.value.length) {
    const activeSubs = selectedSubSpirits.value
    const activeFamilies = selectedFamilies.value
    list = list.filter(c => {
      if (filterMode.value === 'main') {
        const familyMatch = activeFamilies.length === 0 || activeFamilies.includes(c.category)
        const subMatch    = activeSubs.length === 0     || activeSubs.includes(c.base_spirit)
        return familyMatch && subMatch
      } else {
        const recipeTypes = (c.recipe || []).map(ing => ing.Type)
        if (activeSubs.length) return activeSubs.some(sub => recipeTypes.includes(sub))
        return activeFamilies.some(family => {
          const familyDef = baseSpirits.value.find(s => s.key === family)
          if (familyDef) {
            const subKeys    = familyDef.subs.map(s => s.key)
            const genericKey = family.toLowerCase()
            return recipeTypes.some(t => subKeys.includes(t) || t === genericKey)
          }
          return recipeTypes.includes(family.toLowerCase())
        })
      }
    })
  }

  if (selectedSeasons.value.length) {
    list = list.filter(c =>
      Array.isArray(c.season)
        ? c.season.some(s => selectedSeasons.value.includes(s))
        : selectedSeasons.value.includes(c.season)
    )
  }

  if (showOnlyMakeable.value) list = list.filter(isMakeable)

  if (abvFilter.value === 'mocktail') {
    list = list.filter(c => c.abv === 0 || c.abv === null)
  } else if (abvFilter.value === 'low') {
    list = list.filter(c => c.abv !== null && c.abv > 0 && c.abv < 15)
  }

  if (selectedProfiles.value.length) {
    list = list.filter(c => selectedProfiles.value.every(p => c.profile?.includes(p)))
  }

  if (selectedStyles.value.length) {
    list = list.filter(c => selectedStyles.value.includes(c.cocktail_style))
  }

  if (showOnlyFavorites.value && hasDrinker.value) {
    list = list.filter(c => favorites.value.has(c.id))
  }

  return list
})

const hasActiveFilters = computed(() =>
  selectedFamilies.value.length > 0 ||
  selectedSubSpirits.value.length > 0 ||
  selectedSeasons.value.length > 0 ||
  selectedProfiles.value.length > 0 ||
  abvFilter.value !== null ||
  showOnlyFavorites.value ||
  selectedStyles.value.length > 0
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
  if (!confirm(t.value.deleteCard)) return
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
  if (!confirm(t.value.deleteCocktail)) return
  await deleteCocktail(id)
}

onMounted(async () => {
  await initAuth()
  if (currentBarId.value) {
    await Promise.all([
      fetchCocktails(currentBarId.value),
      fetchIngredients(currentBarId.value),
      fetchMenuCards(currentBarId.value),
      initDrinker(currentBarId.value),
    ])
  await fetchSubmitted()
  }
})
</script>

<style scoped>
.auth-tab {
  flex: 1;
  padding: 6px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
  margin-bottom: -1px;
}
.auth-tab.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-text-primary);
  font-weight: 500;
}

.burger-wrapper {
  position: relative;
}
.burger-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-lg);
  padding: 6px;
  z-index: 200;
  box-shadow: var(--shadow-lg);
}
.burger-overlay {
  position: fixed;
  inset: 0;
  z-index: 199;
}
.burger-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.burger-item:hover {
  background: var(--bg-raised);
}
.burger-item--info {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  cursor: default;
  color: var(--gold);
  font-weight: 700;
  letter-spacing: 0.5px;
}
.burger-item--info:hover {
  background: none;
}
.burger-item-hint {
  font-size: 0.7rem;
  color: var(--text-dim);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.burger-item--danger {
  color: var(--danger-text);
}
.burger-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}
.welcome-logo {
  width: 72px;
  height: 72px;
  margin-bottom: 16px;
  border-radius: 16px;
}

.dark .welcome-logo { filter: brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(5deg);}

.welcome-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--gold);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 3px;
}
.welcome-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 40px;
}
.welcome-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
.welcome-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: left;
}
.welcome-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}
.welcome-card-icon {
  font-size: 22px;
  flex-shrink: 0;
}
.welcome-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.welcome-card-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.welcome-btn {
  width: 100%;
}
.welcome-demo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--gold-dim);
  background: rgba(201, 168, 76, 0.06);
  color: var(--gold);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}
.welcome-demo:hover {
  background: rgba(201, 168, 76, 0.12);
  border-color: var(--gold);
}
.welcome-demo-code {
  font-family: monospace;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: rgba(201, 168, 76, 0.15);
  border: 1px solid var(--gold-dim);
  color: var(--gold);
  letter-spacing: 1px;
  margin-left: auto;
}
.welcome-code-row {
  display: flex;
  gap: 8px;
}
.welcome-code-input {
  flex: 1;
  text-transform: uppercase;
}

.invite-code-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border-secondary);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
  cursor: default;
  user-select: all;
}
</style>