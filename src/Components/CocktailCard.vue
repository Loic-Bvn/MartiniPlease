<template>
  <div :class="['cocktail-card-compact', !makeable ? 'opacity-60' : '']">

    <!-- Header -->
    <div class="card-header flex items-start w-full">
      <div class="min-w-0 flex-1">
        <h3 :class="['cocktail-title', makeable ? 'text-gray-800' : 'text-gray-400']">
          {{ cocktail.name }}
        </h3>
        <div class="flex items-center justify-between w-full pr-2">
          <p class="cocktail-subtitle">
            {{ cocktail.base_spirit }} · {{ seasonLabel }}
          </p>
          <span class="cocktail-subtitle shrink-0">
            {{ cocktail.abv }}°
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="header-actions shrink-0">
        <template v-if="isBartenderMode">
          <button @click="$emit('edit', cocktail)" class="btn-icon text-gray-400 hover:text-blue-500">
            <Pencil :size="18" />
          </button>
          <button @click="$emit('delete', cocktail.id)" class="btn-icon text-gray-400 hover:text-red-500">
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
          <span
            v-if="ing.Type !== 'garnish'"
            :class="['status-dot', isAvailable(ing) ? 'status-available' : 'status-missing']"
          ></span>
          <span :class="[
            'ingredient-name',
            ing.Type !== 'garnish' && !isAvailable(ing) ? 'text-red-600' : 'text-gray-700'
          ]">
            {{ ing.Ingredient }}
          </span>
        </div>
        <span class="ingredient-quantity">
          <span v-if="ing.Oz">{{ ing.Oz }}oz</span>
        </span>
      </div>
    </div>

    <!-- Badge réalisable + méthode -->
    <div class="card-footer">
      <div class="footer-left">
        <span v-if="makeable" class="badge-makeable">✓ Réalisable</span>
        <span v-else class="badge-missing">{{ missingCount }} ingrédient{{ missingCount > 1 ? 's' : '' }} manquant{{ missingCount > 1 ? 's' : '' }}</span>
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

const props = defineProps({
  cocktail:        Object,
  isBartenderMode: { type: Boolean, default: false },
})

defineEmits(['edit', 'delete'])

const { barInventory } = useInventory()

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

const seasonLabel = computed(() => {
  const icons = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️' }
  const s = props.cocktail.season || []
  return Array.isArray(s)
    ? s.map(k => icons[k] || k).join(' ')
    : (icons[s] || s)
})
</script>

<style scoped>
.badge-makeable {
  font-size: 0.75rem;
  color: #16a34a;
  font-weight: 500;
}
.badge-missing {
  font-size: 0.75rem;
  color: #dc2626;
}
.badge-method {
  font-size: 0.7rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}
.card-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-left {
  display: flex;
  align-items: center;
}
</style>