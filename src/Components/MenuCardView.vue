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
        <div
          class="settings-switch cv-lang-switch"
          role="group"
          aria-label="Language switch"
          @click="$emit('set-locale', locale === 'fr' ? 'en' : 'fr')"
        >
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': locale === 'fr' }"
            :title="locale === 'fr' ? 'Switch to English' : 'Passer en français'"
          >
            <span>FR</span>
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': locale === 'en' }"
            :title="locale === 'fr' ? 'Switch to English' : 'Passer en français'"
          >
            <span>EN</span>
          </button>
        </div>

        <div
          class="settings-switch cv-unit-switch"
          role="group"
          aria-label="Unit switch"
          @click="$emit('set-unit', unit === 'oz' ? 'ml' : 'oz')"
        >
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': unit === 'oz' }"
            :title="unit === 'oz' ? 'Passer en ml' : 'Switch to oz'"
          >
            <span>oz</span>
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': unit === 'ml' }"
            :title="unit === 'oz' ? 'Passer en ml' : 'Switch to oz'"
          >
            <span>ml</span>
          </button>
        </div>

        <div
          class="settings-switch cv-view-toggle"
          role="group"
          aria-label="Card view switch"
          @click="$emit('set-card-view', cardView === 'compact' ? 'standard' : 'compact')"
        >
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': cardView === 'compact' }"
            :title="locale === 'fr' ? 'Vue compacte' : 'Compact view'"
          >
            <Rows3 :size="16" />
            <span class="view-toggle-label">{{ locale === 'fr' ? 'Compacte' : 'Compact' }}</span>
          </button>
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ 'view-toggle-btn--active': cardView === 'standard' }"
            :title="locale === 'fr' ? 'Vue standard' : 'Standard view'"
          >
            <GalleryVerticalEnd :size="16" />
            <span class="view-toggle-label">{{ locale === 'fr' ? 'Standard' : 'Standard' }}</span>
          </button>
        </div>

        <ThemeToggle />
      </div>
    </div>

    <!-- Empty -->
    <div v-if="!cardCocktails.length" class="cv-empty">
      {{ t.empty }}
    </div>

    <!-- Cocktails groupés par catégorie -->
    <div v-else class="cv-content">
      <div v-for="group in groupedCocktails" :key="group.category" class="cv-group">

        <div class="cv-group-header">
          <span class="cv-group-icon">{{ group.icon }}</span>
          <h2 class="cv-group-title">{{ group.label }}</h2>
          <span class="cv-group-count">{{ group.cocktails.length }}</span>
        </div>

        <div :class="['cv-grid', { 'cv-grid--standard': cardView === 'standard' }]">
          <div
            v-for="cocktail in group.cocktails"
            :key="cocktail.id"
          >
          <CocktailCard
            :cocktail="cocktail"
            :isBartenderMode="isLoggedIn"
            :show-cocktail-actions="false"
            :locale="locale"
            :unit="unit"
            :bar-id="barId"
            :view-mode="cardView"
            @edit="$emit('edit-cocktail', cocktail)"
            @delete="$emit('delete-cocktail', cocktail.id)"
            @open="handleOpenCocktail"
          />
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
import { ref, computed } from 'vue'
import { ArrowLeft, GlassWater, Rows3, GalleryVerticalEnd } from 'lucide-vue-next'
import { getTypeLabel, getProfileLabel } from '@/constants/typeLabels.js'
import { useDrinker } from '@/composables/useDrinker'
import { useOrders } from '@/composables/useOrders'
import { useToast } from '@/composables/useToast'
import { useAuth } from '@/composables/useAuth'
import CocktailCard from '@/Components/CocktailCard.vue'
import ThemeToggle from '@/Components/ThemeToggle.vue'

const props = defineProps({
  card:      { type: Object, required: true },
  cocktails: { type: Array,  default: () => [] },
  locale:    { type: String, default: 'fr' },
  unit:      { type: String, default: 'oz' },
  cardView:  { type: String, default: 'standard' },
  barId:     { type: String, default: '' },
})

const emit = defineEmits([
  'close',
  'set-locale',
  'set-unit',
  'set-card-view',
  'open-cocktail',
  'edit-cocktail',
  'delete-cocktail'
])
const t = computed(() => ({
  back:    props.locale === 'fr' ? 'Retour'                          : 'Back',
  empty:   props.locale === 'fr' ? 'Aucun cocktail dans cette carte.' : 'No cocktail in this card.',
  garnish: props.locale === 'fr' ? 'garniture'                      : 'garnish',
  others:  props.locale === 'fr' ? 'Autres'                         : 'Others',
}))

const CATEGORY_ORDER = computed(() => [
  { key: 'Whiskey',  label: 'Whiskey',               icon: '🥃' },
  { key: 'Rum',      label: props.locale === 'fr' ? 'Rhum'     : 'Rum',      icon: '🍹' },
  { key: 'Agave',    label: 'Agave',                 icon: '🌵' },
  { key: 'Gin',      label: 'Gin',                   icon: '🌿' },
  { key: 'Vodka',    label: 'Vodka',                 icon: '❄️' },
  { key: 'Brandy',   label: 'Brandy',                icon: '🍇' },
  { key: 'Absinthe', label: 'Absinthe',              icon: '🌱' },
  { key: 'Aquavit',  label: 'Aquavit',               icon: '🌾' },
  { key: 'Pastis',   label: 'Pastis',                icon: '⭐' },
  { key: null,       label: t.value.others,          icon: '🍸' },
])

const METHOD_LABELS = {
  shake:       '🍸 Shake',
  regal_shake: '🍸 Regal Shake',
  stir:        '🥄 Stir',
  regal_stir:  '🥄 Regal Stir',
  build:       '🫗 Build',
  blend:       '🌀 Blend',
  swizzle:     '🌿 Swizzle',
  throw:       '🤹 Throw',
}

function methodLabel(method) {
  return METHOD_LABELS[method] || method
}

const cardCocktails = computed(() =>
  (props.card.cocktail_ids || [])
    .map(id => props.cocktails.find(c => c.id === id))
    .filter(Boolean)
)

const groupedCocktails = computed(() => {
  const order = CATEGORY_ORDER.value
  const groups = []
  for (const cat of order) {
    const matched = cardCocktails.value.filter(c =>
      cat.key === null
        ? !order.slice(0, -1).some(o => o.key === c.category)
        : c.category === cat.key
    )
    if (matched.length) {
      groups.push({ ...cat, cocktails: matched })
    }
  }
  return groups
})

const { isLoggedIn } = useAuth()
const { hasDrinker, drinker, quickRefreshHistory } = useDrinker()
const checkedIds = ref(new Set())
const { addOrder } = useOrders()
const { showToast, toastMessage } = useToast()

async function handleHistoric(cocktail) {
  if (!cocktail?.id) return
  if (checkedIds.value.has(cocktail.id)) return
  if (!hasDrinker.value || !drinker.value || !props.barId) return

  const result = await addOrder(drinker.value, cocktail.id, props.barId)

  if (result.success) {
    await quickRefreshHistory()
    showToast('🍸 ' + cocktail.name + (props.locale === 'fr' ? ' commandé !' : ' ordered!'))
    checkedIds.value = new Set([...checkedIds.value, cocktail.id])
    setTimeout(() => {
      const next = new Set(checkedIds.value)
      next.delete(cocktail.id)
      checkedIds.value = next
    }, 900)
  }
}

function handleOpenCocktail(cocktail, rect) {
  emit('open-cocktail', cocktail, rect)
}
</script>