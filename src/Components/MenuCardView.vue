<template>
  <div class="card-view">

    <!-- Header -->
    <div class="cv-header">
      <button @click="$emit('close')" class="cv-back">
        <ArrowLeft :size="18" />
        Retour
      </button>
      <div class="cv-title-block">
        <h1 class="cv-title">{{ card.name }}</h1>
        <span class="cv-meta">{{ cardCocktails.length }} cocktail{{ cardCocktails.length > 1 ? 's' : '' }}</span>
      </div>
      <div style="width: 80px"></div>
    </div>

    <!-- Loading -->
    <div v-if="!cardCocktails.length" class="cv-empty">
      Aucun cocktail dans cette carte.
    </div>

    <!-- Cocktails groupés par catégorie -->
    <div v-else class="cv-content">
      <div v-for="group in groupedCocktails" :key="group.category" class="cv-group">

        <!-- Section title -->
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
                <span v-if="cocktail.base_spirit" class="cv-spirit">{{ cocktail.base_spirit }}</span>
                <span class="cv-seasons">{{ seasonLabel(cocktail.season) }}</span>
              </div>
            </div>

            <!-- Divider -->
            <div class="cv-divider"></div>

            <!-- Recipe -->
            <div class="cv-recipe">
              <div
                v-for="(ing, idx) in cocktail.recipe"
                :key="idx"
                class="cv-ing-row"
                :class="{ 'cv-ing-garnish': ing.Type === 'garnish' }"
              >
                <span class="cv-ing-name">{{ ing.Ingredient }}</span>
                <span class="cv-ing-qty">
                  <template v-if="ing.Oz">{{ ing.Oz }} oz</template>
                  <template v-else-if="ing.Dashes">{{ ing.Dashes }} dash{{ ing.Dashes > 1 ? 'es' : '' }}</template>
                  <template v-else-if="ing.Type === 'garnish'">garniture</template>
                </span>
              </div>
            </div>

            <!-- Footer badges -->
            <div class="cv-card-footer">
              <span v-if="cocktail.method" class="cv-badge">{{ cocktail.method }}</span>
              <span v-if="cocktail.glass" class="cv-badge">{{ cocktail.glass }}</span>
              <span v-if="cocktail.creator && cocktail.creator !== 'Unknown'" class="cv-creator">
                by {{ cocktail.creator }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  card:      { type: Object, required: true },
  cocktails: { type: Array,  default: () => [] },
})

defineEmits(['close'])

const CATEGORY_ORDER = [
  { key: 'Whiskey_Family', label: 'Whiskey',  icon: '🥃' },
  { key: 'Rum_Family',     label: 'Rhum',     icon: '🍹' },
  { key: 'Agave_Family',   label: 'Agave',    icon: '🌵' },
  { key: 'Gin',            label: 'Gin',      icon: '🌿' },
  { key: 'Vodka',          label: 'Vodka',    icon: '❄️' },
  { key: 'Brandy_Family',  label: 'Brandy',   icon: '🍇' },
  { key: 'Pisco',          label: 'Pisco',    icon: '🫙' },
  { key: 'Absinthe',       label: 'Absinthe', icon: '🌱' },
  { key: 'Chartreuse',     label: 'Chartreuse', icon: '💚' },
  { key: null,             label: 'Autres',   icon: '✨' },
]

const cardCocktails = computed(() =>
  (props.card.cocktail_ids || [])
    .map(id => props.cocktails.find(c => c.id === id))
    .filter(Boolean)
)

const groupedCocktails = computed(() => {
  const groups = []
  for (const cat of CATEGORY_ORDER) {
    const matched = cardCocktails.value.filter(c =>
      cat.key === null
        ? !CATEGORY_ORDER.slice(0, -1).some(o => o.key === c.category)
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
</script>
