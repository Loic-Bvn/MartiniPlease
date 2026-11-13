<template>
  <div class="card-view">

    <!-- Header -->
    <div class="cv-header">
      <button @click="$emit('close')" class="cv-back">
        <ArrowLeft :size="18" />
        <span class="cv-back-label">{{ t.back }}</span>
      </button>
      <div class="cv-title-block">
        <h1 class="cv-title">{{ card.name }}</h1>
        <span class="cv-meta">{{ cardCocktails.length }} cocktail{{ cardCocktails.length > 1 ? 's' : '' }}</span>
      </div>
      <div class="cv-header-actions">
        <SegmentedSwitch
          class="cv-lang-switch"
          :model-value="locale"
          :options="localeOptions"
          aria-label="Language switch"
          @update:model-value="$emit('set-locale', $event)"
        />

        <SegmentedSwitch
          class="cv-unit-switch"
          :model-value="unit"
          :options="unitOptions"
          aria-label="Unit switch"
          @update:model-value="$emit('set-unit', $event)"
        />

        <ThemeToggle />

        <SegmentedSwitch
          class="cv-view-toggle"
          :model-value="cardView"
          :options="cardViewOptions"
          aria-label="Card view switch"
          @update:model-value="$emit('set-card-view', $event)"
        />
      </div>
    </div>

    <section
      v-if="isLoggedIn"
      :class="['cv-add-cocktails', { 'cv-add-cocktails--open': showAddCocktails }]"
    >
      <div class="cv-add-toolbar">
        <button
          type="button"
          role="switch"
          class="cv-menu-lock"
          :class="{ 'cv-menu-lock--locked': isMenuLocked }"
          :aria-checked="isMenuLocked"
          :aria-label="isMenuLocked ? t.unlockMenu : t.lockMenu"
          :title="isMenuLocked ? t.unlockMenu : t.lockMenu"
          @click="toggleMenuLock"
        >
          <component :is="isMenuLocked ? Lock : Unlock" :size="15" />
          <span>{{ isMenuLocked ? t.locked : t.unlocked }}</span>
        </button>
        <button
          type="button"
          class="cv-add-toggle"
          :disabled="isMenuLocked"
          :aria-expanded="showAddCocktails"
          aria-controls="cv-add-cocktail-list"
          @click="showAddCocktails = !showAddCocktails"
        >
          <Plus :size="16" />
          {{ showAddCocktails ? t.closeAddCocktails : t.addCocktail }}
          <ChevronDown :size="15" :class="{ 'cv-add-toggle-icon--open': showAddCocktails }" />
        </button>
      </div>

      <div v-if="showAddCocktails" id="cv-add-cocktail-list" class="cv-add-panel">
        <label class="cv-add-search">
          <Search :size="15" aria-hidden="true" />
          <input
            v-model="addCocktailSearch"
            type="search"
            :placeholder="t.searchCocktails"
            :aria-label="t.searchCocktails"
          />
        </label>

        <p v-if="!availableCocktails.length" class="cv-add-empty">
          {{ addCocktailSearch.trim() ? t.noCocktailMatch : t.allCocktailsAdded }}
        </p>
        <div v-else class="cv-add-list">
          <button
            v-for="cocktail in availableCocktails"
            :key="cocktail.id"
            type="button"
            class="cv-add-option"
            :disabled="Boolean(updatingCocktailId)"
            @click="$emit('add-cocktail-to-card', cocktail.id)"
          >
            <span>{{ cocktail.name }}</span>
            <Plus :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <!-- Empty -->
    <div v-if="!cardCocktails.length" class="cv-empty">
      {{ t.empty }}
    </div>

    <!-- Cocktails groupés par catégorie -->
    <div v-else class="cv-content">
        <div v-for="group in groupedCocktails" :key="group.key ?? 'others'" class="cv-group">

        <div class="cv-group-header">
          <component :is="group.icon" :size="16" class="cv-group-icon" />
          <h2 class="cv-group-title">{{ group.label }}</h2>
          <span class="cv-group-count">{{ group.cocktails.length }}</span>
        </div>

        <div :class="['cv-grid', { 'cv-grid--standard': cardView === 'standard' }]">
          <div
            v-for="cocktail in group.cocktails"
            :key="cocktail.id"
            :class="['cv-cocktail-item', { 'cv-cocktail-item--editable': isLoggedIn && !isMenuLocked }]"
          >
          <CocktailCard
            :cocktail="cocktail"
            :card-id="card.id"
            :isBartenderMode="isLoggedIn"
            :show-cocktail-actions="false"
            :locale="locale"
            :unit="unit"
            :bar-id="barId"
            :view-mode="cardView"
            :is-cocktail-of-moment="cocktail.id === cocktailOfMomentId"
            @edit="$emit('edit-cocktail', cocktail)"
            @delete="$emit('delete-cocktail', cocktail.id)"
            @open="handleOpenCocktail"
          />
          <button
            v-if="isLoggedIn && !isMenuLocked"
            type="button"
            class="cv-remove-cocktail"
            :disabled="Boolean(updatingCocktailId)"
            :aria-label="locale === 'fr' ? 'Retirer de cette carte' : 'Remove from this menu'"
            :title="locale === 'fr' ? 'Retirer de cette carte' : 'Remove from this menu'"
            @click.stop="$emit('remove-cocktail-from-card', cocktail.id)"
          >
            <X :size="16" />
          </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast local téléporté hors du stacking context de card-view -->
  <Teleport to="body">
    <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, Rows3, GalleryVerticalEnd, X, Plus, Search, ChevronDown, Lock, Unlock } from 'lucide-vue-next'
import { spiritIcons } from '@/utils/lucideIcons'
import { useToast } from '@/composables/useToast'
import { useAuth } from '@/composables/useAuth'
import CocktailCard from '@/Components/CocktailCard.vue'
import ThemeToggle from '@/Components/ThemeToggle.vue'
import SegmentedSwitch from '@/Components/SegmentedSwitch.vue'
import { getCocktailCategory, isMocktail } from '@/lib/cocktail-constants'

const props = defineProps({
  card:      { type: Object, required: true },
  cocktails: { type: Array,  default: () => [] },
  locale:    { type: String, default: 'fr' },
  unit:      { type: String, default: 'oz' },
  cardView:  { type: String, default: 'standard' },
  barId:     { type: String, default: '' },
  cocktailOfMomentId: { type: String, default: null },
  updatingCocktailId: { type: String, default: null },
})

const emit = defineEmits([
  'close',
  'set-locale',
  'set-unit',
  'set-card-view',
  'open-cocktail',
  'edit-cocktail',
  'delete-cocktail',
  'remove-cocktail-from-card',
  'add-cocktail-to-card',
])

// Options des SegmentedSwitch du header (title = action déclenchée par le clic)
const localeTitle = computed(() => props.locale === 'fr' ? 'Switch to English' : 'Passer en français')
const localeOptions = computed(() => [
  { value: 'fr', label: 'FR', title: localeTitle.value },
  { value: 'en', label: 'EN', title: localeTitle.value },
])
const unitTitle = computed(() => props.unit === 'oz' ? 'Passer en ml' : 'Switch to oz')
const unitOptions = computed(() => [
  { value: 'oz', label: 'oz', title: unitTitle.value },
  { value: 'ml', label: 'ml', title: unitTitle.value },
])
const cardViewOptions = computed(() => [
  { value: 'compact',  icon: Rows3,              label: props.locale === 'fr' ? 'Compacte' : 'Compact',
    title: props.locale === 'fr' ? 'Vue compacte' : 'Compact view' },
  { value: 'standard', icon: GalleryVerticalEnd, label: 'Standard',
    title: props.locale === 'fr' ? 'Vue standard' : 'Standard view' },
])

const t = computed(() => ({
  back:    props.locale === 'fr' ? 'Retour'                          : 'Back',
  empty:   props.locale === 'fr' ? 'Aucun cocktail dans cette carte.' : 'No cocktail in this card.',
  addCocktail: props.locale === 'fr' ? 'Ajouter un cocktail' : 'Add a cocktail',
  closeAddCocktails: props.locale === 'fr' ? 'Fermer la liste' : 'Close list',
  searchCocktails: props.locale === 'fr' ? 'Rechercher un cocktail...' : 'Search cocktails...',
  allCocktailsAdded: props.locale === 'fr' ? 'Tous les cocktails sont déjà dans cette carte.' : 'All cocktails are already in this menu.',
  noCocktailMatch: props.locale === 'fr' ? 'Aucun cocktail correspondant.' : 'No matching cocktails.',
  lockMenu: props.locale === 'fr' ? 'Verrouiller les modifications' : 'Lock menu editing',
  unlockMenu: props.locale === 'fr' ? 'Déverrouiller les modifications' : 'Unlock menu editing',
  locked: props.locale === 'fr' ? 'Verrouillé' : 'Locked',
  unlocked: props.locale === 'fr' ? 'Déverrouillé' : 'Unlocked',
  garnish: props.locale === 'fr' ? 'garniture'                      : 'garnish',
  others:  props.locale === 'fr' ? 'Autres'                         : 'Others',
  mocktails: props.locale === 'fr' ? 'Mocktails (sans alcool)' : 'Mocktails (alcohol-free)',
}))

const CATEGORY_ORDER = computed(() => [
  { key: 'whiskey',  label: 'Whiskey',               icon: spiritIcons.whiskey },
  { key: 'rum',      label: props.locale === 'fr' ? 'Rhum'     : 'Rum',      icon: spiritIcons.rum },
  { key: 'agave',    label: 'Agave',                 icon: spiritIcons.agave },
  { key: 'gin',      label: 'Gin',                   icon: spiritIcons.gin },
  { key: 'vodka',    label: 'Vodka',                 icon: spiritIcons.vodka },
  { key: 'brandy',   label: 'Brandy',                icon: spiritIcons.brandy },
  { key: 'absinthe', label: 'Absinthe',              icon: spiritIcons.absinthe },
  { key: 'aquavit',  label: 'Aquavit',               icon: spiritIcons.aquavit },
  { key: 'pastis',   label: 'Pastis',                icon: spiritIcons.pastis },
  { key: 'mocktail', label: t.value.mocktails,       icon: spiritIcons.mocktail },
  { key: null,       label: t.value.others,          icon: spiritIcons.others },
])

const cardCocktails = computed(() =>
  (props.card.cocktail_ids || [])
    .map(id => props.cocktails.find(c => c.id === id))
    .filter(Boolean)
)
const showAddCocktails = ref(false)
const addCocktailSearch = ref('')
const isMenuLocked = ref(true)
const availableCocktails = computed(() => {
  const includedIds = new Set(props.card.cocktail_ids || [])
  const search = addCocktailSearch.value.trim().toLocaleLowerCase()

  return props.cocktails
    .filter(cocktail =>
      !includedIds.has(cocktail.id) &&
      (cocktail.name || '').toLocaleLowerCase().includes(search)
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const groupedCocktails = computed(() => {
  const order = CATEGORY_ORDER.value
  // Familles de spirits uniquement (ni "mocktail" ni "Autres")
  const spiritKeys = order.filter(o => o.key && o.key !== 'mocktail').map(o => o.key)
  const groups = []
  for (const cat of order) {
    const matched = cardCocktails.value.filter(c => {
      if (cat.key === 'mocktail') return isMocktail(c)
      if (isMocktail(c)) return false            // un mocktail n'apparait que dans sa section
      return cat.key === null
        ? !spiritKeys.includes(getCocktailCategory(c))
        : getCocktailCategory(c) === cat.key
    })
    if (matched.length) {
      groups.push({ ...cat, cocktails: matched })
    }
  }
  return groups
})

const { isLoggedIn } = useAuth()
const { toastMessage } = useToast()

function toggleMenuLock() {
  isMenuLocked.value = !isMenuLocked.value
  if (isMenuLocked.value) showAddCocktails.value = false
}

function handleOpenCocktail(cocktail, rect, cardId = props.card.id) {
  emit('open-cocktail', cocktail, rect, cardId)
}
</script>