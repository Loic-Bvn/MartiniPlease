<template>
  <div :class="['cocktail-card-compact']">

    <!-- Header -->
    <div class="card-header">
      <div class="min-w-0 flex-1">
        <div class="cocktail-title-row">
          <h3 :class="['cocktail-title', makeable ? 'cocktail-title--available' : 'cocktail-title--unavailable']">
            {{ cocktail.name }}
          </h3>
            <span v-if="cocktail.abv != null" class="cocktail-abv-inline">{{ cocktail.abv }}°</span>
        </div>
        <div class="cocktail-meta-row cocktail-subtitle cocktail-subtitle--truncate">
            <!-- HIDE COCKTAIL CREATOR FOR NOW-->
            <!--<span v-if="cocktail.creator && cocktail.creator !== 'Unknown'" class="cocktail-creator-meta">by {{ cocktail.creator }}</span>-->
            <span v-if="cocktail.profile?.length" class="profile-tags">
              <em>{{ cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') }}</em>
            </span>
        </div>
      </div>
    </div>

    <!-- Recette -->
    <div class="recipe-compact">
      <div
        v-for="(ing, idx) in recipeWithQty"
        :key="idx"
        class="recipe-line"
      >
        <div class="ingredient-info">
          <span :class="['recipe-bullet', isAvailable(ing) ? 'recipe-bullet--available' : 'recipe-bullet--missing']">
          </span>
          <span :class="['ingredient-name', !isAvailable(ing) ? 'ingredient-name--missing' : '']">
            {{ getTypeLabel(ing.Type, locale) }}
          </span>
        </div>
        <span class="ingredient-quantity">{{ ing._qty }}</span>
      </div>
    </div>

    <!-- Footer : tags du cocktail -->
    <div class="card-footer">
      <div class="footer-left" style="display:flex; align-items:center; gap:6px;">
        <!--<span v-if="makeable" class="badge-makeable" :title="t.makeable">
          <Check :size="16" />
        </span>
        <span v-else class="badge-missing" :title="t.notMakeable">
          <XIcon :size="16" />
        </span>-->
        <span v-if="cocktail.cocktail_style" class="badge-method">
          {{ styleLabel }}
        </span>
        <!--<span v-if="cocktail.abv > 0" class="badge-method">
          {{ baseSpiritLabel }}
        </span>
        <span v-else class="badge-method">Mocktail</span>-->
        <span v-if="cocktail.method && isBartenderMode" class="badge-method">
          {{ methodLabel }}
        </span>
        <!-- <span v-if="cocktail.ice && isBartenderMode" class="badge-method">
          {{ iceLabel }}
        </span> -->
        <span v-if="cocktail.glass && isBartenderMode" class="badge-method">
          {{ glassLabel }}
        </span>
      </div>

      <div class="footer-right" style="display:flex; align-items:center; gap:6px;">
        <button
          v-if="hasDrinker && !isBartenderMode"
          @click="handleFavorite"
          :class="['btn-icon', isFav ? 'btn-icon--fav-active' : 'btn-icon--fav']"
          :title="isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        >
          <Heart :size="16" :fill="isFav ? 'currentColor' : 'none'" />
        </button>
        <button
          v-if="hasDrinker && !isBartenderMode"
          @click="handleHistoric"
          class="btn-order-simple"
          title="Commander"
        >
          <GlassWater :size="16" />
        </button>

        <template v-if="isBartenderMode">
          <button @click="$emit('edit', cocktail)" class="btn-icon btn-icon--edit">
            <Pencil :size="16" />
          </button>
          <button @click="$emit('delete', cocktail.id)" class="btn-icon btn-icon--delete">
            <Trash2 :size="16" />
          </button>
          <button
            v-if="!isSubmitted(cocktail.id)"
            @click="handleSubmit"
            class="btn-icon btn-icon--submit"
            :title="locale === 'fr' ? 'Proposer au catalogue' : 'Submit to catalog'"
          >
            <Upload :size="16" />
          </button>
          <span
            v-else
            class="btn-icon btn-icon--submitted"
            :title="locale === 'fr' ? 'Déjà proposé' : 'Already submitted'"
          >
            <Bookmark :size="16" />
          </span>
        </template>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Pencil, Trash2, Heart, PlusIcon, XIcon, GlassWater, Loader2, Check} from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import { useDrinker } from '@/composables/useDrinker'
import { useOrders } from '@/composables/useOrders'
import { getTypeLabel, getProfileLabel } from '../constants/typeLabels.js'
import { Upload, Bookmark } from 'lucide-vue-next'
import { useCatalog } from '@/composables/useCatalog'
import { useToast } from '@/composables/useToast'

const { isSubmitted, submitToCatalog } = useCatalog()
const isChecked = ref(false)
const props = defineProps({
  cocktail:        Object,
  isBartenderMode: { type: Boolean, default: false },
  locale:          { type: String, default: 'fr' },
  unit:            { type: String, default: 'oz' },
  barId:           { type: String, default: '' },
})
const { showToast } = useToast()

defineEmits(['edit', 'delete'])

const { barInventory }                             = useInventory()
const { hasDrinker, isFavorite, toggleFavorite, drinker, quickRefreshHistory } = useDrinker()
const { addOrder } = useOrders()

const t = computed(() => ({
  makeable: props.locale === 'fr' ? 'Disponible' : 'Available',
  notMakeable: props.locale === 'fr' ? 'Non disponible' : 'Not available',
}))

const baseSpiritLabel = computed(() => getTypeLabel(props.cocktail.base_spirit, props.locale))

function isAvailable(ing) {
  if (ing.Type === 'garnish') return true
  return barInventory.value.has(ing.Type)
}

const makeable = computed(() => {
  const recipe = props.cocktail.recipe || []
  return recipe.length > 0 && recipe.every(ing => isAvailable(ing))
})

const isFav = computed(() => isFavorite(props.cocktail.id))

async function handleFavorite() {
  await toggleFavorite(props.cocktail.id)
}

async function handleHistoric() {
  
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

  // Créer une commande pour le bartender
  const result = await addOrder(drinker.value, props.cocktail.id, props.barId)
  
  if (result.success) {
    await quickRefreshHistory()
    showToast('🍸 ' + props.cocktail.name + (props.locale === 'fr' ? ' commandé !' : ' ordered!'))
  } else {
    console.error('❌ Order failed:', result.error)
  }
}

function formatQty(ing) {
  if (props.unit === 'ml') {
    if (ing.Ml) return `${ing.Ml}ml`
    if (ing.Dashes) return `${ing.Dashes} dash${ing.Dashes > 1 ? 'es' : ''}`
    return ''
  }
  if (ing.Oz) return `${ing.Oz}oz`
  if (ing.Dashes) return `${ing.Dashes} dash${ing.Dashes > 1 ? 'es' : ''}`
  return ''
}

// Version réactive — recalculée quand props.unit change
const recipeWithQty = computed(() =>
  (props.cocktail.recipe || []).map(ing => ({
    ...ing,
    _qty: formatQty(ing),
  }))
)

const STYLE_LABELS = {
  sour:          '🍋 Sour',
  fizz:          '🫧 Fizz',
  highball:      '🥃 Highball',
  tiki:          '🌺 Tiki',
  negroni:       '🔴 Negroni',
  old_fashioned: '🟠 Old Fashioned',
  classic:       '🎩 Classic',
  modern:        '✨ Modern',
  creamy:        '🥛 Creamy',
  flip:          '🥚 Flip',
  spritz:        '🍾 Spritz',
}

const styleLabel = computed(() => STYLE_LABELS[props.cocktail.cocktail_style] || props.cocktail.cocktail_style)

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

const methodLabel = computed(() => METHOD_LABELS[props.cocktail.method] || props.cocktail.method)

const ICE_LABELS = {
  // cubes:       'Cubes',
  // clear:       'Clear',
  // crushed:     'Crushed',
  // none:        'None',
}
const iceLabel = computed(() => ICE_LABELS[props.cocktail.ice] || props.cocktail.ice)

const GLASS_LABELS = {
  // rocks:       'Rocks',
  // coupe:       'Coupe',
  // martini:     'Martini',
  // highball:    'Highball',
}
const glassLabel = computed(() => GLASS_LABELS[props.cocktail.glass] || props.cocktail.glass)


async function handleSubmit() {
  const { success } = await submitToCatalog(props.cocktail)
  if (success) {
    // Toast ou feedback visuel
  }
}

</script>