<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div ref="modalEl" class="modal-container modal-container--cocktail">
      <div class="modal-header">
        <div class="cocktail-title-row" style="flex: 1;">
          <h2 class="modal-title" style="margin: 0;">{{ cocktail.name }}</h2>
          <span v-if="cocktail.abv != null" class="cocktail-abv-inline">{{ cocktail.abv }}°</span>
        </div>
        <button @click="$emit('close')" class="modal-close-btn"><X :size="20" /></button>
      </div>

      <div class="modal-body cv-modal-body">
        <div class="cocktail-view-layout">
          <div class="cv-image-col">
            <div v-if="cocktail.image" class="image-preview-large">
              <img :src="cocktail.image" alt="cocktail image" @error="imageError = true" v-if="!imageError" />
              <div v-else class="image-missing">Image introuvable</div>
            </div>
            <div v-else class="image-missing">Pas d'image</div>

            <div v-if="cocktail.profile?.length" class="profile-tags cv-profile-tags">
              {{ cocktail.profile.map(p => getProfileLabel(p, locale)).join(', ') }}
            </div>
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
                  <p v-if="cocktail.description" class="cocktail-description">{{ cocktail.description }}</p>
                  <p v-else class="cocktail-description cocktail-description--empty">Aucune description disponible pour ce cocktail.</p>

                  <div class="cv-meta-list">
                    <div v-if="cocktail.base_spirit" class="cv-meta-row">
                      <span class="form-label">Spirit</span>
                      <span>{{ getTypeLabel(cocktail.base_spirit, locale) }}</span>
                    </div>
                    <div v-if="cocktail.category" class="cv-meta-row">
                      <span class="form-label">Catégorie</span>
                      <span>{{ cocktail.category }}</span>
                    </div>
                    <div v-if="cocktail.creator && cocktail.creator !== 'Unknown'" class="cv-meta-row">
                      <span class="form-label">Créateur</span>
                      <span>{{ cocktail.creator }}</span>
                    </div>
                    <div v-if="cocktail.ice?.length" class="cv-meta-row">
                      <span class="form-label">Glace</span>
                      <span>{{ formatList(cocktail.ice) }}</span>
                    </div>
                    <div v-if="cocktail.season?.length" class="cv-meta-row">
                      <span class="form-label">Saison</span>
                      <span>{{ formatList(cocktail.season) }}</span>
                    </div>
                    <div v-if="cocktail.tags?.length" class="cv-meta-row">
                      <span class="form-label">Tags</span>
                      <span>{{ formatList(cocktail.tags) }}</span>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer cv-modal-footer">
        <div class="footer-left" style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
          <span v-if="cocktail.cocktail_style" class="badge-method">{{ styleLabel }}</span>
          <span v-if="cocktail.method && isBartenderMode" class="badge-method">{{ methodLabel }}</span>
          <span v-if="cocktail.glass && isBartenderMode" class="badge-method">{{ glassLabel }}</span>
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

          <button @click="$emit('close')" class="btn-modal-primary">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { X, Heart, GlassWater, Pencil, Trash2, Upload, Bookmark } from 'lucide-vue-next'
import { getTypeLabel, getProfileLabel } from '@/constants/typeLabels.js'
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
const STYLE_LABELS = {
  sour: '🍋 Sour', fizz: '🫧 Fizz', highball: '🥃 Highball', tiki: '🌺 Tiki',
  negroni: '🔴 Negroni', old_fashioned: '🟠 Old Fashioned', classic: '🎩 Classic',
  modern: '✨ Modern', creamy: '🥛 Creamy', flip: '🥚 Flip', spritz: '🍾 Spritz',
}
const styleLabel = computed(() => STYLE_LABELS[props.cocktail.cocktail_style] || props.cocktail.cocktail_style)

const METHOD_LABELS = {
  shake: '🍸 Shake', regal_shake: '🍸 Regal Shake', stir: '🥄 Stir', regal_stir: '🥄 Regal Stir',
  build: '🫗 Build', blend: '🌀 Blend', swizzle: '🌿 Swizzle', throw: '🤹 Throw',
}
const methodLabel = computed(() => METHOD_LABELS[props.cocktail.method] || props.cocktail.method)

const glassLabel = computed(() => props.cocktail.glass)

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
  const base = -activeTab.value * 50
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
  let percent = (dx / viewportWidth) * 50

  if ((activeTab.value === 0 && percent > 0) || (activeTab.value === 1 && percent < 0)) {
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
  if (dragDeltaPercent.value <= -threshold && activeTab.value === 0) {
    activeTab.value = 1
  } else if (dragDeltaPercent.value >= threshold && activeTab.value === 1) {
    activeTab.value = 0
  }
  isDragging.value = false
  dragDeltaPercent.value = 0
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowLeft') activeTab.value = 0
  if (e.key === 'ArrowRight') activeTab.value = 1
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
  text-align: center;
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
  border-radius: var(--radius-lg);
  background: var(--bg-input);
  color: var(--text-dim);
  font-size: 0.8rem;
  text-align: center;
  padding: 0.5rem;
}

.cocktail-description {
  margin: 0 0 0.75rem;
  color: var(--text);
  line-height: 1.5;
  font-size: 0.9rem;
}

.cocktail-description--empty {
  color: var(--text-dim);
  font-style: italic;
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
  margin-right: 1.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
  touch-action: pan-y;
}

.swipe-track {
  display: flex;
  width: 200%;
  height: 100%;
}

.swipe-track--dragging {
  transition: none !important;
}

.swipe-panel {
  width: 50%;
  flex-shrink: 0;
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
</style>