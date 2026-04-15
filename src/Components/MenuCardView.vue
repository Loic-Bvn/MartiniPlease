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
            class="cv-card"
          >
            <!-- Card header -->
            <div class="cv-card-header">
              <div class="cv-card-title-row">
                <h2 class="cv-card-name">{{ cocktail.name }}</h2>
                <span v-if="cocktail.abv" class="cv-abv">{{ cocktail.abv }}°</span>
              </div>
              <div class="cv-card-meta">
                <span v-if="cocktail.base_spirit" class="cv-spirit">
                  {{ getTypeLabel(cocktail.base_spirit, locale) }}
                </span>
                <span v-if="cocktail.profile?.length" class="profile-tags">
                  - <em>{{ cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') }}</em>
                </span>
              </div>
            </div>

            <div class="cv-divider"></div>

            <!-- Recipe -->
            <div class="cv-recipe">
              <div
                v-for="(ing, idx) in cocktail.recipe"
                :key="idx"
                class="cv-ing-row"
                :class="{ 'cv-ing-garnish': ing.IsGarnish }"
              >
                <span class="cv-ing-name">
                  {{ (ing.IsGarnish && getTypeLabel(ing.Type, locale) === ing.Type)
                    ? ing.Ingredient
                    : getTypeLabel(ing.Type, locale) }}
                </span>
                <span class="cv-ing-qty">
                  <template v-if="unit === 'ml' && ing.Ml">{{ ing.Ml }}ml</template>
                  <template v-else-if="ing.Oz">{{ ing.Oz }}oz</template>
                  <template v-else-if="ing.Dashes">{{ ing.Dashes }} dash{{ ing.Dashes > 1 ? 'es' : '' }}</template>
                  <template v-else-if="ing.IsGarnish">{{ t.garnish }}</template>
                </span>
              </div>
            </div>

            <!-- Footer -->
            <div class="cv-card-footer">
              <span v-if="cocktail.method" class="cv-badge">{{ methodLabel(cocktail.method) }}</span>
              <span v-if="cocktail.glass" class="cv-badge">{{ cocktail.glass }}</span>
              <span v-if="cocktail.creator && cocktail.creator !== 'Unknown'" class="cv-creator">
                by {{ cocktail.creator }}
              </span>
              <button
                @click="handleHistoric(cocktail)"
                class="btn-order-simple"
                :class="{ 'is-active': isChecked }"
                title="Commander"
              >
                <transition name="tick-pop" mode="out-in">
                  <Check v-if="isChecked" :key="'check'" :size="16" />

                  <GlassWater v-else :key="'glass'" :size="16" />
                </transition>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Sun, Moon, GlassWater } from 'lucide-vue-next'
import { getTypeLabel, getProfileLabel } from '@/constants/typeLabels.js'
import { useDrinker } from '@/composables/useDrinker'
import { useOrders } from '@/composables/useOrders'

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

function seasonLabel(season) {
  const icons = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️', autumn: '🍂' }
  const s = Array.isArray(season) ? season : [season]
  return s.map(k => icons[k] || k).join(' ')
}
const { hasDrinker, drinker, quickRefreshHistory } = useDrinker()
const isChecked = ref(false)
const { addOrder } = useOrders()


async function handleHistoric(cocktail) {
  
  if (isChecked.value) {
    console.warn('⚠️ Already checked, ignoring')
    return
  }
  if (!hasDrinker.value) {
    console.warn('⚠️ No drinker')
    return
  }
  if (!drinker.value) {
    console.warn('⚠️ Drinker is null')
    return
  }
  if (!props.barId) {
    console.warn('⚠️ No barId prop')
    return
  }

  console.log('✅ All checks passed, creating order...')
  // Créer une commande pour le bartender
  const result = await addOrder(drinker.value, cocktail.id, props.barId)

  console.log('📊 Order result:', result)
  
  if (result.success) {
    // Rafraîchir rapidement l'historique du drinker
    await quickRefreshHistory()
    
    isChecked.value = true
    setTimeout(() => {
      isChecked.value = false
    }, 900)
  } else {
    console.error('❌ Order failed:', result.error)
  }
}

</script>