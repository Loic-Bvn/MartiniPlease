<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div ref="modalEl" class="modal-container modal-container--cocktail">
    <!-- <div class="modal-header">
      <button @click="$emit('close')" class="modal-close-btn"><X :size="20" /></button>
    </div> -->

      <div class="modal-body cv-modal-body">
        <div class="cocktail-view-layout">

          <div class="cv-image-col">

            <div class="cocktail-title-row">
              <h3 :class="['cocktail-title', makeable ? 'cocktail-title--available' : 'cocktail-title--unavailable']">
                {{ cocktail.name }}
              </h3>
                <span v-if="cocktail.abv != null" class="cocktail-abv-inline">{{ cocktail.abv }}°</span>
            </div>

            <div v-if="cocktail.image && !imageError" class="image-preview-large">
              <img :src="cocktail.image" alt="cocktail image" @error="imageError = true" />
            </div>
            <div v-else class="image-missing">
              <Martini :size="40" />
            </div>

            <!-- <div class="profile-tags cv-profile-tags" :class="{ 'cv-value--na': !cocktail.profile?.length }">
              {{ cocktail.profile?.length ? cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') : 'Profil indisponible' }}
            </div> -->
          </div>

          <div class="cv-content-col">
            
            <!-- Onglets -->
            <div class="swipe-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 0"
                class="swipe-tab"
                :class="{ 'swipe-tab--active': activeTab === 0 }"
                @click="goToTab(0)"
              >
                Infos
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 1"
                class="swipe-tab"
                :class="{ 'swipe-tab--active': activeTab === 1 }"
                @click="goToTab(1)"
              >
                Recette
                <span class="swipe-tab-count">{{ (cocktail.recipe || []).length }}</span>
              </button>
              <button
                type="button"
                role="tab"
                :aria-selected="activeTab === 2"
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
                <div class="swipe-panel">
                  <!-- Préparation mise en avant : verre + glaçon + méthode -->
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
                      <span class="form-label">{{ props.locale === 'fr' ? 'Profiles' : 'Profiles' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.profile?.length }">{{ cocktail.profile?.length ? cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Spiritueux de base' : 'Base Spirit' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.base_spirit }">{{ cocktail.base_spirit ? getTypeLabel(cocktail.base_spirit, locale) : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <!-- <div class="cv-meta-row">
                      <span class="form-label">Catégorie</span>
                      <span :class="{ 'cv-value--na': !cocktail.category }">{{ cocktail.category || 'Indisponible' }}</span>
                    </div> -->
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Créateur' : 'Creator' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.creator || cocktail.creator === 'Unknown' }">{{ (cocktail.creator && cocktail.creator !== 'Unknown') ? cocktail.creator : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Année' : 'Year' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.creation_year }">{{ cocktail.creation_year || (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                    <!-- <div class="cv-meta-row">
                      <span class="form-label">Saison</span>
                      <span :class="{ 'cv-value--na': !cocktail.season?.length }">{{ cocktail.season?.length ? formatList(cocktail.season) : 'Indisponible' }}</span>
                    </div> -->
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Style' : 'Style' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.cocktail_style }">{{ (cocktail.cocktail_style && cocktail.cocktail_style !== 'Unknown') ? cocktail.cocktail_style : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>

                    </div>
                    <div class="cv-meta-row">
                      <span class="form-label">{{ props.locale === 'fr' ? 'Tags' : 'Tags' }}</span>
                      <span :class="{ 'cv-value--na': !cocktail.tags?.length }">{{ cocktail.tags?.length ? formatList(cocktail.tags) : (props.locale === 'fr' ? 'Indisponible' : 'Unavailable') }}</span>
                    </div>
                  </div>
                </div>

                <!-- Panel 2 : recette -->
                <div class="swipe-panel">
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
                          <em v-if="ing.IsGarnish" class="cv-garnish-tag">garnish</em>
                        </span>
                      </div>
                      <span class="ingredient-quantity">{{ ing._qty }}</span>
                    </div>
                  </div>
                </div>
                <!-- Panel 3 : description -->
                <div class="swipe-panel">
                  <div v-if="props.locale === 'fr' ? cocktail.description_fr : cocktail.description_en" class="cocktail-description">{{ props.locale === 'fr' ? cocktail.description_fr : cocktail.description_en }}</div>
                  <div v-else class="cocktail-description cocktail-description--empty">{{ props.locale === 'fr' ? 'Aucune description disponible pour ce cocktail.' : 'No description available for this cocktail.'}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- <div class="modal-footer cv-modal-footer">
        POSSIBLE ACTIONS : favoris, commande, édition, suppression, soumission au catalogue
      </div> -->

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { X, Heart, GlassWater, Pencil, Trash2, Upload, Bookmark, Martini, Snowflake } from 'lucide-vue-next'
import { 
  getTypeLabel,
  getProfileLabel,
  getGlassLabel,
  getDetailledMethodLabel,
  getDetailledIceLabel
} from '@/constants/typeLabels.js'
import { useInventory } from '@/composables/useInventory'
import { useDrinker } from '@/composables/useDrinker'
import { useOrders } from '@/composables/useOrders'
import { useCatalog } from '@/composables/useCatalog'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  cocktail:        Object,
  locale:          { type: String, default: 'fr' },
  originRect:      { type: Object, default: null },
  isBartenderMode: { type: Boolean, default: false },
  unit:            { type: String, default: 'oz' },
  barId:           { type: String, default: '' },
})
const emit = defineEmits(['close', 'edit', 'delete'])
const imageError = ref(false)
const modalEl = ref(null)

const { barInventory } = useInventory()
const { hasDrinker, isFavorite, toggleFavorite, drinker, quickRefreshHistory } = useDrinker()
const { addOrder } = useOrders()
const { isSubmitted, submitToCatalog } = useCatalog()
const { showToast } = useToast()
const makeable = computed(() =>
  (props.cocktail.recipe || []).every(isAvailable)
)

// ── Disponibilité + favoris + commande (identique à CocktailCard) ──
function isAvailable(ing) {
  if (ing.Type === 'garnish') return true
  return barInventory.value.has(ing.Type)
}

const isFav = computed(() => isFavorite(props.cocktail.id))

async function handleFavorite() {
  await toggleFavorite(props.cocktail.id)
}

async function handleHistoric() {
  if (!hasDrinker.value || !drinker.value || !props.barId) return
  const result = await addOrder(drinker.value, props.cocktail.id, props.barId)
  if (result.success) {
    await quickRefreshHistory()
    showToast('🍸 ' + props.cocktail.name + (props.locale === 'fr' ? ' commandé !' : ' ordered!'))
  } else {
    console.error('❌ Order failed:', result.error)
  }
}

async function handleSubmit() {
  await submitToCatalog(props.cocktail)
}

// ── Quantités (unité oz/ml, identique à CocktailCard) ──
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

// ── Labels style / méthode / verre (identiques à CocktailCard) ──
// const STYLE_LABELS = {
//   sour: '🍋 Sour', fizz: '🫧 Fizz', highball: '🥃 Highball', tiki: '🌺 Tiki',
//   negroni: '🔴 Negroni', old_fashioned: '🟠 Old Fashioned', classic: '🎩 Classic',
//   modern: '✨ Modern', creamy: '🥛 Creamy', flip: '🥚 Flip', spritz: '🍾 Spritz',
// }
// const styleLabel = computed(() => {
//   const s = props.cocktail.cocktail_style
//   if (!s) return 'Indisponible'
//   return STYLE_LABELS[s] || s
// })

// const METHOD_LABELS = {
//   shake: 'Au shaker', regal_shake: '🍸 Regal Shake', stir: 'Verre à mélange', regal_stir: '🥄 Regal Stir',
//   build: 'Au verre', blend: '🌀 Blend', swizzle: '🌿 Swizzle', throw: '🤹 Throw',
// }
// const methodLabel = computed(() => {
//   const m = props.cocktail.method
//   if (!m) return 'Indisponible'
//   return METHOD_LABELS[m] || m
// })

function formatList(value = []) {
  if (!Array.isArray(value)) return ''
  return value.map(item => typeof item === 'string' ? item : item?.name || item?.label || '').filter(Boolean).join(', ')
}

// ── Swipe infos / recette ──
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
  const base = -activeTab.value * (100 / 3)
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
  let percent = (dx / viewportWidth) * (100 / 3)

  if ((activeTab.value === 0 && percent > 0) || (activeTab.value === 2 && percent < 0)) {
    percent *= 0.3
  }
  dragDeltaPercent.value = percent
}

function onTouchEnd() {
  if (!isDragging.value) {
    dragDeltaPercent.value = 0
    return
  }
  const threshold = 12
  if (dragDeltaPercent.value <= -threshold && activeTab.value < 2) {
    activeTab.value += 1
  } else if (dragDeltaPercent.value >= threshold && activeTab.value > 0) {
    activeTab.value -= 1
  }
  isDragging.value = false
  dragDeltaPercent.value = 0
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowLeft') activeTab.value = Math.max(0, activeTab.value - 1)
  if (e.key === 'ArrowRight') activeTab.value = Math.min(2, activeTab.value + 1)
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
/* Ce composant s'appuie au maximum sur les classes globales déjà définies
   (modal-overlay, modal-container, modal-header, modal-body, modal-footer,
   btn-modal-primary, badge-method, recipe-line, recipe-bullet, ingredient-name,
   ingredient-quantity, form-label, profile-tags, cocktail-abv-inline...).
   Seul le layout spécifique à cette vue (colonnes + swipe) est ajouté ici. */

.modal-header {
  padding: 0.5rem 0.75rem;
  min-height: unset;
}

.cv-modal-body {
  overflow: hidden;
  min-height: 0;
}

.cocktail-view-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.25rem;
  height: 100%;
  min-height: 0;
}

.cv-image-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cv-profile-tags {
  font-size: 0.78rem;
  text-align: left;
}

.cv-content-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}

.image-preview-large {
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: var(--bg-input);
  box-shadow: var(--shadow-sm);
}

.image-preview-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 140px;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--bg-raised), var(--bg-input));
  color: var(--gold-dim);
  padding: 0.5rem;
}

/* ── Bloc préparation (verre + glaçon + méthode) ── */
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
  /* text-transform: capitalize; */
}

.cocktail-title-row {
  height: 2.2rem;
    display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
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
}

.swipe-tab {
  appearance: none;
  background: none;
  border: none;
  padding: 0.5rem 0.25rem;
  /* margin-right: 1.25rem; */
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
  flex: 1 1 50%;
  justify-content: center;
  margin-right: 0;
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
  width: 50%;
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
  touch-action: pan-y;
  /* Empêche la sélection/surlignage tactile natif du navigateur pendant le
     drag horizontal : sans ça, un léger déplacement avant la détection
     d'axe déclenche la sélection de texte native, visible comme un
     bandeau de couleur plein sur toute la largeur touchée. */
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.swipe-track {
  display: flex;
  width: 200%;
  height: 100%;
  box-sizing: border-box;
}

.swipe-track--dragging {
  transition: none !important;
}

.swipe-panel {
  width: 50%;
  flex-shrink: 0;
  box-sizing: border-box;
  overflow-y: auto;
  padding-top: 0.75rem;
  padding-right: 0.25rem;
}

.cv-modal-footer {
  justify-content: space-between;
}

@media (max-width: 768px) {
  .cocktail-view-layout {
    grid-template-columns: 1fr;
  }
}

.swipe-tab {
  flex: 1 1 33.333%;
  justify-content: center;
  margin-right: 0;
}
.swipe-tab-indicator {
  width: 33.333%;
}
.swipe-track {
  width: 300%;
}
.swipe-panel {
  width: 33.333%;
}

</style>