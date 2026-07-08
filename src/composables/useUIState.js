// composables/useUIState.js
// Centralise l'état purement UI de l'application :
// modals, locale, unité de mesure, page légale active.
//
// ⚠️  SINGLETON : les ref sont au niveau module → état partagé dans toute l'appli.
//     Adapté à une SPA mono-instance. Pour des tests isolés, déplace les ref
//     à l'intérieur de la fonction useUIState().

import { ref } from 'vue'

// ── Préférences utilisateur ───────────────────────────────────────────────────
const locale = ref('fr')   // 'fr' | 'en'
const unit   = ref('oz')   // 'oz' | 'ml'

// ── Page légale ───────────────────────────────────────────────────────────────
const currentLegalPage = ref(null)  // null | 'legal-notice' | 'privacy-policy' | 'terms-of-use' | 'cookies-policy'

// ── Modals ────────────────────────────────────────────────────────────────────
const showAuthModal         = ref(false)
const showCocktailFormModal     = ref(false)
const showCardModal         = ref(false)
const showCatalogModal      = ref(false)
const showDrinkerLoginModal = ref(false)

// ── Contenu édité ─────────────────────────────────────────────────────────────
const editingCocktail = ref(null)
const editingCard     = ref(null)
const viewingCard     = ref(null)
const viewingCocktail = ref(null)
const viewingCocktailRect = ref(null)

// ── Divers ────────────────────────────────────────────────────────────────────
const burgerOpen = ref(false)

export function useUIState() {

  // ── Locale & unité ──────────────────────────────────────────────────────────

  function toggleLocale() {
    locale.value = locale.value === 'fr' ? 'en' : 'fr'
  }

  function toggleUnit() {
    unit.value = unit.value === 'oz' ? 'ml' : 'oz'
  }

  // ── Pages légales ───────────────────────────────────────────────────────────

  function openLegalPage(page) {
    currentLegalPage.value = page
    window.scrollTo(0, 0)
  }

  function closeLegalPage() {
    currentLegalPage.value = null
    window.scrollTo(0, 0)
  }

  // ── Modals cocktail ─────────────────────────────────────────────────────────

  function openNewCocktailFormModal() {
    editingCocktail.value  = null
    showCocktailFormModal.value = true
  }

  function openEditCocktailFormModal(cocktail) {
    editingCocktail.value  = cocktail
    showCocktailFormModal.value = true
  }

  function closeCocktailFormModal() {
    showCocktailFormModal.value = false
    editingCocktail.value   = null
  }

  // ── Modals cartes ───────────────────────────────────────────────────────────

  function openNewCardModal() {
    editingCard.value  = null
    showCardModal.value = true
  }

  function openEditCardModal(card) {
    editingCard.value  = card
    showCardModal.value = true
  }

  function closeCardModal() {
    showCardModal.value = false
    editingCard.value   = null
  }

  // ── Vue carte ───────────────────────────────────────────────────────────────

  function openCardView(card) {
    viewingCard.value = card
  }

  function closeCardView() {
    viewingCard.value = null
  }

  function openCocktailDetailModal(cocktail, originRect = null) {
    viewingCocktail.value = cocktail
    viewingCocktailRect.value = originRect
  }

  function closeCocktailDetailModal() {
    viewingCocktail.value = null
    viewingCocktailRect.value = null
  }

  return {
    // État
    locale,
    unit,
    currentLegalPage,
    showAuthModal,
    showCocktailFormModal,
    showCardModal,
    showCatalogModal,
    showDrinkerLoginModal,
    editingCocktail,
    editingCard,
    viewingCard,
    viewingCocktail,
    viewingCocktailRect,
    burgerOpen,

    // Actions
    toggleLocale,
    toggleUnit,
    openLegalPage,
    closeLegalPage,
    openNewCocktailFormModal,
    openEditCocktailFormModal,
    closeCocktailFormModal,
    openNewCardModal,
    openEditCardModal,
    closeCardModal,
    openCardView,
    closeCardView,
    openCocktailDetailModal,
    closeCocktailDetailModal,
  }
}