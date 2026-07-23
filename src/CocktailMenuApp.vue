<template>
  <!-- Pages légales -->
  <div v-if="currentLegalPage" class="min-h-screen bg-gray-900">
    <LegalNotice   v-if="currentLegalPage === 'legal-notice'"   :locale="locale" @back="closeLegalPage" @navigate="openLegalPage" />
    <PrivacyPolicy v-if="currentLegalPage === 'privacy-policy'" :locale="locale" @back="closeLegalPage" />
    <TermsOfUse    v-if="currentLegalPage === 'terms-of-use'"   :locale="locale" @back="closeLegalPage" />
    <CookiesPolicy v-if="currentLegalPage === 'cookies-policy'" :locale="locale" @back="closeLegalPage" />
  </div>

  <!-- Application principale -->
  <div v-else class="flex flex-col min-h-screen">
    <div class="flex-1">
      <div class="min-h-screen menu-app" :class="{ 'bartender-mode': isLoggedIn }">

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
          :toastType="toastType"
          :searchTerm="searchTerm"
          :suggestions="suggestions"
          :randomLogo="randomLogo"
          @logo-click="handleLogoClick"
          @open-new-cocktail="openNewCocktailFormModal"
          @toggle-locale="toggleLocale"
          @toggle-unit="toggleUnit"
          @scroll-to-cocktail="scrollToCocktailCard"
          @invite="handleInvite"
          @open-bars-selection="handleOpenBarsSelection"
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

        <!-- Sélecteur de bar -->
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
          @select-bar="handleSelectBar"
          @start-edit-bar="startEditBar"
          @save-bar-edits="(id) => saveBarEdits(id, locale)"
          @cancel-edit-bar="cancelEditBar"
          @start-delete-bar="startDeleteBar"
          @load-bar-stats="loadBarStats"
          @close-delete-modal="barToDelete = null"
          @delete-bar="() => handleDeleteBar(locale)"
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
          :menuCards="accessibleMenuCards"
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
          :baseSpirits="baseSpirits"
          :liqueurFamilies="liqueurFamilies"
          :profileFilters="profileFilters"
          :styleFilters="styleFilters"
          :seasons="seasons"
          :activeSubSpirits="activeSubSpirits"
          :allFamilyLabels="allFamilyLabels"
          :allSubLabels="allSubLabels"
          :filteredCocktails="filteredCocktails"
          :hasActiveFilters="hasActiveFilters"
          :makeableCount="makeableCount"
          @view-card="openCardView"
          @open-cocktail="openCocktailDetailModal"
          @edit-card="openEditCardModal"
          @delete-card="handleDeleteCard"
          @new-card="openNewCardModal"
          @toggle-card-visibility="handleToggleCardVisibility"
          @toggle-favorite="toggleFavorite"
          @edit-cocktail="openEditCocktailFormModal"
          @delete-cocktail="handleDeleteCocktail"
          @new-cocktail="openNewCocktailFormModal"
          @toggle-family="toggleFamily"
          @toggle-sub-spirit="toggleSubSpirit"
          @toggle-profile="toggleProfile"
          @toggle-style="toggleStyle"
          @toggle-filter-mode="toggleFilterMode"
          @toggle-makeable="toggleMakeable"
          @toggle-favorites="toggleFavorites"
          @set-abv-filter="setAbvFilter"
          @set-season="setSeason"
          @clear-filters="clearFilters"
        />

        <!-- Modals -->
        <AuthModal
          v-if="showAuthModal"
          @close="showAuthModal = false"
          @success="onAuthSuccess"
        />
        <DrinkerLoginModal
          v-if="showDrinkerLoginModal && activeBarId && !isLoggedIn"
          :locale="locale"
          @drinker-created="handleDrinkerCreated"
          @guest-mode="showDrinkerLoginModal = false"
          @close="showDrinkerLoginModal = false"
        />
        <MenuCardModal
          v-if="showCardModal"
          :card="editingCard"
          :cocktails="cocktails"
          :locale="locale"
          @save="handleSaveCard"
          @close="closeCardModal"
        />
        <CatalogModal
          v-if="showCatalogModal"
          @close="showCatalogModal = false"
          @imported="handleCatalogImport"
        />
        <CocktailFormModal
          v-if="showCocktailFormModal"
          :cocktail="editingCocktail"
          :locale="locale"
          :bar-id="activeBarId"
          @save="handleSaveCocktail"
          @close="closeCocktailFormModal"
        />
        <MenuCardView
          v-if="viewingCard"
          :card="viewingCard"
          :cocktails="cocktails"
          :locale="locale"
          :unit="unit"
          :bar-id="activeBarId"
          @close="closeCardView"
          @toggle-locale="toggleLocale"
          @toggle-unit="toggleUnit"
          @open-cocktail="openCocktailDetailModal"
        />
        <Transition name="modal-fade">
          <CocktailDetailModal
            v-if="viewingCocktail"
            :cocktail="viewingCocktail"
            :locale="locale"
            :origin-rect="viewingCocktailRect"
            :isBartenderMode="isLoggedIn"
            :bar-id="activeBarId"
            @close="closeCocktailDetailModal"
          />
        </Transition>
      </div>
    </div>

    <!-- Footer -->
    <Footer :locale="locale" @navigate-to-legal="openLegalPage" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'

// ── Composables ───────────────────────────────────────────────────────────────
import { useAuth }               from '@/composables/useAuth'
import { useBarManager }         from '@/composables/useBarManager'
import { useUIState }            from '@/composables/useUIState'
import { useFilters }            from '@/composables/useFilters'
import { useCocktails }          from '@/composables/useCocktails'
import { useInventory }          from '@/composables/useInventory'
import { useMenuCards }          from '@/composables/useMenuCards'
import { useDrinker }            from '@/composables/useDrinker'
import { useOrders }             from '@/composables/useOrders'
import { useSearchSuggestions }  from '@/composables/useSearchSuggestions'
import { useBarStatistics }      from '@/composables/useBarStatistics'
import { useCatalog }            from '@/composables/useCatalog'
import { useToast }              from '@/composables/useToast'
import { parseHash, setHash, clearHash, buildShareUrl, slugify } from '@/composables/useRouter'

// ── Composants ────────────────────────────────────────────────────────────────
import AppHeader         from '@/Components/AppHeader.vue'
import WelcomePage       from '@/Components/WelcomePage.vue'
import BarSelector       from '@/Components/BarSelector.vue'
import BarMainView       from '@/Components/BarMainView.vue'
import Footer            from '@/Components/Footer.vue'

// Lazy-loaded — ne font pas partie du bundle initial
const AuthModal         = defineAsyncComponent(() => import('@/Components/Modals/AuthModal.vue'))
const DrinkerLoginModal = defineAsyncComponent(() => import('@/Components/Modals/DrinkerLoginModal.vue'))
const MenuCardModal     = defineAsyncComponent(() => import('@/Components/Modals/MenuCardModal.vue'))
const CatalogModal      = defineAsyncComponent(() => import('@/Components/Modals/CatalogModal.vue'))
const CocktailFormModal     = defineAsyncComponent(() => import('@/Components/Modals/CocktailFormModal.vue'))
const CocktailDetailModal= defineAsyncComponent(() => import('@/Components/Modals/CocktailDetailModal.vue'))
const MenuCardView      = defineAsyncComponent(() => import('@/Components/MenuCardView.vue'))
const LegalNotice       = defineAsyncComponent(() => import('@/views/LegalNotice.vue'))
const PrivacyPolicy     = defineAsyncComponent(() => import('@/views/PrivacyPolicy.vue'))
const TermsOfUse        = defineAsyncComponent(() => import('@/views/TermsOfUse.vue'))
const CookiesPolicy     = defineAsyncComponent(() => import('@/views/CookiesPolicy.vue'))

import { supabase } from '@/lib/supabase'

// ── Auth ──────────────────────────────────────────────────────────────────────
const {
  isLoggedIn, bar, bars, hasMultipleBars, isBarPublic,
  inviteCode, currentBarId, currentBarName,
  initAuth, signOut, fetchBar,
} = useAuth()

// ── UI ────────────────────────────────────────────────────────────────────────
const {
  locale, unit,
  currentLegalPage, openLegalPage, closeLegalPage,
  toggleLocale, toggleUnit,
  showAuthModal, showCocktailFormModal, showCardModal, showCatalogModal, showDrinkerLoginModal,
  editingCocktail, editingCard, viewingCard, viewingCocktail, viewingCocktailRect,
  openNewCocktailFormModal, openEditCocktailFormModal, closeCocktailFormModal,
  openNewCardModal,    openEditCardModal,    closeCardModal,
  openCardView,        closeCardView,
  openCocktailDetailModal,    closeCocktailDetailModal,
} = useUIState()

// ── Bar actif (bartender connecté OU invité via code) ─────────────────────────
const guestBar      = ref(null)
const activeBarId   = computed(() => currentBarId.value ?? guestBar.value?.id   ?? null)
const activeBarName = computed(() => currentBarName.value || guestBar.value?.name || 'Martini Please')

// ── Données ───────────────────────────────────────────────────────────────────
const { cocktails, loading: cocktailsLoading, fetchCocktails, createCocktail, updateCocktail, deleteCocktail } = useCocktails()
const { barInventory, ingredients, fetchIngredients, initializeDefaultIngredients } = useInventory()
const { menuCards, fetchMenuCards, createMenuCard, updateMenuCard, deleteMenuCard } = useMenuCards()
const accessibleMenuCards = computed(() =>
  isLoggedIn.value
    ? menuCards.value
    : menuCards.value.filter(card => card.is_visible !== false)
)
const { hasDrinker, drinkerPseudo, initDrinker, createDrinker, reconnectDrinker, favorites, history, toggleFavorite, clearDrinker } = useDrinker()
const { fetchSnapshots } = useCatalog()
const { toastMessage, toastType, showToast } = useToast()

// ── Gestion des bars ──────────────────────────────────────────────────────────
const {
  showBarsSelection,
  editingBarId, editingBarName, editingBarCode, updatingBarId,
  newBarName, showNewBarInput,
  barToDelete, deleteConfirmationInput,
  barStatsMap,
  handleTogglePublic,
  startEditBar, cancelEditBar, saveBarEdits,
  startDeleteBar, handleDeleteBar,
  loadBarStats,
  openBarsSelection,
} = useBarManager({
  onBarSelected: async (b) => {
    setHash(b.invite_code)
    await loadBarData(b.id)
  },
})

async function handleSelectBar(b) {
  const { selectBar } = useBarManager()
  await selectBar(b)
}

async function handleCreateNewBar() {
  const { handleCreateNewBar: create } = useBarManager({
    onBarSelected: async (b) => {
      setHash(b.invite_code)
      await loadBarData(b.id)
    },
  })
  await create(initializeDefaultIngredients)
}

// ── Recherche ─────────────────────────────────────────────────────────────────
const { searchInput: searchTerm, showSuggestions: showSearchSuggestions, suggestions } = useSearchSuggestions(cocktails)

// ── Filtres ───────────────────────────────────────────────────────────────────
const {
  selectedFamilies, selectedSubSpirits, selectedSeasons,
  showOnlyMakeable, showOnlyFavorites, filterMode, abvFilter,
  selectedProfiles, selectedStyles,
  baseSpirits, liqueurFamilies, profileFilters, styleFilters, seasons,
  allFamilyLabels, allSubLabels, activeSubSpirits,
  filteredCocktails, hasActiveFilters, makeableCount,
  toggleFamily, toggleSubSpirit, toggleProfile, toggleStyle,
  toggleFilterMode, toggleMakeable, toggleFavorites,
  setAbvFilter, setSeason, clearFilters,
} = useFilters({ cocktails, barInventory, favorites, hasDrinker, locale, searchTerm })

// ── Commandes temps réel ──────────────────────────────────────────────────────
const { pendingOrdersCount, initOrdersListener, stopOrdersListener } = useOrders()

// ── Logo aléatoire ────────────────────────────────────────────────────────────
const base = import.meta.env.BASE_URL
const availableLogos = [
  `${base}margarita_square.png`,
  `${base}amaretto_sour_square.png`,
  `${base}aviation_square.png`,
  `${base}negroni_square.png`,
]
const randomLogo = ref(availableLogos[Math.floor(Math.random() * availableLogos.length)])

// ── Bars publics ──────────────────────────────────────────────────────────────
const publicBars        = ref([])
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

// ── Accès invité via code ─────────────────────────────────────────────────────
const inviteCodeInput = ref('')
const codeError       = ref('')

async function joinPublicBar(b) {
  inviteCodeInput.value = b.invite_code
  await joinByCode()
}

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
    codeError.value = locale.value === 'fr'
      ? 'Code invalide. Vérifie avec ton bartender.'
      : 'Invalid code. Check with your bartender.'
    return
  }

  guestBar.value = data
  await Promise.all([
    loadBarData(data.id),
    initDrinker(data.id),
  ])

  if (!hasDrinker.value) showDrinkerLoginModal.value = true
  setHash(code)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadBarData(barId) {
  await Promise.all([
    fetchCocktails(barId),
    fetchIngredients(barId),
    fetchMenuCards(barId),
  ])
  clearFilters()
}

function handleLogoClick() {
  if (isLoggedIn.value) {
    handleSignOut()
  } else {
    guestBar.value    = null
    cocktails.value   = []
    ingredients.value = []
    menuCards.value   = []
  }
}

async function handleSignOut() {
  await signOut()
  guestBar.value = null
  clearHash()
}

function handleOpenBarsSelection() {
  openBarsSelection()
  clearHash()
  searchTerm.value = ''
}

// ── Lien d'invitation ─────────────────────────────────────────────────────────
async function handleInvite() {
  const code = inviteCode.value || guestBar.value?.invite_code
  if (!code) return
  const url = buildShareUrl(code)
  try {
    await navigator.clipboard.writeText(url)
    showToast(locale.value === 'fr' ? 'Lien copié 🍸' : 'Link copied 🍸')
  } catch (e) {
    console.error('Erreur copie lien', e)
    showToast(locale.value === 'fr' ? 'Impossible de copier le lien' : 'Copy failed', 'error')
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function onAuthSuccess() {
  clearDrinker()
  // onAuthStateChange appelle fetchBar en parallèle — on l'attend
  // explicitement pour que currentBarId soit déjà set
  await fetchBar()
  if (!currentBarId.value) return
  await loadBarData(currentBarId.value)
}

async function handleDrinkerCreated(pseudo) {
  let result = await reconnectDrinker({ pseudo, barId: activeBarId.value })
  if (!result.success) {
    result = await createDrinker({ pseudo, barId: activeBarId.value })
  }
  if (result.success) {
    showDrinkerLoginModal.value = false
  } else {
    showToast(result.error || 'Erreur lors de la connexion', 'error')
  }
}

// ── CRUD cocktails ────────────────────────────────────────────────────────────

async function handleSaveCocktail(data) {
  try {
    const result = data.id
      ? await updateCocktail(data.id, data)
      : await createCocktail(data)

    if (!result.success) throw new Error(result.error?.message || result.error || 'Erreur inconnue')
    closeCocktailFormModal()
    showToast(locale.value === 'fr' ? '🍸 Cocktail sauvegardé' : '🍸 Cocktail saved')
  } catch (err) {
    console.error('❌ handleSaveCocktail:', err)
    showToast(`❌ ${err.message}`, 'error')
  }
}

async function handleDeleteCocktail(id) {
  const msg = locale.value === 'fr' ? 'Supprimer ce cocktail ?' : 'Delete this cocktail?'
  if (!confirm(msg)) return
  const result = await deleteCocktail(id)
  if (!result.success) {
    showToast(`❌ ${result.error}`, 'error')
  }
}

// ── CRUD cartes ───────────────────────────────────────────────────────────────

async function handleSaveCard(data) {
  const result = data.id
    ? await updateMenuCard(data.id, data)
    : await createMenuCard(data)

  if (!result.success) {
    showToast(`❌ ${result.error}`, 'error')
    return
  }
  closeCardModal()
}

async function handleDeleteCard(id) {
  const msg = locale.value === 'fr' ? 'Supprimer cette carte ?' : 'Delete this card?'
  if (!confirm(msg)) return
  const result = await deleteMenuCard(id)
  if (!result.success) showToast(`❌ ${result.error}`, 'error')
}
async function handleToggleCardVisibility(card) {
  if (!card?.id) return

  const currentlyVisible = card.is_visible !== false
  const nextVisible = !currentlyVisible

  try {
    const result = await updateMenuCard(card.id, {
      id: card.id,
      name: card.name,
      cocktail_ids: card.cocktail_ids || [],
      is_visible: nextVisible,
    })

    if (!result.success) throw new Error(result.error?.message || result.error || 'Erreur inconnue')

    showToast(locale.value === 'fr'
      ? (nextVisible ? '🗂️ Menu affiché aux drinkers' : '🙈 Menu masqué aux drinkers')
      : (nextVisible ? '🗂️ Menu shown to drinkers' : '🙈 Menu hidden from drinkers'))
  } catch (err) {
    console.error('❌ handleToggleCardVisibility:', err)
    showToast(`❌ ${err.message}`, 'error')
  }
}
// ── Import catalogue ──────────────────────────────────────────────────────────

function handleCatalogImport(newCocktail) {
  if (newCocktail) {
    cocktails.value.push(newCocktail)
    cocktails.value.sort((a, b) => a.name.localeCompare(b.name))
  }
}

// ── Scroll vers une carte cocktail ────────────────────────────────────────────

function scrollToCocktailCard(cocktailId) {
  showSearchSuggestions.value = false
  const el = document.getElementById(`cocktail-${cocktailId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.style.animation = 'pulse 0.6s ease'
    setTimeout(() => { el.style.animation = '' }, 600)
  }
}

// ── Deep link via hash ────────────────────────────────────────────────────────

function openCardFromSlug(slug) {
  if (!slug || !accessibleMenuCards.value.length) return false
  const match = accessibleMenuCards.value.find(c => slugify(c.name) === slug)
  if (!match) return false
  openCardView(match)
  return true
}

function openCocktailFromSlug(slug) {
  if (!slug || !cocktails.value.length) return false
  const match = cocktails.value.find(c => slugify(c.name) === slug)
  if (!match) return false
  openCocktailDetailModal(match)
  return true
}

// Résout les segments 2 et 3 du hash une fois les données du bar chargées.
// Le 2e segment est ambigu (carte OU cocktail direct) : on tente d'abord
// la carte, puis le cocktail en repli.
function applyDeepLink(cardSlug, cocktailSlug) {
  if (cardSlug && cocktailSlug) {
    openCardFromSlug(cardSlug)
    openCocktailFromSlug(cocktailSlug)
    return
  }
  if (cardSlug) {
    const matchedCard = openCardFromSlug(cardSlug)
    if (!matchedCard) openCocktailFromSlug(cardSlug)
  }
}

async function handleHashRoute() {
  const { inviteCode: code, cardSlug, cocktailSlug } = parseHash()
  if (!code) return
  if (guestBar.value?.invite_code === code || inviteCode.value === code) {
    applyDeepLink(cardSlug, cocktailSlug)
    return
  }
  inviteCodeInput.value = code
  await joinByCode()
  applyDeepLink(cardSlug, cocktailSlug)
}

// Sync hash ↔ carte / cocktail ouverts
function syncHash() {
  const code = inviteCode.value || guestBar.value?.invite_code
  if (!code) return
  const cardSlug     = viewingCard.value     ? slugify(viewingCard.value.name)     : null
  const cocktailSlug = viewingCocktail.value ? slugify(viewingCocktail.value.name) : null
  setHash(code, cardSlug, cocktailSlug)
}

watch(viewingCard, syncHash)
watch(viewingCocktail, syncHash)

// Écoute des commandes (bartender uniquement)
watch([activeBarId, isLoggedIn], async ([newBarId, newIsLoggedIn]) => {
  if (newIsLoggedIn && newBarId) await initOrdersListener(newBarId)
  else                           stopOrdersListener()
})

// Charger les données quand le bar bartender change (reconnexion automatique)
watch(currentBarId, async (newBarId) => {
  if (newBarId && isLoggedIn.value) {
    await loadBarData(newBarId)
  }
})

// ── Montage ───────────────────────────────────────────────────────────────────

onMounted(async () => {
  await initAuth()
  await fetchPublicBars()
  // On charge d'abord les données du bar (si bartender déjà connecté) pour
  // que handleHashRoute puisse résoudre les slugs carte/cocktail du hash.
  // (Le flux invité passe par joinByCode, qui charge lui-même les données.)
  if (currentBarId.value) {
    await Promise.all([
      loadBarData(currentBarId.value),
      initDrinker(currentBarId.value),
    ])
  }
  await handleHashRoute()
})
</script>