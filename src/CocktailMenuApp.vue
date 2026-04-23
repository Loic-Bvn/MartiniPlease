<template>
  <div class="min-h-screen menu-app">

    <!-- Header -->
    <AppHeader
      :isLoggedIn="isLoggedIn"
      :activeBarId="activeBarId"
      :activeBarName="activeBarName"
      :isBarPublic="isBarPublic"
      :inviteCode="inviteCode"
      :bars="bars"
      :showBarsSelection="showBarsSelection"
      :locale="locale"
      :unit="unit"
      :toastMessage="toastMessage"
      :searchTerm="searchTerm"
      :showSearchSuggestions="showSearchSuggestions"
      :suggestions="suggestions"
      :randomLogo="randomLogo"
      @logo-click="handleLogoClick"
      @open-new-cocktail="openNewModal"
      @toggle-locale="locale = locale === 'fr' ? 'en' : 'fr'"
      @toggle-unit="unit = unit === 'oz' ? 'ml' : 'oz'"
      @scroll-to-cocktail="scrollToCocktailCard"
      @invite="handleInvite"
      @open-bars-selection="openBarsSelection"
      @toggle-public="handleTogglePublic"
      @open-catalog="showCatalogModal = true"
      @sign-out="handleSignOut"
      @update:searchTerm="searchTerm = $event"
    />
    <!-- État : pas connecté + pas de bar -->
    <WelcomePage
      v-if="!isLoggedIn && !activeBarId"
      :randomLogo="randomLogo"
      :locale="locale"
      :publicBars="publicBars"
      :publicBarsLoading="publicBarsLoading"
      :inviteCodeInput="inviteCodeInput"
      :codeError="codeError"
      @open-auth="showAuthModal = true"
      @join-public-bar="joinPublicBar"
      @join-by-code="joinByCode"
      @update:inviteCodeInput="inviteCodeInput = $event"
    />

    <!-- Sélecteur de bar (bartender connecté avec plusieurs bars) ou vue de gestion -->
    <BarSelector
      v-if="(isLoggedIn && hasMultipleBars) || showBarsSelection"
      :randomLogo="randomLogo"
      :locale="locale"
      :bars="bars"
      :barStatsMap="barStatsMap"
      :editingBarId="editingBarId"
      :editingBarName="editingBarName"
      :editingBarCode="editingBarCode"
      :updatingBarId="updatingBarId"
      :newBarName="newBarName"
      :showNewBarInput="showNewBarInput"
      :barToDelete="barToDelete"
      :deleteConfirmationInput="deleteConfirmationInput"
      @create-new-bar="handleCreateNewBar"
      @select-bar="selectBar"
      @start-edit-bar="startEditBar"
      @save-bar-edits="saveBarEdits"
      @cancel-edit-bar="cancelEditBar"
      @start-delete-bar="startDeleteBar"
      @load-bar-stats="loadBarStats"
      @close-delete-modal="barToDelete = null"
      @delete-bar="handleDeleteBar"
      @update:newBarName="newBarName = $event"
      @update:editingBarName="editingBarName = $event"
      @update:editingBarCode="editingBarCode = $event"
      @update:deleteConfirmationInput="deleteConfirmationInput = $event"
    />

    <!-- Main (bar chargé) -->
    <BarMainView
      v-if="activeBarId && !showBarsSelection"
      :isLoggedIn="isLoggedIn"
      :activeBarId="activeBarId"
      :cocktails="cocktails"
      :cocktailsLoading="cocktailsLoading"
      :menuCards="menuCards"
      :hasDrinker="hasDrinker"
      :drinkerPseudo="drinkerPseudo"
      :favorites="favorites"
      :history="history"
      :pendingOrdersCount="pendingOrdersCount"
      :locale="locale"
      :unit="unit"
      :barInventory="barInventory"
      :ingredients="ingredients"
      :searchTerm="searchTerm"
      :selectedFamilies="selectedFamilies"
      :selectedSubSpirits="selectedSubSpirits"
      :selectedSeasons="selectedSeasons"
      :showOnlyMakeable="showOnlyMakeable"
      :showOnlyFavorites="showOnlyFavorites"
      :filterMode="filterMode"
      :abvFilter="abvFilter"
      :selectedProfiles="selectedProfiles"
      :selectedStyles="selectedStyles"
      @view-card="viewingCard = $event"
      @edit-card="openEditCardModal"
      @delete-card="handleDeleteCard"
      @new-card="openNewCardModal"
      @toggle-favorite="toggleFavorite"
      @edit-cocktail="openEditModal"
      @delete-cocktail="handleDelete"
      @new-cocktail="openNewModal"
      @toggle-family="toggleFamily"
      @toggle-filter="toggleFilter"
      @clear-filters="clearFilters"
    />

    <!-- Modals -->
    <AuthModal v-if="showAuthModal" @close="showAuthModal = false" @success="onAuthSuccess" />
    <DrinkerLoginModal v-if="showDrinkerLoginModal && activeBarId && !isLoggedIn" :locale="locale" @drinker-created="handleDrinkerCreated" @guest-mode="handleGuestMode" @close="showDrinkerLoginModal = false" />
    <MenuCardModal v-if="showCardModal" :card="editingCard" :cocktails="cocktails" :locale="locale" @save="handleSaveCard" @close="showCardModal = false" />
    <CatalogModal v-if="showCatalogModal" @close="showCatalogModal = false" @imported="handleCatalogImport" />
    <CocktailModal v-if="showCocktailModal" :cocktail="editingCocktail" @save="handleSave" @close="showCocktailModal = false" :bar-id="activeBarId"/>
    <MenuCardView
      v-if="viewingCard"
      :card="viewingCard"
      :cocktails="cocktails"
      :locale="locale"
      :unit="unit"
      :bar-id="activeBarId"
      @close="viewingCard = null"
      @toggle-locale="locale = locale === 'fr' ? 'en' : 'fr'"
      @toggle-unit="unit = unit === 'oz' ? 'ml' : 'oz'"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search, ChevronDown, X, Plus, BookOpen, Library, Pencil, Trash2, Eye, Lock, Unlock, LogOut, Heart, Menu, Globe, EyeOff, Link, Check, Folder, Martini, Key} from 'lucide-vue-next'

import { useAuth }      from '@/composables/useAuth'
import { useCocktails } from '@/composables/useCocktails'
import { useInventory } from '@/composables/useInventory'
import { useMenuCards } from '@/composables/useMenuCards'
import { useDrinker }   from '@/composables/useDrinker'
import { useOrders }    from '@/composables/useOrders'
import { useSearchSuggestions } from '@/composables/useSearchSuggestions'
import { useBarStatistics } from '@/composables/useBarStatistics'
import { useFilterCounts } from '@/composables/useFilterCounts'

import CocktailCard    from '@/Components/CocktailCard.vue'
import InventoryManager from '@/Components/Modals/InventoryManager.vue'
import CocktailModal   from '@/Components/Modals/CocktailModal.vue'
import MenuCardModal   from '@/Components/Modals/MenuCardModal.vue'
import MenuCardView    from '@/Components/MenuCardView.vue'
import AuthModal       from '@/Components/Modals/AuthModal.vue'
import DrinkerLoginModal from '@/Components/Modals/DrinkerLoginModal.vue'
// import DrinkerPanel    from '@/Components/DrinkerPanel.vue'
import OrdersPanel     from '@/Components/OrdersPanel.vue'
import ThemeToggle     from '@/Components/ThemeToggle.vue'
import AppHeader       from '@/Components/AppHeader.vue'
import WelcomePage     from '@/Components/WelcomePage.vue'
import BarSelector     from '@/Components/BarSelector.vue'
import BarMainView     from '@/Components/BarMainView.vue'
import { getFamilyLabel as getFL } from '@/constants/typeLabels.js'
import { supabase }    from '@/lib/supabase'
import { parseHash, setHash, clearHash, buildShareUrl, slugify } from '@/composables/useRouter'
import { useCatalog } from '@/composables/useCatalog'
import CatalogModal from '@/Components/Modals/CatalogModal.vue'
import { useToast } from '@/composables/useToast'

const { isLoggedIn, bar, currentBarId, currentBarName, inviteCode, bars, hasMultipleBars, isBarPublic, session, initAuth, signOut, fetchBar, toggleBarPublic, createNewBar, updateBarName, updateInviteCode } = useAuth()

// Bar chargé via code d'invitation (guest sans compte)
const guestBar = ref(null)
const activeBarId   = computed(() => currentBarId.value ?? guestBar.value?.id ?? null)
const activeBarName = computed(() => currentBarName.value || guestBar.value?.name || 'Martini Please')
const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients, initializeDefaultIngredients } = useInventory()
const { menuCards, fetchMenuCards, createMenuCard, updateMenuCard, deleteMenuCard } = useMenuCards()
const { hasDrinker, drinkerPseudo, initDrinker, createDrinker, reconnectDrinker, favorites, history, toggleFavorite, clearDrinker } = useDrinker()
const { fetchSnapshots } = useCatalog()
const { toastMessage, showToast } = useToast()

// Logos disponibles
const base = import.meta.env.BASE_URL // ex: '/'

const availableLogos = [
  `${base}margarita_square.png`,
  `${base}amaretto_sour_square.png`,
  `${base}aviation_square.png`,
  `${base}negroni_square.png`
]

// Fonction pour obtenir un logo aléatoire
function getRandomLogo() {
  return availableLogos[Math.floor(Math.random() * availableLogos.length)]
}

const randomLogo = ref(getRandomLogo())
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

const togglingPublic = ref(false)
const newBarName = ref('')
const showNewBarInput = ref(false)
const showBarsSelection = ref(false)
const barToDelete = ref(null)
const deleteConfirmationInput = ref('')

async function handleTogglePublic() {
  if (togglingPublic.value) return
  togglingPublic.value = true
  await toggleBarPublic()
  togglingPublic.value = false
}

async function handleSignOut() {
  await signOut()
  guestBar.value = null
  clearHash()
}

// Sélection d'un bar parmi plusieurs (cas multi-bars) dans l'écran de sélection
async function selectBar(b) {
  await fetchBar(b.id)
  showBarsSelection.value = false
  setHash(b.invite_code)
  await Promise.all([
    fetchCocktails(b.id),
    fetchIngredients(b.id),
    fetchMenuCards(b.id),
  ])
}

// Créer un nouveau bar
async function handleCreateNewBar() {
  const name = newBarName.value.trim()
  if (!name) return
  const result = await createNewBar(name)
  if (result.success) {
    newBarName.value = ''
    showNewBarInput.value = false
    
    // Initialiser les ingrédients par défaut pour le nouveau bar
    try {
      await initializeDefaultIngredients(result.data.id)
    } catch (err) {
      console.error('⚠️ Error initializing ingredients:', err)
    }
    
    // Changer vers le nouveau bar créé
    await Promise.all([
      fetchCocktails(result.data.id),
      fetchIngredients(result.data.id),
      fetchMenuCards(result.data.id),
    ])
    showBarsSelection.value = false
  }
}

// Initier la suppression d'un bar
function startDeleteBar(bar) {
  barToDelete.value = bar
  deleteConfirmationInput.value = ''
}

const inviteCopied = ref(false)

const handleInvite = async () => {
  const link = `${window.location.origin}/bar/${activeBarId}`

  try {
    await navigator.clipboard.writeText(link)
    inviteCopied.value = true
    showToast(locale.value === 'fr' ? 'Lien copié 🍸' : 'Link copied 🍸')

    setTimeout(() => {
      inviteCopied.value = false
    }, 2000)
  } catch (e) {
    console.error('Erreur copie lien', e)
  }
}


// Supprimer un bar après confirmation
async function handleDeleteBar() {
  if (!barToDelete.value || deleteConfirmationInput.value !== barToDelete.value.name) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('bars')
      .delete()
      .eq('id', barToDelete.value.id)
      .eq('owner_id', session.value.user.id)
    
    if (error) throw error
    
    // Retirer le bar de la liste
    const index = bars.value.findIndex(b => b.id === barToDelete.value.id)
    if (index > -1) {
      bars.value.splice(index, 1)
    }
    
    // Si c'était le bar actif, sélectionner un autre ou retourner à l'écran de sélection
    if (currentBarId.value === barToDelete.value.id) {
      if (bars.value.length > 0) {
        await selectBar(bars.value[0])
      } else {
        bar.value = null
        showBarsSelection.value = false
      }
    }
    
    barToDelete.value = null
    deleteConfirmationInput.value = ''
  } catch (err) {
    console.error('❌ Error deleting bar:', err)
    alert(`${locale.value === 'fr' ? 'Erreur' : 'Error'}: ${err.message}`)
  }
}

// Fonctions d'édition des bars
function startEditBar(bar) {
  editingBarId.value = bar.id
  editingBarName.value = bar.name
  editingBarCode.value = bar.invite_code
}

function cancelEditBar() {
  editingBarId.value = null
  editingBarName.value = ''
  editingBarCode.value = ''
}

async function saveBarEdits(barId) {
  if (!editingBarName.value.trim()) {
    alert(locale.value === 'fr' ? 'Le nom du bar ne peut pas être vide.' : 'Bar name cannot be empty.')
    return
  }
  if (!editingBarCode.value.trim()) {
    alert(locale.value === 'fr' ? 'Le code d\'invitation ne peut pas être vide.' : 'Invite code cannot be empty.')
    return
  }

  updatingBarId.value = barId
  try {
    // Mettre à jour le nom
    if (editingBarName.value !== bars.value.find(b => b.id === barId)?.name) {
      const resultName = await updateBarName(barId, editingBarName.value.trim())
      if (!resultName.success) throw new Error(resultName.error)
    }

    // Mettre à jour le code d'invitation
    if (editingBarCode.value !== bars.value.find(b => b.id === barId)?.invite_code) {
      const resultCode = await updateInviteCode(barId, editingBarCode.value.trim().toUpperCase())
      if (!resultCode.success) throw new Error(resultCode.error)
    }

    cancelEditBar()
  } catch (err) {
    console.error('❌ Error saving bar edits:', err)
    alert(`${locale.value === 'fr' ? 'Erreur' : 'Error'}: ${err.message}`)
  } finally {
    updatingBarId.value = null
  }
}

const showDrinkerPanel  = ref(false)
const drinkerTab        = ref('favorites')
const burgerOpen        = ref(false)

// Initialiser useOrders et écouter les commandes
const { orders, pendingOrdersCount, initOrdersListener, stopOrdersListener } = useOrders()
const showOrdersPanel = ref(false)

// État édition des bars
const editingBarId      = ref(null)
const editingBarName    = ref('')
const editingBarCode    = ref('')
const updatingBarId     = ref(null)
const barStatsMap       = ref({}) // { barId: { cocktails: 0, cards: 0 } }

// Charger les stats d'un bar
async function loadBarStats(barId) {
  if (barStatsMap.value[barId]) return // Cache
  const stats = await getBarStats(barId)
  barStatsMap.value[barId] = stats
}

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
const showCatalogModal  = ref(false)
const showDrinkerLoginModal = ref(false)
const editingCocktail   = ref(null)
const editingCard       = ref(null)
const viewingCard       = ref(null)
const locale            = ref('fr')

// Rejoindre un bar via code d'invitation (sans compte)
const inviteCodeInput = ref('')
const codeError       = ref('')

// Bars publics affichés sur la page d'accueil
const publicBars      = ref([])
const publicBarsLoading = ref(false)

async function fetchPublicBars() {
  publicBarsLoading.value = true
  const { data, error } = await supabase
    .from('bars')
    .select('id, name, invite_code')
    .eq('is_public', true)
    .order('name')
  if (!error && data) publicBars.value = data
  publicBarsLoading.value = false
}

async function joinPublicBar(bar) {
  inviteCodeInput.value = bar.invite_code
  await joinByCode()
}

// async function joinDemo() {
//   inviteCodeInput.value = 'DEMO-0000'
//   await joinByCode()
// }

async function joinByCode() {
  codeError.value = ''
  const code = inviteCodeInput.value.trim().toUpperCase()
  if (!code) return

  const { data, error } = await supabase
    .from('bars')
    .select('id, name, invite_code')
    .eq('invite_code', code)
    .single()

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
  
  // Si pas de drinker existant, ouvrir la modal de connexion
  if (!hasDrinker.value) {
    showDrinkerLoginModal.value = true
  }
  
  setHash(code)
}

async function onAuthSuccess() {
  clearDrinker()
  if (!currentBarId.value) return
  await Promise.all([
    fetchCocktails(currentBarId.value),
    fetchIngredients(currentBarId.value),
    fetchMenuCards(currentBarId.value),
  ])
}

// Modal de connexion drinker
async function handleDrinkerCreated(pseudo) {
  // Essayer de se connecter avec le pseudo existant
  let result = await reconnectDrinker({ pseudo, barId: activeBarId.value })
  
  // Si le pseudo n'existe pas, créer un nouveau profil
  if (!result.success) {
    result = await createDrinker({ pseudo, barId: activeBarId.value })
  }
  
  if (result.success) {
    showDrinkerLoginModal.value = false
  }
}

function handleGuestMode() {
  showDrinkerLoginModal.value = false
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
// Utiliser la composable useSearchSuggestions
const { searchInput: searchTerm, showSuggestions: showSearchSuggestions, suggestions } = useSearchSuggestions(cocktails)
// Statistiques des bars
const { getBarStats } = useBarStatistics()

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
  try {
    if (data.id) {
      const result = await updateCocktail(data.id, data)
      if (!result.success) throw new Error(result.error?.message || 'Erreur lors de la modification')
    } else {
      const result = await createCocktail(data)
      if (!result.success) throw new Error(result.error?.message || 'Erreur lors de la création')
    }
    showCocktailModal.value = false
  } catch (err) {
    console.error('❌ Erreur handleSave:', err)
    alert(`❌ ${err.message}`)
  }
}
async function handleDelete(id) {
  if (!confirm(t.value.deleteCocktail)) return
  await deleteCocktail(id)
}

// Scroll to cocktail card when selected from search suggestions
function scrollToCocktailCard(cocktailId) {
  showSearchSuggestions.value = false
  const element = document.getElementById(`cocktail-${cocktailId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.style.animation = 'pulse 0.6s ease'
    setTimeout(() => { element.style.animation = '' }, 600)
  }
}

// ── Deep link via hash ────────────────────────────────────────────────────────
const linkCopied = ref(false)

function copyBarLink() {
  const code = inviteCode.value || guestBar.value?.invite_code
  if (!code) return
  const card = viewingCard.value
  const cardSlug = card ? slugify(card.name) : null
  const url = buildShareUrl(code, cardSlug)
  navigator.clipboard.writeText(url).then(() => {
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  })
}

// Ouvre automatiquement une carte si le slug correspond
function openCardFromSlug(slug) {
  if (!slug || !menuCards.value.length) return
  const match = menuCards.value.find(c => slugify(c.name) === slug)
  if (match) viewingCard.value = match
}

// Lit le hash et charge le bar + éventuellement la carte correspondante
async function handleHashRoute() {
  const { inviteCode: code, cardSlug } = parseHash()
  if (!code) return
  // Ne pas re-charger si déjà sur ce bar
  if (guestBar.value?.invite_code === code || inviteCode.value === code) {
    if (cardSlug) openCardFromSlug(cardSlug)
    return
  }
  inviteCodeInput.value = code
  await joinByCode()
  if (cardSlug) openCardFromSlug(cardSlug)
}

// Sync hash quand on ouvre/ferme une carte
watch(viewingCard, (card) => {
  const code = inviteCode.value || guestBar.value?.invite_code
  if (!code) return
  if (card) {
    setHash(code, slugify(card.name))
  } else {
    setHash(code)
  }
})

// Écouter les commandes en temps réel (bartender mode uniquement)
watch([activeBarId, isLoggedIn], async ([newBarId, newIsLoggedIn]) => {
  if (newIsLoggedIn && newBarId) {
    // Bartender connecté : activer l'écoute des commandes
    await initOrdersListener(newBarId)
  } else {
    // Arrêter l'écoute des commandes
    stopOrdersListener()
  }
})

onMounted(async () => {
  await initAuth()
  await fetchPublicBars()
  await handleHashRoute()
  if (currentBarId.value) {
    await Promise.all([
      fetchCocktails(currentBarId.value),
      fetchIngredients(currentBarId.value),
      fetchMenuCards(currentBarId.value),
      initDrinker(currentBarId.value),
    ])
  }
})

async function handleCatalogImport(newCocktail) {
  // Le cocktail est déjà créé dans useCatalog.importCocktail
  // On l'ajoute simplement à la liste locale
  if (newCocktail) { 
    cocktails.value.push(newCocktail)
    cocktails.value.sort((a, b) => a.name.localeCompare(b.name)) 
  } 
}

//const toastMessage = ref('')

//const showToast = (message) => {
//  toastMessage.value = message
//
//  setTimeout(() => {
//    toastMessage.value = ''
//  }, 2000)
//}

function openBarsSelection() {
  bar.value = null
  localStorage.removeItem('selectedBar')
  clearHash()                  // ✅ on est en mode "sélection", pas sur un bar
  showBarsSelection.value = true
  burgerOpen.value = false
  searchTerm.value = ''
}

</script>
