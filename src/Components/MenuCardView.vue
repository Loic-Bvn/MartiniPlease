<template>
  <div class="card-view">

    <!-- Header -->
    <div class="cv-header">
      <button @click="$emit('close')" class="cv-back">
        <ArrowLeft :size="18" />
        {{ t.back }}
      </button>
      <div class="cv-title-block">
        <h1 class="cv-title">{{ card.name }}</h1>
        <span class="cv-meta">{{ cardCocktails.length }} cocktail{{ cardCocktails.length > 1 ? 's' : '' }}</span>
      </div>
      <div class="cv-header-actions">
        <button @click="$emit('toggle-locale')" class="btn-mode btn-mode-inactive">
          {{ locale === 'fr' ? '🇬🇧' : '🇫🇷' }}
        </button>
        <button @click="$emit('toggle-unit')" class="btn-mode btn-mode-inactive">
          {{ unit === 'oz' ? 'ml' : 'oz' }}
        </button>
        <button @click="toggleDark" class="btn-mode btn-mode-inactive">
          <Sun v-if="isDark" :size="16" />
          <Moon v-else :size="16" />
        </button>
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

        <div class="cv-grid">
          <div
            v-for="cocktail in group.cocktails"
            :key="cocktail.id"
          >
          <CocktailCard
            :cocktail="cocktail"
            :isBartenderMode="isLoggedIn"
            :locale="locale"
            :unit="unit"
            :bar-id="activeBarId"
            @edit="$emit('edit-cocktail', cocktail)"
            @delete="$emit('delete-cocktail', cocktail.id)"
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
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Sun, Moon, GlassWater } from 'lucide-vue-next'
import { getTypeLabel, getProfileLabel } from '@/constants/typeLabels.js'
import { useDrinker } from '@/composables/useDrinker'
import { useOrders } from '@/composables/useOrders'
import { useToast } from '@/composables/useToast'
import CocktailCard from '@/Components/CocktailCard.vue'

const props = defineProps({
  card:      { type: Object, required: true },
  cocktails: { type: Array,  default: () => [] },
  locale:    { type: String, default: 'fr' },
  unit:      { type: String, default: 'oz' },
  barId:     { type: String, default: '' },
})

defineEmits(['close', 'toggle-locale', 'toggle-unit'])

// Dark mode — même logique que ThemeToggle
const isDark = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
})

function toggleDark() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}

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
</script>