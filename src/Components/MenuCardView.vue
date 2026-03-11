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

<style scoped>
.card-view {
  position: fixed;
  inset: 0;
  background: #f8f7f4;
  z-index: 50;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ── Header ─────────────────────────────── */
.cv-header {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  z-index: 10;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.cv-back {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
  transition: background 0.15s, color 0.15s;
  width: 80px;
}
.cv-back:hover {
  background: #f3f4f6;
  color: #111827;
}

.cv-title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.cv-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}

.cv-meta {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

/* ── Empty ───────────────────────────────── */
.cv-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.95rem;
}

.cv-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.cv-group-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  padding-bottom: 0.6rem;
  border-bottom: 2px solid #e5e7eb;
}

.cv-group-icon {
  font-size: 1.2rem;
}

.cv-group-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
  flex: 1;
}

.cv-group-count {
  font-size: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
}

/* ── Grid ────────────────────────────────── */
.cv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* ── Cocktail card ───────────────────────── */
.cv-card {
  background: white;
  border-radius: 0.875rem;
  border: 1px solid #e5e7eb;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}
.cv-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.cv-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.cv-card-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.cv-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.cv-abv {
  font-size: 0.8rem;
  font-weight: 700;
  color: #f59e0b;
  white-space: nowrap;
  flex-shrink: 0;
}

.cv-card-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cv-spirit {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: capitalize;
}

.cv-seasons {
  font-size: 0.8rem;
}

.cv-divider {
  height: 1px;
  background: #f3f4f6;
}

/* ── Recipe ──────────────────────────────── */
.cv-recipe {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.cv-ing-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.cv-ing-garnish {
  opacity: 0.55;
}

.cv-ing-name {
  font-size: 0.85rem;
  color: #374151;
  font-weight: 500;
}

.cv-ing-qty {
  font-size: 0.78rem;
  color: #9ca3af;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Footer ──────────────────────────────── */
.cv-card-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.cv-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 9999px;
  font-weight: 500;
  text-transform: capitalize;
}

.cv-creator {
  font-size: 0.72rem;
  color: #9ca3af;
  font-style: italic;
  margin-left: auto;
}
</style>