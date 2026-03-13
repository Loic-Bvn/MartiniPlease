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
            - {{ cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') }}
          </span>
          </p>
          <span class="cocktail-subtitle" style="margin-left: auto;">
            {{ cocktail.abv }}°
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="header-actions shrink-0">
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
        v-for="(ing, idx) in cocktail.recipe"
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
        <span class="ingredient-quantity">
          <span v-if="ing.Oz">{{ ing.Oz }}oz</span>
          <span v-else-if="ing.Dashes">{{ ing.Dashes }} dash{{ ing.Dashes > 1 ? 'es' : '' }}</span>
        </span>
      </div>
    </div>

    <!-- Badge réalisable + méthode -->
    <div class="card-footer">
      <div class="footer-left">
        <span v-if="makeable" class="badge-makeable">{{ t.makeable }}</span>
        <span v-else class="badge-missing">{{ missingLabel }}</span>
      </div>
      <span v-if="cocktail.method" class="badge-method">
        {{ methodLabel }}
      </span>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import { getTypeLabel, getProfileLabel } from '../constants/typeLabels.js'

const props = defineProps({
  cocktail:        Object,
  isBartenderMode: { type: Boolean, default: false },
  locale:          { type: String, default: 'fr' },
})

defineEmits(['edit', 'delete'])

const { barInventory } = useInventory()

const t = computed(() => ({
  makeable: props.locale === 'fr' ? '✓ Réalisable' : '✓ Available',
}))

const missingLabel = computed(() => {
  const n = missingCount.value
  if (props.locale === 'fr') {
    return `${n} ingrédient${n > 1 ? 's' : ''} manquant${n > 1 ? 's' : ''}`
  } else {
    return `${n} missing ingredient${n > 1 ? 's' : ''}`
  }
})

const baseSpiritLabel = computed(() =>
  getTypeLabel(props.cocktail.base_spirit, props.locale)
)

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

const methodLabel = computed(() =>
  METHOD_LABELS[props.cocktail.method] || props.cocktail.method
)
</script>