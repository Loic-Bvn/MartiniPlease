<template>
  <div :class="['cocktail-card-compact', !makeable ? 'opacity-60' : '']">

    <!-- Header -->
    <div class="card-header">
      <div class="min-w-0 flex-1">
        <h3 :class="['cocktail-title', makeable ? 'cocktail-title--available' : 'cocktail-title--unavailable']">
          {{ cocktail.name }}
        </h3>
        <div class="cocktail-meta-row">
          <p class="cocktail-subtitle">
            {{ cocktail.abv > 0 ? baseSpiritLabel : 'Mocktail' }}
            <span v-if="cocktail.profile?.length" class="profile-tags">
              - <em>{{ cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') }}</em>
            </span>
          </p>
          <span class="cocktail-subtitle" style="margin-left: auto;">
            {{ cocktail.abv }}°
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="header-actions shrink-0">
        <!-- Bouton favori (mode drinker uniquement) -->
        <button
          v-if="hasDrinker && !isBartenderMode"
          @click="handleFavorite"
          :class="['btn-icon', isFav ? 'btn-icon--fav-active' : 'btn-icon--fav']"
          :title="isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        >
          <Heart :size="16" :fill="isFav ? 'currentColor' : 'none'" />
        </button>

        <template v-if="isBartenderMode">
          <button @click="$emit('edit', cocktail)" class="btn-icon btn-icon--edit">
            <Pencil :size="18" />
          </button>
          <button @click="$emit('delete', cocktail.id)" class="btn-icon btn-icon--delete">
            <Trash2 :size="18" />
          </button>
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
          <span :class="['recipe-bullet', ing.Type === 'garnish' ? 'recipe-bullet--garnish' : isAvailable(ing) ? 'recipe-bullet--available' : 'recipe-bullet--missing']">
          </span>
          <span :class="[
            'ingredient-name',
            ing.IsGarnish ? 'ingredient-name--garnish' : '',
            !ing.IsGarnish && !isAvailable(ing) ? 'ingredient-name--missing' : ''
          ]">
            {{ (ing.Type === 'garnish' && getTypeLabel(ing.Type, locale) === ing.Type)
            ? ing.Ingredient
            : getTypeLabel(ing.Type, locale) }}
          </span>
        </div>
        <span class="ingredient-quantity">{{ ing._qty }}</span>
      </div>
    </div>

    <!-- Footer : badge réalisable + méthode + bouton commander -->
    <div class="card-footer">
      <div class="footer-left">
        <span v-if="makeable" class="badge-makeable">{{ t.makeable }}</span>
        <span v-else class="badge-missing">{{ missingLabel }}</span>
      </div>
      <div class="footer-right" style="display:flex; align-items:center; gap:8px;">
        <!-- Bouton "J'ai commandé" (mode drinker uniquement) -->
        <button
          v-if="hasDrinker && !isBartenderMode"
          @click="handleOrder"
          class="btn-order"
          :class="{ 'btn-order--done': justOrdered }"
          :title="locale === 'fr' ? 'J\'ai commandé ça !' : 'I ordered this!'"
        >
          {{ justOrdered ? '✓' : '＋' }}
        </button>
        <span v-if="cocktail.method" class="badge-method">
          {{ methodLabel }}
        </span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Pencil, Trash2, Heart } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import { useDrinker } from '@/composables/useDrinker'
import { getTypeLabel, getProfileLabel } from '../constants/typeLabels.js'

const props = defineProps({
  cocktail:        Object,
  isBartenderMode: { type: Boolean, default: false },
  locale:          { type: String, default: 'fr' },
  unit:            { type: String, default: 'oz' },
})

defineEmits(['edit', 'delete'])

const { barInventory }                             = useInventory()
const { hasDrinker, isFavorite, toggleFavorite, addToHistory } = useDrinker()

const justOrdered = ref(false)

const t = computed(() => ({
  makeable: props.locale === 'fr' ? '✓ Réalisable' : '✓ Available',
}))

const missingLabel = computed(() => {
  const n = missingCount.value
  if (props.locale === 'fr') return `${n} ingrédient${n > 1 ? 's' : ''} manquant${n > 1 ? 's' : ''}`
  return `${n} missing ingredient${n > 1 ? 's' : ''}`
})

const baseSpiritLabel = computed(() => getTypeLabel(props.cocktail.base_spirit, props.locale))

function isAvailable(ing) {
  if (ing.Type === 'garnish') return true
  return barInventory.value.has(ing.Type)
}

const makeable = computed(() => {
  const recipe = props.cocktail.recipe || []
  return recipe.length > 0 && recipe.every(ing => isAvailable(ing))
})

const missingCount = computed(() =>
  (props.cocktail.recipe || []).filter(ing =>
    ing.Type !== 'garnish' && !barInventory.value.has(ing.Type)
  ).length
)

const isFav = computed(() => isFavorite(props.cocktail.id))

async function handleFavorite() {
  await toggleFavorite(props.cocktail.id)
}

async function handleOrder() {
  await addToHistory(props.cocktail.id)
  justOrdered.value = true
  setTimeout(() => { justOrdered.value = false }, 2000)
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
</script>

<style scoped>
.btn-icon--fav {
  color: var(--color-text-secondary);
  transition: color 0.15s;
}
.btn-icon--fav:hover {
  color: #e05c6e;
}
.btn-icon--fav-active {
  color: #e05c6e;
}

.btn-order {
  font-size: 14px;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}
.btn-order:hover {
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}
.btn-order--done {
  background: #1a7a4a;
  border-color: #1a7a4a;
  color: #fff;
}
</style>