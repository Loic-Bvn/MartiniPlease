<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div ref="modalEl" class="modal-container modal-container--cocktail">
      <div class="modal-header">
        <div class="cocktail-title-row">
          <h3 :class="['cocktail-title', makeable ? 'cocktail-title--available' : 'cocktail-title--unavailable']">
            {{ cocktail.name }} - {{ cocktail.abv }}°
          </h3>
        </div>

        <button type="button" @click="$emit('close')" class="password-modal-close">
          <X :size="20" />
        </button>
      </div>
      <div class="modal-body cv-modal-body">
        <div class="cocktail-view-layout">

          <div class="cv-image-col">
            <div v-if="cocktail.image && !imageError" class="image-preview-large">
              <img :src="cocktail.image" alt="cocktail image" @error="imageError = true" />
            </div>
            <div v-else class="image-missing">
              <Martini :size="40" />
            </div>
          </div>

          <div class="cv-content-col">

            <!-- Onglets -->
            <div class="swipe-tabs" role="tablist">
              <button
                id="tab-infos"
                type="button"
                role="tab"
                :aria-selected="activeTab === 0"
                aria-controls="panel-infos"
                :tabindex="activeTab === 0 ? 0 : -1"
                class="swipe-tab"
                :class="{ 'swipe-tab--active': activeTab === 0 }"
                @click="goToTab(0)"
              >
                Infos
              </button>
              <button
                id="tab-recette"
                type="button"
                role="tab"
                :aria-selected="activeTab === 1"
                aria-controls="panel-recette"
                :tabindex="activeTab === 1 ? 0 : -1"
                class="swipe-tab"
                :class="{ 'swipe-tab--active': activeTab === 1 }"
                @click="goToTab(1)"
              >
                Recette
                <span class="swipe-tab-count">{{ (cocktail.recipe || []).length }}</span>
              </button>
              <button
                id="tab-description"
                type="button"
                role="tab"
                :aria-selected="activeTab === 2"
                aria-controls="panel-description"
                :tabindex="activeTab === 2 ? 0 : -1"
                class="swipe-tab"
                :class="{ 'swipe-tab--active': activeTab === 2 }"
                @click="goToTab(2)"
              >
                Description
              </button>
              <span class="swipe-tab-indicator" :style="indicatorStyle"></span>
            </div>

            <!-- Piste swipable -->
            <div
              class="swipe-viewport"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
              @touchend="onTouchEnd"
            >
              <div
                class="swipe-track"
                :class="{ 'swipe-track--dragging': isDragging }"
                :style="trackStyle"
              >
                <!-- Panel 1 : infos -->
                <div id="panel-infos" role="tabpanel" aria-labelledby="tab-infos" class="swipe-panel">
                  <div class="cv-prep-block">
                    <div class="cv-prep-item">
                      <GlassWater :size="18" />
                      <div class="cv-prep-text">
                        <span class="cv-prep-label">{{ props.locale === 'fr' ? 'Méthode' : 'Method' }}</span>
                        <span class="cv-prep-value" :class="{ 'cv-value--na': !cocktail.method }">{{ getDetailledMethodLabel(cocktail.method, locale) }}</span>
                      </div>
                    </div>
                    <div class="cv-prep-item">
                      <Martini :size="18" />
                      <div class="cv-prep-text">
                        <span class="cv-prep-label">{{ props.locale === 'fr' ? 'Verre' : 'Glass' }}</span>
                        <span class="cv-prep-value" :class="{ 'cv-value--na': !cocktail.glass }">{{ getGlassLabel(cocktail.glass, locale) }}</span>
                      </div>
                    </div>
                    <div class="cv-prep-item">
                      <Snowflake :size="18" />
                      <div class="cv-prep-text">
                        <span class="cv-prep-label">{{ props.locale === 'fr' ? 'Glaçon' : 'Ice' }}</span>
                        <span class="cv-prep-value" :class="{ 'cv-value--na': !cocktail.ice?.length }">{{ getDetailledIceLabel(cocktail.ice, locale) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="cv-meta-list">
                    <div class="cv-meta-row">
                      <span class="form-label">Profiles</span>
                      <span :class="{ 'cv-value--na': !cocktail.profile?.length }">{{ cocktail.profile?.length ? cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Spiritueux de base' : 'Base Spirit' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.base_spirit }">{{ cocktail.base_spirit ? getTypeLabel(cocktail.base_spirit, locale) : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Créateur' : 'Creator' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.creator || cocktail.creator === 'Unknown' }">{{ (cocktail.creator && cocktail.creator !== 'Unknown') ? cocktail.creator : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Année' : 'Year' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.creation_year }">{{ cocktail.creation_year || (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <div class="cv-meta-row">
                      <span class="form-label">Style</span>
                      <span :class="{ 'cv-value--na': !cocktail.cocktail_style }">{{ (cocktail.cocktail_style && cocktail.cocktail_style !== 'Unknown') ? cocktail.cocktail_style : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                  </div>
                </div>

                <!-- Panel 2 : recette -->
                <div id="panel-recette" role="tabpanel" aria-labelledby="tab-recette" class="swipe-panel">
                  <div class="recipe-rows">
                    <div v-if="(cocktail.recipe || []).length === 0" class="recipe-empty">Aucun ingrédient</div>
                    <div
                      v-for="(ing, idx) in recipeWithQty"
                      :key="ing.Type ? ing.Type + idx : idx"
                      class="recipe-line cv-recipe-line"
                    >
                      <div class="ingredient-info">
                        <span :class="['recipe-bullet', isAvailable(ing) ? 'recipe-bullet--available' : 'recipe-bullet--missing']"></span>
                        <span :class="['ingredient-name', !isAvailable(ing) ? 'ingredient-name--missing' : '']">
                          {{ getTypeLabel(ing.Type, locale) }}
                        </span>
                      </div>
                      <span class="ingredient-quantity">{{ ing._qty }}</span>
                    </div>
                  </div>
                </div>

                <!-- Panel 3 : description -->
                <div id="panel-description" role="tabpanel" aria-labelledby="tab-description" class="swipe-panel">
                  <div v-if="props.locale === 'fr' ? cocktail.description_fr : cocktail.description_en" class="cocktail-description">{{ props.locale === 'fr' ? cocktail.description_fr : cocktail.description_en }}</div>
                  <div v-else class="cocktail-description cocktail-description--empty">{{ props.locale === 'fr' ? 'Aucune description disponible pour ce cocktail.' : 'No description available for this cocktail.'}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { X, GlassWater, Martini, Snowflake } from 'lucide-vue-next'
import {
  getTypeLabel,
  getProfileLabel,
  getGlassLabel,
  getDetailledMethodLabel,
  getDetailledIceLabel
} from '@/constants/typeLabels.js'
import { useInventory } from '@/composables/useInventory'

const TAB_COUNT = 3
const TAB_WIDTH = 100 / TAB_COUNT

const props = defineProps({
  cocktail: {
    type: Object,
    required: true,
    default: () => ({ recipe: [] }),
  },
  locale:          { type: String, default: 'fr' },
  originRect:      { type: Object, default: null },
  isBartenderMode: { type: Boolean, default: false },
  unit:            { type: String, default: 'oz' },
  barId:           { type: String, default: '' },
})
const emit = defineEmits(['close'])
const imageError = ref(false)
const modalEl = ref(null)

const { barInventory } = useInventory()

const makeable = computed(() =>
  (props.cocktail.recipe || []).every(isAvailable)
)

function isAvailable(ing) {
  if (ing.Type === 'garnish') return true
  return barInventory.value.has(ing.Type)
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

const recipeWithQty = computed(() =>
  (props.cocktail.recipe || []).map(ing => ({ ...ing, _qty: formatQty(ing) }))
)

// ── Swipe infos / recette / description ──
const activeTab = ref(0)
const isDragging = ref(false)
const dragDeltaPercent = ref(0)
let touchStartX = 0
let touchStartY = 0
let axisLocked = null

function goToTab(index) {
  activeTab.value = index
}

const trackStyle = computed(() => {
  const base = -activeTab.value * TAB_WIDTH
  const offset = isDragging.value ? dragDeltaPercent.value : 0
  return {
    transform: `translateX(${base + offset}%)`,
    transition: isDragging.value ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
  }
})

const indicatorStyle = computed(() => ({
  transform: `translateX(${activeTab.value * 100}%)`,
}))

function onTouchStart(e) {
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  axisLocked = null
  isDragging.value = true
}

function onTouchMove(e) {
  if (!isDragging.value) return
  const t = e.touches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY

  if (axisLocked === null) {
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
  }

  if (axisLocked === 'y') {
    isDragging.value = false
    return
  }

  e.preventDefault()
  const viewportWidth = e.currentTarget.clientWidth || 1
  let percent = (dx / viewportWidth) * TAB_WIDTH

  if ((activeTab.value === 0 && percent > 0) || (activeTab.value === TAB_COUNT - 1 && percent < 0)) {
    percent *= 0.3
  }
  dragDeltaPercent.value = percent
}

function onTouchEnd() {
  dragDeltaPercent.value = wasDragging() ? dragDeltaPercent.value : 0
  if (!isDragging.value) return
  const threshold = 12
  if (dragDeltaPercent.value <= -threshold && activeTab.value < TAB_COUNT - 1) {
    activeTab.value += 1
  } else if (dragDeltaPercent.value >= threshold && activeTab.value > 0) {
    activeTab.value -= 1
  }
  isDragging.value = false
  dragDeltaPercent.value = 0
}

function wasDragging() {
  return isDragging.value
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowLeft') activeTab.value = Math.max(0, activeTab.value - 1)
  if (e.key === 'ArrowRight') activeTab.value = Math.min(TAB_COUNT - 1, activeTab.value + 1)
}

// ── FLIP : la modal "part" de la position/taille de la card cliquée ──
async function playFlipIn() {
  if (!props.originRect || !modalEl.value) return
  const final = modalEl.value.getBoundingClientRect()

  const scaleX = props.originRect.width / final.width
  const scaleY = props.originRect.height / final.height
  const translateX = (props.originRect.left + props.originRect.width / 2) - (final.left + final.width / 2)
  const translateY = (props.originRect.top + props.originRect.height / 2) - (final.top + final.height / 2)

  modalEl.value.style.transition = 'none'
  modalEl.value.style.transformOrigin = 'center center'
  modalEl.value.style.willChange = 'transform, opacity'
  modalEl.value.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`
  modalEl.value.style.opacity = '0.4'

  await nextTick()
  requestAnimationFrame(() => {
    modalEl.value.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease'
    modalEl.value.style.transform = 'translate(0, 0) scale(1, 1)'
    modalEl.value.style.opacity = '1'
    modalEl.value.addEventListener('transitionend', () => {
      modalEl.value.style.willChange = ''
    }, { once: true })
  })
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  playFlipIn()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-header {
  padding: 0.5rem 0.75rem;
  min-height: unset;
  flex-shrink: 0;
}

.modal-close-btn {
  appearance: none;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 999px;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  cursor: pointer;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  color: var(--gold);
  border-color: var(--gold-dim, var(--border));
}

.modal-container--cocktail {
  max-width: 780px;
  max-height: 90vh;
  width: 90%;
  height: auto;
  margin: 0 auto;
  max-height: calc(100vh - 4vh);
  max-height: calc(100dvh - 4vh);
  box-sizing: border-box;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vh 1rem;
  padding: 2dvh 1rem;
}

.cv-modal-body {
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cocktail-view-layout {
  display: flex;
  flex-direction: row;
  gap: 1.25rem;
  flex: 1;
  min-height: 0;
  height: 100%;
  align-items: stretch;
}

.cv-image-col {
  display: flex;
  flex-direction: column;
  width: 200px;
  flex-shrink: 0;
  min-height: 0;
}

.cv-content-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-x: hidden;
}

.image-preview-large,
.image-missing {
  flex: 1;
  min-height: 0;
  height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.image-preview-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  display: block;
}

.image-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-raised), var(--bg-input));
  color: var(--gold-dim);
}

.cv-prep-block {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.cv-prep-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 100px;
  color: var(--gold);
}

.cv-prep-text {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  line-height: 1.2;
}

.cv-prep-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-dim);
}

.cv-prep-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
}

.cocktail-title-row {
  height: 2.2rem;
  display: flex;
  align-items: center;
}

.cocktail-description {
  margin: 0 0 0.75rem;
  color: var(--text);
  line-height: 1.5;
  font-size: 0.9rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.cocktail-description--empty {
  color: var(--text-dim);
  font-style: italic;
}

.cv-value--na {
  color: var(--text-dim);
  font-style: italic;
  font-weight: 400 !important;
  text-transform: none !important;
}

.cv-meta-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cv-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}

.cv-meta-row .form-label {
  flex-shrink: 0;
}

.cv-recipe-line {
  font-size: 0.85rem;
  padding: 0.15rem 0;
}

.cv-garnish-tag {
  font-size: 0.68rem;
  color: var(--text-dim);
  margin-left: 0.4rem;
}

/* ── Onglets ── */
.swipe-tabs {
  height: 2.2rem;
  position: relative;
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow: hidden;
}

.swipe-tab {
  appearance: none;
  background: none;
  border: none;
  padding: 0.5rem 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  -webkit-tap-highlight-color: transparent;
  flex: 1 1 33.333%;
  justify-content: center;
  margin-right: 0;
  min-width: 0;
  overflow: hidden;
}

.swipe-tab > span:first-child,
.swipe-tab {
  white-space: nowrap;
}

.swipe-tab--active {
  color: var(--gold);
}

.swipe-tab-count {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-dim);
  background: var(--bg-raised);
  border-radius: 999px;
  padding: 0.05rem 0.4rem;
}

.swipe-tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 33.333%;
  height: 2px;
  background: var(--gold);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── Piste swipable ── */
.swipe-viewport {
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  max-height: 100%;
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.swipe-track {
  display: flex;
  align-items: stretch;
  width: 300%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.swipe-track--dragging {
  transition: none !important;
}

.swipe-panel {
  width: 33.333%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  flex-shrink: 0;
  box-sizing: border-box;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-top: 0.75rem;
  padding-right: 0.25rem;
  scrollbar-width: thin;
}

.cv-modal-footer {
  justify-content: space-between;
}

@media (max-width: 768px) {

  .modal-overlay {
    padding: 3dvh 0.75rem;
  }

  .modal-container--cocktail {
    width: 100%;
    height: calc(100dvh - 6dvh);
    max-height: calc(100dvh - 6dvh);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .cocktail-view-layout {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1;
    min-height: 0;
  }

  .cv-image-col {
    width: 100%;
    flex-shrink: 0;
    height: auto;
  }

  .cv-content-col {
    flex: 1;
    min-height: 0;
  }

  .swipe-tab {
    font-size: 0.68rem;
    letter-spacing: 0.5px;
    padding: 0.5rem 0.15rem;
  }

  .cv-meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    padding: 0.3rem 0;
  }

  .cv-prep-block {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .cv-prep-item {
    min-width: 80px;
  }

  .swipe-viewport {
    flex: 1;
    min-height: 0;
  }

  /* image carrée qui remplit toute la largeur dispo (pas de marges
     latérales) ; la hauteur suit via aspect-ratio, avec un plafond
     généreux pour ne pas manger tout l'écran sur les téléphones larges */
  .image-preview-large,
  .image-missing {
    flex: none;
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    max-height: min(42dvh, 320px);
    margin: 0 auto;
  }

  .image-preview-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* Écrans courts (petits téléphones, mode paysage) : on rogne l'image
   en priorité pour garder de la place pour le contenu scrollable */
@media (max-width: 768px) and (max-height: 700px) {
  .image-preview-large,
  .image-missing {
    max-height: min(24dvh, 150px);
  }

  .cocktail-title-row {
    height: auto;
  }
}

@media (max-width: 768px) and (max-height: 560px) {
  .cv-image-col {
    display: none;
  }
}
</style>