<template>
  <Teleport to="body">
    <div class="spirit-library-overlay" @click.self="emit('close')">
      <section
        ref="dialogRef"
        class="spirit-library"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spirit-library-title"
      >
        <header class="library-header">
          <div>
            <p class="library-eyebrow">{{ text.eyebrow }}</p>
            <h2 id="spirit-library-title">{{ text.title }}</h2>
            <p class="library-intro">{{ text.intro }}</p>
          </div>
          <button type="button" class="library-close" :aria-label="text.close" @click="emit('close')">
            <X :size="20" />
          </button>
        </header>

        <div class="library-toolbar">
          <label class="library-search">
            <Search :size="17" aria-hidden="true" />
            <input v-model="search" type="search" :placeholder="text.search" />
          </label>
          <div class="library-tabs" role="tablist" :aria-label="text.categories">
            <button
              v-for="category in categoryOptions"
              :key="category.key"
              type="button"
              role="tab"
              :aria-selected="activeCategory === category.key"
              :class="{ active: activeCategory === category.key }"
              @click="activeCategory = category.key"
            >
              {{ category.label }}
            </button>
          </div>
        </div>

        <div :class="['library-content', { 'library-content--details-open': showBottleDetails }]">
          <p v-if="!shelves.length" class="library-empty">{{ text.empty }}</p>
          <template v-else>
            <!-- Zone des étagères -->
            <div class="shelves-container">
              <section
                v-for="shelf in shelves"
                :key="shelf.key"
                class="shelf-unit"
                :aria-label="shelf.label"
              >
                <div class="shelf-header">
                  <h3 class="shelf-title">{{ shelf.label }}</h3>
                  <span class="shelf-count">{{ shelf.bottles.length }}</span>
                </div>

                <div class="shelf-row">
                  <button
                    v-for="bottle in shelf.bottles"
                    :key="bottle.id"
                    type="button"
                    :aria-label="bottle.displayName"
                    :title="bottle.displayName"
                    :class="['bottle-item', { selected: selectedBottle?.id === bottle.id }]"
                    @click="openBottleDetails(bottle)"
                  >
                    <!-- Objet bouteille en SVG (dimensions garanties, impossible à écraser) -->
                    <div class="bottle-figure">
                      <svg
                        viewBox="0 0 60 120"
                        width="54"
                        height="108"
                        class="bottle-svg"
                        aria-hidden="true"
                      >
                        <!-- Silhouette : Bouteille carrée (Whisky / Cognac) -->
                        <template v-if="bottle.visual.shape === 'square'">
                          <rect x="23" y="4" width="14" height="8" rx="2" fill="#b89548" />
                          <rect x="24" y="12" width="12" height="22" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" />
                          <path d="M24 34 L10 44 L10 112 Q10 116 14 116 L46 116 Q50 116 50 112 L50 44 L36 34 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" stroke-width="1.4" />
                          <path d="M12 52 L48 52 L48 112 Q48 114 46 114 L14 114 Q12 114 12 112 Z" :fill="bottle.visual.color" />
                        </template>

                        <!-- Silhouette : Bouteille ronde / trapue (Rhum / Liqueur) -->
                        <template v-else-if="bottle.visual.shape === 'round'">
                          <rect x="23" y="6" width="14" height="8" rx="2" fill="#b89548" />
                          <rect x="24" y="14" width="12" height="22" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" />
                          <path d="M24 36 C12 40 9 52 9 66 L9 110 Q9 116 15 116 L45 116 Q51 116 51 110 L51 66 C51 52 48 40 36 36 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" stroke-width="1.4" />
                          <path d="M11 56 L49 56 L49 110 Q49 114 45 114 L15 114 Q11 114 11 110 Z" :fill="bottle.visual.color" />
                        </template>

                        <!-- Silhouette : Bouteille haute classique (Gin / Vodka / Mezcal / Vermouth) -->
                        <template v-else>
                          <rect x="24" y="2" width="12" height="9" rx="2" fill="#b89548" />
                          <rect x="25" y="11" width="10" height="25" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" />
                          <path d="M25 36 C16 39 13 46 13 55 L13 112 Q13 116 17 116 L43 116 Q47 116 47 112 L47 55 C47 46 44 39 35 36 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" stroke-width="1.4" />
                          <path d="M15 54 L45 54 L45 112 Q45 114 43 114 L17 114 Q15 114 15 112 Z" :fill="bottle.visual.color" />
                        </template>

                        <!-- Reflet de verre sur le côté gauche -->
                        <line x1="17" y1="54" x2="17" y2="108" stroke="rgba(255,255,255,0.28)" stroke-width="2" stroke-linecap="round" />

                        <!-- Étiquette de la bouteille -->
                        <rect x="15" y="64" width="30" height="34" rx="2" fill="#f5efe2" stroke="#b59a5b" stroke-width="1" />
                        <text
                          x="30"
                          y="78"
                          text-anchor="middle"
                          fill="#1c1915"
                          font-size="6.5"
                          font-weight="800"
                          font-family="sans-serif"
                        >
                          {{ bottle.labelLine1 }}
                        </text>
                        <text
                          v-if="bottle.labelLine2"
                          x="30"
                          y="86"
                          text-anchor="middle"
                          fill="#3b352c"
                          font-size="5.8"
                          font-weight="700"
                          font-family="sans-serif"
                        >
                          {{ bottle.labelLine2 }}
                        </text>
                        <text
                          v-if="bottle.abv != null"
                          x="30"
                          y="94"
                          text-anchor="middle"
                          fill="#8a6b28"
                          font-size="5.5"
                          font-weight="700"
                          font-family="sans-serif"
                        >
                          {{ bottle.abv }}%
                        </text>
                      </svg>
                    </div>

                  </button>
                </div>

                <!-- Planche de l'étagère -->
                <div class="shelf-ledge" aria-hidden="true"></div>
              </section>
            </div>

            <!-- Fiche détaillée de la bouteille sélectionnée -->
            <article v-if="selectedBottle && showBottleDetails" class="bottle-detail">
              <button
                type="button"
                class="bottle-detail-close"
                :aria-label="text.closeDetails"
                @click="closeBottleDetails"
              >
                <X :size="18" />
              </button>
              <div class="bottle-detail-hero">
                <div class="bottle-photo-placeholder" role="img" :aria-label="text.photoPlaceholder">
                  <Image :size="28" aria-hidden="true" />
                  <span>{{ text.photoPlaceholder }}</span>
                </div>

                <div class="bottle-detail-heading">
                  <div>
                    <p class="library-eyebrow">{{ categoryLabel(selectedBottle.ingredient.category) }}</p>
                    <h3>{{ selectedBottle.displayName }}</h3>
                    <p class="bottle-detail-subtitle">
                      {{ selectedBottle.ingredient.name }}
                      <template v-if="selectedBottle.ingredient.family"> · {{ familyLabel(selectedBottle.ingredient.family) }}</template>
                    </p>
                  </div>
                  <span v-if="selectedBottle.abv != null" class="detail-abv">{{ selectedBottle.abv }}% ABV</span>
                </div>
              </div>

              <div class="bottle-facts">
                <div v-if="selectedBottle.abv != null" class="bottle-fact">
                  <span>{{ text.alcohol }}</span>
                  <strong>{{ selectedBottle.abv }}%</strong>
                </div>
                <div v-if="priceLabel(selectedBottle)" class="bottle-fact">
                  <span>{{ text.price }}</span>
                  <strong>{{ priceLabel(selectedBottle) }}</strong>
                </div>
                <div v-if="selectedBottle.reference" class="bottle-fact">
                  <span>{{ text.bottle }}</span>
                  <strong>{{ selectedBottle.reference.name }}</strong>
                </div>
              </div>

              <section class="bottle-description">
                <h4>{{ text.description }}</h4>
                <p>{{ bottleDescription(selectedBottle) }}</p>
              </section>

              <section class="bottle-cocktails">
                <h4>{{ text.cocktails }}</h4>
                <p v-if="!selectedBottleCocktails.length" class="library-empty library-empty--small">
                  {{ text.noCocktails }}
                </p>
                <div v-else class="related-cocktails">
                  <button
                    v-for="cocktail in selectedBottleCocktails"
                    :key="cocktail.id"
                    type="button"
                    @click="emit('open-cocktail', cocktail)"
                  >
                    <span class="related-cocktail-thumb">
                      <img
                        v-if="cocktail.image && !failedCocktailThumbs.has(cocktail.id)"
                        :src="cocktail.image"
                        :crossorigin="isSupabasePublicImage(cocktail.image) ? 'anonymous' : undefined"
                        alt=""
                        loading="lazy"
                        @error="onCocktailThumbError(cocktail.id)"
                      />
                      <Martini v-else :size="18" aria-hidden="true" />
                    </span>
                    <span class="related-cocktail-name">{{ cocktail.name }}</span>
                    <ArrowUpRight :size="14" aria-hidden="true" />
                  </button>
                </div>
              </section>
            </article>
          </template>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowUpRight, Image, Martini, Search, X } from 'lucide-vue-next'
import { getFamilyLabel } from '@/constants/typeLabels'
import { isSupabasePublicImage } from '@/lib/supabase'
import { useModalAccessibility } from '@/composables/useModalAccessibility'

const props = defineProps({
  ingredients: { type: Array, default: () => [] },
  cocktails: { type: Array, default: () => [] },
  locale: { type: String, default: 'fr' },
})

const emit = defineEmits(['close', 'open-cocktail'])
const dialogRef = ref(null)
const search = ref('')
const activeCategory = ref('all')
const selectedBottle = ref(null)
const showBottleDetails = ref(false)
const failedCocktailThumbs = ref(new Set())
useModalAccessibility(dialogRef, () => emit('close'))

function onCocktailThumbError(cocktailId) {
  failedCocktailThumbs.value = new Set(failedCocktailThumbs.value).add(cocktailId)
}

function openBottleDetails(bottle) {
  selectedBottle.value = bottle
  showBottleDetails.value = true
}

function closeBottleDetails() {
  showBottleDetails.value = false
}

const isFrench = computed(() => props.locale !== 'en')
const text = computed(() => isFrench.value ? {
  eyebrow: 'La collection du bar',
  title: 'Spiritueux & liqueurs',
  intro: 'Parcours les étagères du bar et clique sur une bouteille pour voir ses cocktails.',
  close: 'Fermer la bibliothèque',
  closeDetails: 'Fermer le détail de la bouteille',
  search: 'Rechercher une bouteille…',
  categories: 'Catégories de bouteilles',
  spirits: 'Spiritueux',
  liqueurs: 'Liqueurs',
  all: 'Tout',
  otherShelf: 'Autres flacons',
  photoPlaceholder: 'Photo de la bouteille',
  empty: 'Aucune bouteille en stock dans cette catégorie.',
  alcohol: 'Degré d’alcool',
  price: 'Prix indicatif',
  bottle: 'Bouteille',
  description: 'Description',
  descriptionPlaceholder: 'La description de cette bouteille pourra être ajoutée ici.',
  cocktails: 'Cocktails du bar avec cet ingrédient',
  noCocktails: 'Aucun cocktail du bar ne référence cet ingrédient pour le moment.',
} : {
  eyebrow: 'The bar collection',
  title: 'Spirits & liqueurs',
  intro: 'Browse the bar shelves and select a bottle to discover cocktails made with it.',
  close: 'Close the library',
  closeDetails: 'Close bottle details',
  search: 'Search bottles…',
  categories: 'Bottle categories',
  spirits: 'Spirits',
  liqueurs: 'Liqueurs',
  all: 'All',
  otherShelf: 'Other bottles',
  photoPlaceholder: 'Bottle photo',
  empty: 'No bottles in stock in this category.',
  alcohol: 'Alcohol',
  price: 'Approx. price',
  bottle: 'Bottle',
  description: 'Description',
  descriptionPlaceholder: 'A description of this bottle can be added here.',
  cocktails: 'Cocktails at this bar using this ingredient',
  noCocktails: 'No cocktails at this bar reference this ingredient yet.',
})

const categoryOptions = computed(() => [
  { key: 'all', label: text.value.all },
  { key: 'spirits', label: text.value.spirits },
  { key: 'licors', label: text.value.liqueurs },
])

function isAvailable(ingredient) {
  if (ingredient.available === false) return false
  const refs = ingredient.references || []
  if (refs.length > 0) {
    return refs.some(ref => ref.available !== false)
  }
  return true
}

function categoryLabel(category) {
  const cat = (category || '').toLowerCase()
  return ['licors', 'liqueurs'].includes(cat) ? text.value.liqueurs : text.value.spirits
}

function familyLabel(family) {
  if (!family) return text.value.otherShelf
  const label = getFamilyLabel(family, props.locale)
  return label === 'Indisponible' || label === 'Unavailable'
    ? family.replace(/[_-]+/g, ' ')
    : label
}

function bottleDescription(bottle) {
  const description = bottle.reference?.description ?? bottle.ingredient.description
  if (typeof description === 'string' && description.trim()) return description.trim()
  if (description && typeof description === 'object') {
    const localized = description[props.locale] || description.fr || description.en
    if (typeof localized === 'string' && localized.trim()) return localized.trim()
  }
  return text.value.descriptionPlaceholder
}

function getBottleVisual(ingredient, reference) {
  const raw = `${ingredient.family || ''} ${ingredient.type || ''} ${reference?.name || ''} ${ingredient.name || ''}`.toLowerCase()

  if (raw.includes('whisky') || raw.includes('whiskey') || raw.includes('bourbon') || raw.includes('scotch') || raw.includes('cognac') || raw.includes('brandy') || raw.includes('armagnac')) {
    return { color: 'rgba(196, 114, 34, 0.8)', shape: 'square' }
  }
  if (raw.includes('rhum') || raw.includes('rum')) {
    const isWhite = raw.includes('blanc') || raw.includes('white') || raw.includes('silver')
    return {
      color: isWhite ? 'rgba(215, 232, 238, 0.42)' : 'rgba(168, 78, 24, 0.82)',
      shape: 'round',
    }
  }
  if (raw.includes('absinthe') || raw.includes('pastis') || raw.includes('chartreuse') || raw.includes('menthe')) {
    return { color: 'rgba(98, 168, 92, 0.72)', shape: 'tall' }
  }
  if (raw.includes('gin') || raw.includes('vodka') || raw.includes('tequila') || raw.includes('mezcal') || raw.includes('agave')) {
    return {
      color: raw.includes('reposado') || raw.includes('añejo') ? 'rgba(214, 168, 79, 0.65)' : 'rgba(205, 230, 235, 0.38)',
      shape: 'tall',
    }
  }
  if (raw.includes('campari') || raw.includes('aperol') || raw.includes('vermouth') || raw.includes('bitter') || raw.includes('cassis') || raw.includes('framboise')) {
    return { color: 'rgba(176, 36, 44, 0.8)', shape: 'tall' }
  }
  if (['licors', 'liqueurs'].includes((ingredient.category || '').toLowerCase())) {
    return { color: 'rgba(201, 158, 56, 0.75)', shape: 'round' }
  }

  return { color: 'rgba(201, 170, 92, 0.55)', shape: 'tall' }
}

function splitLabelLines(name) {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return { line1: words[0].slice(0, 8), line2: '' }
  }
  return {
    line1: words[0].slice(0, 8),
    line2: words.slice(1).join(' ').slice(0, 9),
  }
}

function bottlePrice(ingredient, reference) {
  const price = reference?.bottle_price ?? ingredient.bottle_price
  if (price != null) return Number(price)

  const perMl = reference?.price_per_ml ?? ingredient.price_per_ml
  const volume = reference?.bottle_volume_ml ?? ingredient.bottle_volume_ml ?? 700
  return perMl != null ? Number(perMl) * Number(volume) : null
}

function priceLabel(bottle) {
  const price = bottlePrice(bottle.ingredient, bottle.reference)
  if (price == null || !Number.isFinite(price)) return ''
  const formatted = new Intl.NumberFormat(props.locale === 'en' ? 'en-GB' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(price)
  return bottle.reference?.pricing_mode === 'ml' || (!bottle.reference && bottle.ingredient.pricing_mode === 'ml')
    ? `~${formatted} / bouteille`
    : `~${formatted}`
}

function cocktailsFor(ingredient, reference) {
  const candidates = cocktailsByIngredient.value.get(ingredient.type) || []
  return candidates
    .filter(({ references }) => !reference || references.has(null) || references.has(reference.name))
    .slice(0, 4)
    .map(({ cocktail }) => cocktail)
}

const cocktailsByIngredient = computed(() => {
  const byIngredient = new Map()
  for (const cocktail of props.cocktails) {
    const referencesByIngredient = new Map()
    for (const line of cocktail.recipe || []) {
      if (!line.Ingredient) continue
      if (!referencesByIngredient.has(line.Ingredient)) {
        referencesByIngredient.set(line.Ingredient, new Set())
      }
      referencesByIngredient.get(line.Ingredient).add(line.Reference || null)
    }

    for (const [ingredientType, references] of referencesByIngredient) {
      if (!byIngredient.has(ingredientType)) byIngredient.set(ingredientType, [])
      byIngredient.get(ingredientType).push({ cocktail, references })
    }
  }
  return byIngredient
})

const selectedBottleCocktails = computed(() => {
  if (!selectedBottle.value) return []
  return cocktailsFor(selectedBottle.value.ingredient, selectedBottle.value.reference)
})

const bottles = computed(() => {
  const query = search.value.trim().toLocaleLowerCase(props.locale)
  return props.ingredients
    .filter(ingredient => {
      const cat = (ingredient.category || '').toLowerCase()
      const isSpiritOrLiquor = ['spirits', 'licors', 'liqueurs', 'spiritueux'].includes(cat)

      const matchesCategory =
        activeCategory.value === 'all' ||
        cat === activeCategory.value ||
        (activeCategory.value === 'licors' && ['licors', 'liqueurs'].includes(cat))

      return isSpiritOrLiquor && isAvailable(ingredient) && matchesCategory
    })
    .flatMap(ingredient => {
      const availableReferences = (ingredient.references || []).filter(reference => reference.available !== false)
      const entries = availableReferences.length
        ? availableReferences.map(reference => ({ ingredient, reference }))
        : [{ ingredient, reference: null }]

      return entries
        .map(({ reference }) => {
          const displayName = reference?.name || ingredient.name
          const { line1, line2 } = splitLabelLines(displayName)
          return {
            id: `${ingredient.id || ingredient.name}:${reference?.id || 'ingredient'}`,
            displayName,
            labelLine1: line1,
            labelLine2: line2,
            ingredient,
            reference,
            abv: reference?.abv ?? ingredient.abv,
            visual: getBottleVisual(ingredient, reference),
          }
        })
        .filter(item => {
          if (!query) return true
          return `${item.reference?.name || ''} ${item.ingredient.name} ${item.ingredient.family || ''}`
            .toLocaleLowerCase(props.locale)
            .includes(query)
        })
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, props.locale))
})

const shelves = computed(() => {
  const groups = new Map()

  for (const bottle of bottles.value) {
    const shelfKey = bottle.ingredient.family || `cat_${bottle.ingredient.category}`
    const shelfLabel = bottle.ingredient.family
      ? familyLabel(bottle.ingredient.family)
      : categoryLabel(bottle.ingredient.category)

    if (!groups.has(shelfKey)) {
      groups.set(shelfKey, {
        key: shelfKey,
        label: shelfLabel,
        bottles: [],
      })
    }
    groups.get(shelfKey).bottles.push(bottle)
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, props.locale))
})

watch(bottles, nextBottles => {
  if (!nextBottles.length) {
    selectedBottle.value = null
    showBottleDetails.value = false
    return
  }
  if (selectedBottle.value && !nextBottles.some(bottle => bottle.id === selectedBottle.value?.id)) {
    selectedBottle.value = null
    showBottleDetails.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.spirit-library-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(8, 7, 6, .76);
  backdrop-filter: blur(7px);
}

.spirit-library {
  width: min(1140px, 100%);
  max-height: min(92vh, 920px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--text);
  background: var(--bg-card);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 80px rgba(0,0,0,.45);
}

.library-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.6rem 1.1rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-raised);
}

.library-header h2, .bottle-detail h3 {
  margin: .2rem 0;
  color: var(--gold);
  font-family: var(--font-display);
}

.library-intro, .bottle-detail-subtitle {
  margin: .35rem 0 0;
  color: var(--text-muted);
  font-size: .88rem;
}

.library-eyebrow {
  margin: 0;
  color: var(--text-dim);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.library-close {
  align-self: flex-start;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border-mid);
  border-radius: 50%;
  cursor: pointer;
}

.library-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .75rem;
  padding: .9rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.library-search {
  display: flex;
  align-items: center;
  gap: .55rem;
  flex: 1 1 220px;
  min-width: 0;
  color: var(--text-dim);
  background: var(--bg-raised);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-sm);
  padding: 0 .75rem;
}

.library-search input {
  width: 100%;
  min-width: 0;
  padding: .6rem 0;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: 0;
}

.library-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
}

.library-tabs button {
  min-height: 38px;
  padding: .35rem .8rem;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border-mid);
  border-radius: 999px;
  cursor: pointer;
}

.library-tabs button.active {
  color: var(--gold);
  border-color: var(--gold-dim);
  background: rgba(201,170,92,.1);
}

.library-content {
  position: relative;
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
  padding: 1.25rem 1.5rem 1.5rem;
}

.library-content--details-open {
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, .85fr);
  gap: 1rem;
}

/* --- ÉTAGÈRES --- */
.shelves-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
  padding-right: .5rem;
}

/* Empêche les étagères de s'écraser dans le conteneur flex */
.shelf-unit {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.4) 100%);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding-top: .75rem;
}

.shelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem .4rem;
}

.shelf-title {
  margin: 0;
  font-size: .78rem;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--gold);
}

.shelf-count {
  font-size: .72rem;
  color: var(--text-dim);
  background: var(--bg-raised);
  padding: .15rem .5rem;
  border-radius: 999px;
  border: 1px solid var(--border);
}

.shelf-row {
  display: flex;
  align-items: flex-end;
  gap: .25rem;
  padding: .5rem .65rem 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

/* Planche d'étagère */
.shelf-ledge {
  height: 12px;
  background: linear-gradient(180deg, #3d2c1e 0%, #241910 65%, #140e09 100%);
  border-top: 1px solid rgba(201, 170, 92, 0.35);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.55);
}

/* --- OBJET BOUTEILLE --- */
.bottle-item {
  flex: 0 0 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: .25rem 0;
  background: transparent;
  border: 0;
  color: var(--text);
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.bottle-item:hover {
  transform: translateY(-6px);
}

.bottle-item.selected {
  transform: translateY(-8px);
}

.bottle-figure {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 112px;
}

.bottle-svg {
  display: block;
  overflow: visible;
  transition: filter 0.2s ease;
}

.bottle-item.selected .bottle-svg {
  filter: drop-shadow(0 0 10px rgba(201, 170, 92, 0.65));
}

/* --- PANNEAU DÉTAIL --- */
.bottle-detail {
  position: relative;
  min-width: 0;
  max-height: 100%;
  box-sizing: border-box;
  align-self: stretch;
  overflow-y: auto;
  padding: 1.2rem;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.bottle-detail-close {
  position: sticky;
  z-index: 1;
  top: 0;
  float: right;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin: -.55rem -.55rem .25rem .5rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border-mid);
  border-radius: 50%;
  cursor: pointer;
}

.bottle-detail-hero { display: grid; grid-template-columns: 104px minmax(0, 1fr); align-items: center; gap: .9rem; }
.bottle-photo-placeholder {
  aspect-ratio: 4 / 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .65rem;
  padding: .6rem;
  color: var(--text-dim);
  text-align: center;
  background:
    radial-gradient(ellipse at 50% 35%, rgba(201,170,92,.14), transparent 68%),
    linear-gradient(145deg, var(--bg-card), var(--bg));
  border: 1px dashed var(--border-mid);
  border-radius: var(--radius-md);
}
.bottle-photo-placeholder svg { color: var(--gold-dim); }
.bottle-photo-placeholder span { font-size: .68rem; line-height: 1.3; }
.bottle-detail-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; min-width: 0; }
.bottle-detail h3 { font-size: 1.35rem; }
.detail-abv { padding: .45rem .65rem; color: var(--gold); font-size: .75rem; font-weight: 700; white-space: nowrap; border: 1px solid var(--border-mid); border-radius: 999px; }
.bottle-facts { display: flex; flex-wrap: wrap; gap: .65rem; margin: 1.1rem 0 1.5rem; }
.bottle-fact { display: grid; gap: .25rem; padding: .65rem .75rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); }
.bottle-fact span { color: var(--text-dim); font-size: .7rem; }
.bottle-fact strong { font-size: .87rem; }
.bottle-description { margin: 0 0 1.25rem; }
.bottle-description h4 { margin: 0 0 .55rem; color: var(--text-muted); font-size: .82rem; }
.bottle-description p { min-height: 3.5rem; margin: 0; padding: .75rem; color: var(--text-dim); background: var(--bg); border: 1px dashed var(--border-mid); border-radius: var(--radius-sm); font-size: .82rem; line-height: 1.5; }
.bottle-cocktails h4 { margin: 0 0 .65rem; color: var(--text-muted); font-size: .82rem; }
.related-cocktails { display: flex; flex-direction: column; gap: .3rem; }
.related-cocktails button { display: flex; align-items: center; gap: .5rem; min-height: 44px; padding: .3rem .5rem .3rem .3rem; text-align: left; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; }
.related-cocktail-thumb { width: 2rem; height: 2rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--gold-dim); background: linear-gradient(135deg, var(--bg-raised), var(--bg-input)); border-radius: var(--radius-sm); }
.related-cocktail-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.related-cocktail-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem; font-weight: 600; }
.related-cocktails button svg:last-child { width: 12px; height: 12px; margin-left: auto; color: var(--text-dim); }
.library-empty { grid-column: 1 / -1; align-self: center; margin: 0; padding: 2rem; color: var(--text-muted); text-align: center; }
.library-empty--small { padding: .8rem 0; text-align: left; font-size: .82rem; }

@media (max-width: 760px) {
  .spirit-library-overlay { align-items: end; padding: 0; }
  .spirit-library { width: 100%; max-height: 94vh; border-radius: 1rem 1rem 0 0; }
  .library-header, .library-toolbar { padding-left: 1rem; padding-right: 1rem; }
  .library-content {
    overflow: hidden;
    padding: .9rem 1rem 1.2rem;
  }
  .library-content--details-open {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .shelves-container {
    overflow-y: auto;
    padding-right: 0;
  }
  .library-content--details-open .shelves-container {
    height: auto;
    max-height: 35vh;
    flex: 0 0 auto;
  }
  .bottle-detail {
    position: relative;
    width: 100%;
    max-height: none;
    flex: 0 0 auto;
  }
}
</style>