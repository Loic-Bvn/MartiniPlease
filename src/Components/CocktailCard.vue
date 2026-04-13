<template>
  <div :class="['cocktail-card-compact']">

    <!-- Header -->
    <div class="card-header">
      <div class="min-w-0 flex-1">
        <h3 :class="['cocktail-title', makeable ? 'cocktail-title--available' : 'cocktail-title--unavailable']">
          {{ cocktail.name }}
        </h3>
        <div class="cocktail-meta-row cocktail-subtitle cocktail-subtitle--truncate">
            <span v-if="cocktail.creator && cocktail.creator !== 'Unknown'" class="cocktail-creator-meta">{{ cocktail.creator }}</span>
            <span v-if="cocktail.profile?.length" class="profile-tags">
              <em>{{ cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') }}</em>
            </span>
            <span v-if="cocktail.abv != null" class="cocktail-subtitle--abv">{{ cocktail.abv }}°</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="header-actions shrink-0">
        <!-- Bouton favori et historique (mode drinker uniquement) -->
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
          :class="['btn-order']"
          :title="'Ajouter à l\'historique'"
        >
          <PlusIcon :size="16" />
        </button>

        <!-- Bouton edit, delete et push (mode bartender uniquement) -->
        <template v-if="isBartenderMode">
          <button @click="$emit('edit', cocktail)" class="btn-icon btn-icon--edit">
            <Pencil :size="18" />
          </button>
          <button @click="$emit('delete', cocktail.id)" class="btn-icon btn-icon--delete">
            <Trash2 :size="18" />
          </button>
          <button
            v-if="!isSubmitted(cocktail.id)"
            @click="handleSubmit"
            class="btn-icon btn-icon--submit"
            :title="locale === 'fr' ? 'Proposer au catalog' : 'Submit to catalog'"
          >
            <Upload :size="18" />
          </button>
          <span
            v-else
            class="btn-icon btn-icon--submitted"
            :title="locale === 'fr' ? 'Déjà proposé' : 'Already submitted'"
          >
            <Bookmark :size="18" />
          </span>
        </template>
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
      <div class="footer-left">
        <span v-if="makeable" class="badge-makeable" :title="t.makeable">
          <Check :size="16" />
        </span>
        <span v-else class="badge-missing" :title="t.notMakeable">
          <XIcon :size="16" />
        </span>
      </div>

      <div class="footer-right" style="display:flex; align-items:center; gap:6px;">
        <span v-if="cocktail.cocktail_style" :class="['badge-style', 'badge-style--' + cocktail.cocktail_style]">
          {{ styleLabel }}
        </span>
        <span v-if="cocktail.abv > 0" class="badge-method">
          {{ baseSpiritLabel }}
        </span>
        <span v-else class="badge-method">Mocktail</span>
        <span v-if="cocktail.method" class="badge-method">
          {{ methodLabel }}
        </span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Pencil, Trash2, Heart, PlusIcon, Check, XIcon } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import { useDrinker } from '@/composables/useDrinker'
import { getTypeLabel, getProfileLabel } from '../constants/typeLabels.js'
import { Upload, Bookmark } from 'lucide-vue-next'
import { useCatalog } from '@/composables/useCatalog'

const { isSubmitted, submitToCatalog } = useCatalog()

const props = defineProps({
  cocktail:        Object,
  isBartenderMode: { type: Boolean, default: false },
  locale:          { type: String, default: 'fr' },
  unit:            { type: String, default: 'oz' },
})

defineEmits(['edit', 'delete'])

const { barInventory }                             = useInventory()
const { hasDrinker, isFavorite, toggleFavorite, addToHistory } = useDrinker()

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
  await addToHistory(props.cocktail.id)
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

async function handleSubmit() {
  const { success } = await submitToCatalog(props.cocktail)
  if (success) {
    // Toast ou feedback visuel
  }
}

</script>