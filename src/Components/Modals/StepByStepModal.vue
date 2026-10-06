<!--
  StepByStepModal.vue
  Mode pas à pas : prépare un cocktail étape par étape, en plein écran,
  avec de gros caractères, un minuteur pour shake/stir, et l'écran maintenu
  allumé (Screen Wake Lock) — pensé pour le téléphone posé sur le plan de travail.

  Les étapes sont générées par buildSteps() (composables/useCocktailSteps.js)
  à partir de method / glass / ice / recipe.

  Props:
    - open: Boolean
    - cocktail: objet bar_cocktails (name, method, glass, ice, recipe)
    - unit: 'oz' | 'ml'
    - locale: 'fr' | 'en'
    - isBartenderMode / barId / cardId : pour proposer « +1 préparé » à la fin
  Emits:
    - close

  Clavier : ← / → naviguent, Échap ferme. Swipe gauche/droite sur mobile.
-->
<template>
  <transition name="fade">
    <div
      v-if="open && current"
      ref="rootEl"
      class="sbs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sbs-title"
      tabindex="-1"
    >
      <!-- En-tête -->
      <header class="sbs-header">
        <div class="sbs-heading">
          <h2 id="sbs-title" class="sbs-name">{{ cocktail?.name }}</h2>
          <span class="sbs-counter">{{ index + 1 }} / {{ steps.length }}</span>
        </div>
        <span v-if="wakeLock.active.value" class="sbs-awake" :title="t.awake">
          <Sun :size="16" aria-hidden="true" />
          <span class="sr-only">{{ t.awake }}</span>
        </span>
        <button type="button" class="sbs-close" :aria-label="t.close" @click="$emit('close')">
          <X :size="22" />
        </button>
      </header>

      <!-- Progression -->
      <nav class="sbs-dots" :aria-label="t.stepsNav">
        <button
          v-for="(s, i) in steps"
          :key="s.id"
          type="button"
          class="sbs-dot"
          :class="{ 'is-done': i < index, 'is-current': i === index }"
          :aria-label="`${t.step} ${i + 1}`"
          :aria-current="i === index ? 'step' : undefined"
          @click="goTo(i)"
        />
      </nav>

      <!-- Étape courante (swipe horizontal) -->
      <main class="sbs-main" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
        <div :key="current.id" class="sbs-card" aria-live="polite">
          <p class="sbs-kicker">{{ current.kicker }}</p>
          <h3 class="sbs-title">{{ current.title }}</h3>

          <!-- Mise en place : checklist -->
          <ul v-if="current.kind === 'mise'" class="sbs-checklist">
            <li v-for="item in current.items" :key="item.key" :class="{ 'is-missing': !item.available }">
              <label class="sbs-check">
                <input v-model="checked[item.key]" type="checkbox" />
                <span class="sbs-check-label">{{ item.label }}</span>
              </label>
              <span v-if="item.qty" class="sbs-check-qty">{{ item.qty }}</span>
              <TriangleAlert v-if="!item.available" :size="16" class="sbs-check-warn" :aria-label="t.missing" />
            </li>
          </ul>

          <!-- Autres étapes -->
          <template v-else>
            <p v-if="current.qty" class="sbs-qty">{{ current.qty }}</p>
            <p v-if="current.reference" class="sbs-ref">{{ current.reference }}</p>
            <p v-if="current.text" class="sbs-text">{{ current.text }}</p>

            <p v-if="current.available === false" class="sbs-warn" role="status">
              <TriangleAlert :size="18" aria-hidden="true" /> {{ t.missing }}
            </p>

            <!-- Minuteur -->
            <div v-if="current.timerSeconds" class="sbs-timer">
              <template v-if="countdown.running.value || countdown.finished.value || countdown.remaining.value > 0">
                <span class="sbs-timer-value" :class="{ 'is-finished': countdown.finished.value }" role="timer">
                  {{ formatTime(countdown.remaining.value) }}
                </span>
                <p v-if="countdown.finished.value" class="sbs-timer-done" role="status">
                  <Check :size="18" aria-hidden="true" /> {{ t.timerDone }}
                </p>
                <button type="button" class="sbs-btn sbs-btn--ghost" @click="countdown.reset()">
                  <RotateCcw :size="18" aria-hidden="true" /> {{ t.timerReset }}
                </button>
              </template>
              <button v-else type="button" class="sbs-btn sbs-btn--accent" @click="countdown.start(current.timerSeconds)">
                <Play :size="18" aria-hidden="true" /> {{ t.timerStart(current.timerSeconds) }}
              </button>
            </div>

            <!-- Fin : compter la préparation (même fonctionnalité que la fiche détail) -->
            <div v-if="current.kind === 'done' && isBartenderMode" class="sbs-count">
              <span>{{ t.countPrep }}</span>
              <PrepareButton
                :cocktail-id="cocktail.id"
                :cocktail-name="cocktail.name"
                :bar-id="barId"
                :card-id="cardId"
                :locale="locale"
              />
            </div>
          </template>
        </div>
      </main>

      <!-- Navigation (zone du pouce) -->
      <footer class="sbs-footer">
        <button type="button" class="sbs-btn sbs-btn--ghost sbs-nav" :disabled="isFirst" @click="prev">
          <ChevronLeft :size="22" aria-hidden="true" /> {{ t.prev }}
        </button>
        <button type="button" class="sbs-btn sbs-btn--primary sbs-nav" @click="next">
          {{ isLast ? t.finish : t.next }}
          <component :is="isLast ? Check : ChevronRight" :size="22" aria-hidden="true" />
        </button>
      </footer>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { X, ChevronLeft, ChevronRight, Check, Sun, Play, RotateCcw, TriangleAlert } from 'lucide-vue-next'
import { buildSteps } from '@/composables/useCocktailSteps'
import { useWakeLock } from '@/composables/useWakeLock'
import { useCountdown } from '@/composables/useCountdown'
import { useInventory } from '@/composables/useInventory'
import PrepareButton from '@/Components/PrepareButton.vue'

const props = defineProps({
  open:            { type: Boolean, default: false },
  cocktail:        { type: Object,  default: () => null },
  unit:            { type: String,  default: 'oz' },
  locale:          { type: String,  default: 'fr' },
  isBartenderMode: { type: Boolean, default: false },
  barId:           { type: String,  default: '' },
  cardId:          { type: String,  default: null },
})
const emit = defineEmits(['close'])

const { barInventory, ingredientsByIngredient } = useInventory()
const wakeLock  = useWakeLock()
const countdown = useCountdown()

// ── Textes UI ────────────────────────────────────────────────────────────────
const STRINGS = {
  fr: {
    close: 'Fermer', prev: 'Précédent', next: 'Suivant', finish: 'Terminer',
    step: 'Étape', stepsNav: 'Étapes de la recette',
    missing: 'Pas dans ton inventaire',
    awake: 'Écran maintenu allumé',
    timerStart: (s) => `Lancer ${s} s`, timerReset: 'Réinitialiser', timerDone: 'Terminé !',
    countPrep: 'Compter cette préparation',
  },
  en: {
    close: 'Close', prev: 'Previous', next: 'Next', finish: 'Finish',
    step: 'Step', stepsNav: 'Recipe steps',
    missing: 'Not in your inventory',
    awake: 'Screen kept awake',
    timerStart: (s) => `Start ${s} s`, timerReset: 'Reset', timerDone: 'Done!',
    countPrep: 'Count this preparation',
  },
}
const t = computed(() => STRINGS[props.locale] ?? STRINGS.fr)

// ── Étapes ───────────────────────────────────────────────────────────────────
function isAvailable(ing) {
  if (ing.Ingredient === 'garnish') return true
  return barInventory.value.has(ing.Ingredient)
}

const steps = computed(() =>
  buildSteps(props.cocktail, {
    locale: props.locale,
    unit: props.unit,
    ingredientsMap: ingredientsByIngredient.value,
    isAvailable,
  })
)

const index   = ref(0)
const checked = reactive({})
const current = computed(() => steps.value[index.value] ?? null)
const isFirst = computed(() => index.value === 0)
const isLast  = computed(() => index.value === steps.value.length - 1)

function goTo(i)   { index.value = i }
function prev()    { if (!isFirst.value) index.value-- }
function advance() { if (!isLast.value) index.value++ }
function next()    { isLast.value ? emit('close') : advance() }

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Nouvelle étape → minuteur remis à zéro. Nouveau cocktail → on repart du début.
watch(index, () => countdown.reset())
watch(() => props.cocktail?.id, () => {
  index.value = 0
  countdown.reset()
  Object.keys(checked).forEach((k) => delete checked[k])
})

// ── Swipe ────────────────────────────────────────────────────────────────────
let touchStart = null
function onTouchStart(e) {
  const p = e.changedTouches[0]
  touchStart = { x: p.clientX, y: p.clientY }
}
function onTouchEnd(e) {
  if (!touchStart) return
  const p = e.changedTouches[0]
  const dx = p.clientX - touchStart.x
  const dy = p.clientY - touchStart.y
  touchStart = null
  // Geste franchement horizontal uniquement : le scroll vertical reste libre
  if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  dx < 0 ? advance() : prev()
}

// ── Cycle de vie : clavier, focus, scroll, écran allumé ─────────────────────
const rootEl = ref(null)
let prevFocus = null
let prevOverflow = ''
let active = false

// Écouteur en phase de capture + stopPropagation : la fiche détail en dessous
// écoute aussi Échap / ← / → sur document, et ne doit pas réagir en même temps.
function onKeydown(e) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
  } else if (e.key === 'ArrowRight') {
    e.stopPropagation()
    advance()
  } else if (e.key === 'ArrowLeft') {
    e.stopPropagation()
    prev()
  } else if (e.key === 'Tab') {
    trapFocus(e)
  }
}

function trapFocus(e) {
  const nodes = rootEl.value?.querySelectorAll('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
  if (!nodes?.length) return
  const first = nodes[0]
  const last  = nodes[nodes.length - 1]
  if (e.shiftKey && (document.activeElement === first || document.activeElement === rootEl.value)) {
    e.preventDefault(); last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus()
  }
}

function activate() {
  if (active) return
  active = true
  prevFocus = document.activeElement
  prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown, true)
  wakeLock.request()
  nextTick(() => rootEl.value?.focus())
}

function deactivate() {
  if (!active) return
  active = false
  window.removeEventListener('keydown', onKeydown, true)
  document.body.style.overflow = prevOverflow
  wakeLock.release()
  countdown.reset()
  prevFocus?.focus?.()
  prevFocus = null
}

watch(() => props.open, (isOpen) => (isOpen ? activate() : deactivate()), { immediate: true })
onBeforeUnmount(deactivate)
</script>

<style scoped>
.sbs {
  position: fixed;
  inset: 0;
  z-index: 100; /* au-dessus de .modal-overlay (50) et de la fiche détail */
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--bg, #14110f);
  color: var(--text, #f4ece1);
  outline: none;
}

/* ── En-tête ── */
.sbs-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem 0.25rem;
}
.sbs-heading { flex: 1; min-width: 0; }
.sbs-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sbs-counter { font-size: 0.8rem; color: var(--text-muted, #a89a88); font-variant-numeric: tabular-nums; }
.sbs-awake { display: inline-flex; color: var(--gold, #d4a24c); }
.sbs-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px;
  border: 0; border-radius: 50%;
  background: transparent; color: inherit; cursor: pointer;
}
.sbs-close:hover { background: var(--bg-raised, rgba(255,255,255,0.08)); }

/* ── Progression ── */
.sbs-dots { display: flex; gap: 6px; padding: 0.5rem 1rem; }
.sbs-dot {
  flex: 1;
  height: 6px;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: var(--border, rgba(255,255,255,0.18));
  cursor: pointer;
  position: relative;
}
/* zone de clic plus grande que la barre visible */
.sbs-dot::after { content: ''; position: absolute; inset: -12px 0; }
.sbs-dot.is-done    { background: var(--gold-dim, #8d6a2e); }
.sbs-dot.is-current { background: var(--gold, #d4a24c); }

/* ── Carte d'étape ── */
.sbs-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.25rem;
  overflow-y: auto;
  touch-action: pan-y; /* laisse le scroll vertical, on gère le swipe horizontal */
}
.sbs-card {
  width: 100%;
  max-width: 34rem;
  text-align: center;
  animation: sbs-in 0.22s ease-out;
}
.sbs-kicker {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted, #a89a88);
}
.sbs-title {
  margin: 0 0 1rem;
  font-size: clamp(1.6rem, 6.5vw, 2.5rem);
  line-height: 1.15;
  font-weight: 700;
}
.sbs-qty {
  margin: 0 0 0.5rem;
  font-size: clamp(2.6rem, 14vw, 4.75rem);
  line-height: 1;
  font-weight: 800;
  color: var(--gold, #d4a24c);
  font-variant-numeric: tabular-nums;
}
.sbs-ref  { margin: 0 0 0.75rem; font-size: 0.9rem; color: var(--text-muted, #a89a88); }
.sbs-text { margin: 0; font-size: clamp(1.05rem, 4vw, 1.3rem); line-height: 1.45; color: var(--text, #f4ece1); }
.sbs-warn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  margin: 1rem 0 0;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 0.9rem;
  color: var(--danger, #e0645c);
  background: color-mix(in srgb, var(--danger, #e0645c) 14%, transparent);
}

/* ── Checklist (mise en place) ── */
.sbs-checklist { list-style: none; margin: 0; padding: 0; text-align: left; }
.sbs-checklist li {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.7rem 0.25rem;
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.12));
}
.sbs-check { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; cursor: pointer; }
.sbs-check input { width: 22px; height: 22px; accent-color: var(--gold, #d4a24c); flex: none; }
.sbs-check-label { font-size: 1.05rem; }
.sbs-check input:checked + .sbs-check-label { opacity: 0.5; text-decoration: line-through; }
.sbs-check-qty { font-variant-numeric: tabular-nums; color: var(--gold, #d4a24c); font-weight: 600; }
.sbs-check-warn { color: var(--danger, #e0645c); flex: none; }
.sbs-checklist li.is-missing .sbs-check-label { color: var(--danger, #e0645c); }

/* ── Minuteur ── */
.sbs-timer { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-top: 1.5rem; }
.sbs-timer-value {
  font-size: clamp(3rem, 18vw, 5.5rem);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.sbs-timer-value.is-finished { color: var(--success, #3fa86b); }
.sbs-timer-done { display: inline-flex; align-items: center; gap: 0.4rem; margin: 0; color: var(--success, #3fa86b); font-weight: 600; }

/* ── Compter la préparation ── */
.sbs-count { display: inline-flex; align-items: center; gap: 0.75rem; margin-top: 1.5rem; }

/* ── Boutons / navigation ── */
.sbs-footer { display: flex; gap: 0.75rem; padding: 0.75rem 1rem 1rem; }
.sbs-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  min-height: 56px;
  padding: 0 1.25rem;
  border: 1px solid transparent;
  border-radius: var(--radius-lg, 14px);
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.sbs-btn:active { transform: scale(0.98); }
.sbs-btn:disabled { opacity: 0.35; cursor: default; }
.sbs-btn--primary { background: var(--gold, #d4a24c); color: #1a1208; }
.sbs-btn--accent  { background: var(--gold, #d4a24c); color: #1a1208; min-width: 12rem; }
.sbs-btn--ghost   { background: transparent; color: inherit; border-color: var(--border, rgba(255,255,255,0.25)); }
.sbs-nav { flex: 1; }
.sbs-footer .sbs-btn--primary { flex: 1.4; }

.sbs :focus-visible { outline: 2px solid var(--gold, #d4a24c); outline-offset: 2px; }

@keyframes sbs-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sbs-card { animation: none; }
  .sbs-btn { transition: none; }
}
</style>