<template>
  <div ref="rootEl" class="landing-page">
    <main class="landing-hero" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div ref="mediaEl" class="landing-media" aria-hidden="true">
        <Transition name="landing-fade">
          <div
            v-if="photoReady"
            :key="activeSlide.image"
            class="landing-slide"
            :class="`landing-slide--${fit}`"
            :style="focalStyle"
          >
            <img v-if="fit === 'contain'" :src="activeSlide.image" alt="" class="landing-photo-backdrop" />
            <img :src="activeSlide.image" alt="" class="landing-photo" />
          </div>
        </Transition>
        <div v-if="!photoReady" class="landing-slide landing-slide--fallback"></div>
      </div>
      <div class="landing-shade" aria-hidden="true"></div>
      <div v-if="slides.length > 1" class="landing-dots" role="group">
        <button type="button" class="landing-arrow" :aria-label="t.prevPhoto" @click.stop="showPreviousPhoto">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button
          v-for="(slide, index) in slides"
          :key="slide.image || slide.id || index"
          type="button"
          class="landing-dot"
          :class="{ 'is-active': index === activeCocktailIndex }"
          :aria-label="`Photo ${index + 1} / ${slides.length}`"
          :aria-current="index === activeCocktailIndex ? 'true' : undefined"
          @click="select(index)"
        ></button>
        <button type="button" class="landing-arrow" :aria-label="t.nextPhoto" @click.stop="showNextPhoto">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div class="landing-inner">
        <div class="landing-copy">
          <p class="landing-eyebrow">{{ t.eyebrow }}</p>
          <h1>{{ t.title }}</h1>
          <p class="landing-intro">{{ t.intro }}</p>
        </div>

        <div v-if="activeSlide?.caption" class="landing-caption">
          {{ activeSlide.caption }}
        </div>

        <div ref="actionsEl" class="landing-actions">
          <section class="landing-action landing-action--drinker" aria-labelledby="landing-drinker">
            <div class="landing-action-heading">
              <h2 id="landing-drinker">Drinker</h2>
              <p>{{ t.drinkerText }}</p>
            </div>
            <form class="landing-join" @submit.prevent="emit('join-by-code')">
              <input
                :value="inviteCodeInput"
                type="text"
                :placeholder="t.codePlaceholder"
                :aria-label="t.codeLabel"
                autocomplete="off"
                @input="emit('update:inviteCodeInput', $event.target.value)"
              />
              <button type="submit" class="landing-button">{{ t.join }}</button>
            </form>
            <p v-if="codeError" class="landing-error" role="alert">{{ codeError }}</p>

            <div id="landing-public-bars" class="landing-public-bars" aria-live="polite">
              <p v-if="publicBarsLoading" class="landing-status">{{ t.loading }}</p>
              <p v-else-if="publicBarsError" class="landing-status" role="alert">{{ t.loadError }}</p>
              <p v-else-if="publicBars.length === 0" class="landing-status">{{ t.noBars }}</p>
              <template v-else>
                <h3 class="landing-list-title">{{ t.openBars }}</h3>
                <button
                  v-for="bar in publicBars"
                  :key="bar.id"
                  type="button"
                  class="landing-bar"
                  :aria-label="bar.name"
                  @click="emit('join-public-bar', bar)"
                >
                  <span class="landing-bar-name">{{ bar.name }}</span>
                  <span class="landing-bar-code">{{ bar.invite_code }}</span>
                </button>
              </template>
            </div>
          </section>

          <section class="landing-action landing-action--bartender" aria-labelledby="landing-bartender">
            <div class="landing-action-heading">
              <h2 id="landing-bartender">Bartender</h2>
              <p>{{ t.bartenderText }}</p>
            </div>
            <button type="button" class="landing-button" @click="emit('open-auth')">
              {{ t.bartenderCta }}
            </button>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  locale: { type: String, default: 'fr' },
  featuredBar: { type: Object, default: null },
  featuredCocktails: { type: Array, default: () => [] },
  landingPhotos: { type: Array, default: () => [] },
  publicBars: { type: Array, default: () => [] },
  publicBarsLoading: Boolean,
  publicBarsError: Boolean,
  inviteCodeInput: { type: String, default: '' },
  codeError: { type: String, default: '' },
})

const emit = defineEmits([
  'open-auth',
  'join-public-bar',
  'join-by-code',
  'update:inviteCodeInput',
])

const MESSAGES = {
  fr: {
    eyebrow: 'Cocktails · Stock · Recettes',
    title: 'Ton bar, ta carte, un seul code.',
    intro: 'Gère ton bar, partage ta carte. Tes invités n’ont plus qu’à choisir.',
    bartenderText: 'Gère ton stock et tes recettes.',
    bartenderCta: 'Créer ou accéder à mon bar',
    drinkerText: 'Explore la carte d’un bar avec son code.',
    codePlaceholder: 'Code du bar (ex : STAR-7514)',
    codeLabel: 'Code du bar',
    join: 'Rejoindre',
    loading: 'Chargement des bars…',
    loadError: 'Impossible de charger les bars. Réessaie plus tard.',
    prevPhoto: 'Photo précédente',
    nextPhoto: 'Photo suivante',
    noBars: 'Aucun bar ouvert pour le moment.',
    openBars: 'Bars ouverts',
  },
  en: {
    eyebrow: 'Cocktails · Inventory · Recipes',
    title: 'Your bar, your menu, one simple code.',
    intro: 'Manage your bar and share your menu. Your guests just have to choose.',
    bartenderText: 'Manage your inventory and recipes.',
    bartenderCta: 'Create or access my bar',
    drinkerText: 'Explore a bar menu with its code.',
    codePlaceholder: 'Bar code (e.g. STAR-7514)',
    codeLabel: 'Bar code',
    join: 'Join',
    loading: 'Loading bars…',
    loadError: 'Unable to load bars. Please try again later.',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    noBars: 'No open bars right now.',
    openBars: 'Open bars',
  },
}

const t = computed(() => MESSAGES[props.locale] || MESSAGES.fr)

// Carrousel
const activeCocktailIndex = ref(0)
const slides = computed(() => {
  if (props.landingPhotos.length) return props.landingPhotos
  return props.featuredCocktails.map((cocktail) => ({
    ...cocktail,
    caption: [cocktail.name, props.featuredBar?.name].filter(Boolean).join(' · '),
  }))
})
const activeSlide = computed(() => slides.value[activeCocktailIndex.value] || null)
let carouselTimer
let navToken = 0
let prefersReducedMotion = false

watch(() => slides.value.length, () => {
  activeCocktailIndex.value = 0
})

// ── Ajustement de la photo (cover vs contain) ─────────
// cover  : la photo remplit la zone, recadrée autour de son point focal.
// contain: photo entière sur fond flouté, uniquement si son ratio est trop éloigné
//          de celui de la zone (ex. portrait sur écran large) pour être recadrée proprement.
const MAX_RATIO_GAP = 1.5
const DEFAULT_FOCAL = { x: 50, y: 45 }

const mediaEl = ref(null)
const mediaRatio = ref(0)
const ratios = reactive({}) // url → ratio l/h (-1 si échec de chargement)
const pending = new Map()
let resizeObserver

function measure(slide) {
  const url = slide?.image
  if (!url) return Promise.resolve()
  if (url in ratios) return Promise.resolve()
  if (!pending.has(url)) {
    pending.set(url, new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        ratios[url] = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : -1
        resolve()
      }
      img.onerror = () => {
        ratios[url] = -1
        resolve()
      }
      img.src = url
    }))
  }
  return pending.get(url)
}

const photoReady = computed(() => !!activeSlide.value && ratios[activeSlide.value.image] > 0)

const fit = computed(() => {
  const ratio = ratios[activeSlide.value?.image]
  if (!(ratio > 0) || !(mediaRatio.value > 0)) return 'cover'
  const gap = Math.max(ratio / mediaRatio.value, mediaRatio.value / ratio)
  return gap > MAX_RATIO_GAP ? 'contain' : 'cover'
})

const focalStyle = computed(() => {
  const focal = activeSlide.value?.focal || DEFAULT_FOCAL
  return { '--focal': `${focal.x}% ${focal.y}%` }
})

watch(activeSlide, (slide) => measure(slide), { immediate: true })

// ── Navigation ────────────────────────────────────────
async function goTo(index) {
  const count = slides.value.length
  if (!count) return
  const target = ((index % count) + count) % count
  const token = ++navToken
  await measure(slides.value[target]) // précharge avant de changer
  if (token !== navToken || target >= slides.value.length) return
  activeCocktailIndex.value = target
}

function stopAutoplay() {
  window.clearInterval(carouselTimer)
}

function startAutoplay() {
  stopAutoplay()
  if (prefersReducedMotion) return
  carouselTimer = window.setInterval(() => {
    if (slides.value.length > 1) goTo(activeCocktailIndex.value + 1)
  }, 6000)
}

// Action utilisateur : navigue puis relance le minuteur pour laisser le temps de voir la photo
function select(index) {
  if (index === activeCocktailIndex.value) return
  startAutoplay()
  goTo(index)
}

function showPreviousPhoto() {
  select(activeCocktailIndex.value - 1)
}

function showNextPhoto() {
  select(activeCocktailIndex.value + 1)
}

// Swipe horizontal (mobile)
let touchStart = null
function onTouchStart(event) {
  if (event.target.closest('input, textarea') || event.touches.length !== 1) {
    touchStart = null
    return
  }
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }
}
function onTouchEnd(event) {
  if (!touchStart || slides.value.length < 2) return
  const touch = event.changedTouches[0]
  const dx = touch.clientX - touchStart.x
  const dy = touch.clientY - touchStart.y
  touchStart = null
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  select(activeCocktailIndex.value + (dx < 0 ? 1 : -1))
}

function updateMediaRatio() {
  const el = mediaEl.value
  if (!el) return
  const { width, height } = el.getBoundingClientRect()
  mediaRatio.value = height > 0 ? width / height : 0
}

// ── Hauteur mobile : tient exactement entre le header et le footer de l'app ──
const rootEl = ref(null)
let bodyObserver
let lastFitHeight = 0

function fitLandingHeight() {
  const el = rootEl.value
  if (!el) return
  if (!window.matchMedia('(max-width: 520px)').matches) {
    el.style.removeProperty('--landing-h')
    el.style.removeProperty('--landing-footer-h')
    el.style.removeProperty('--landing-media-h')
    lastFitHeight = 0
    return
  }
  // Footer transparent superposé à la photo : on réserve sa hauteur en bas du contenu
  const footer = document.querySelector('.footer-martini--landing')
  const overlaid = !!footer && getComputedStyle(footer).position === 'absolute'
  el.style.setProperty('--landing-footer-h', overlaid ? `${footer.offsetHeight}px` : '0px')

  const rect = el.getBoundingClientRect()
  const top = rect.top + window.scrollY
  const below = Math.max(0, document.documentElement.scrollHeight - (rect.bottom + window.scrollY))
  const height = Math.round(Math.max(320, window.innerHeight - top - below))
  if (height !== lastFitHeight) {
    lastFitHeight = height
    el.style.setProperty('--landing-h', `${height}px`)
  }
  fitMedia()
}

// La photo s'arrête au sommet du panneau d'actions : elle n'est plus masquée par lui
const actionsEl = ref(null)
function fitMedia() {
  const el = rootEl.value
  const panel = actionsEl.value
  if (!el || !panel) return
  const top = panel.getBoundingClientRect().top - el.getBoundingClientRect().top
  el.style.setProperty('--landing-media-h', `${Math.max(0, Math.round(top))}px`)
}

onMounted(() => {
  fitLandingHeight()
  window.addEventListener('resize', fitLandingHeight)
  if (typeof ResizeObserver !== 'undefined') {
    bodyObserver = new ResizeObserver(fitLandingHeight)
    bodyObserver.observe(document.body)
    const footerEl = document.querySelector('.footer-martini--landing')
    if (footerEl) bodyObserver.observe(footerEl)
    if (actionsEl.value) bodyObserver.observe(actionsEl.value)
  }
  updateMediaRatio()
  if (typeof ResizeObserver !== 'undefined' && mediaEl.value) {
    resizeObserver = new ResizeObserver(updateMediaRatio)
    resizeObserver.observe(mediaEl.value)
  }

  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  startAutoplay()
  document.documentElement.classList.add('landing-lock')
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitLandingHeight)
  bodyObserver?.disconnect()
  document.documentElement.classList.remove('landing-lock')
  stopAutoplay()
  resizeObserver?.disconnect()
})
</script>

<style scoped>
/*
 * Tout passe par les variables du skin (--gold, --bg-card, --radius-*, --font-*).
 * Seul le texte posé sur la photo utilise des tons fixes (clair sur voile sombre),
 * identiques quel que soit le skin.
 */
.landing-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  --hero-ink: #f6f1e7;
  --hero-ink-soft: color-mix(in srgb, var(--hero-ink) 82%, transparent);
  --hero-veil: #0d0806;
  color: var(--text);
  font-family: var(--font-body, inherit);
}

/* ── Hero ─────────────────────────────────────────── */
.landing-hero {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 30rem;
  padding: 3.5rem clamp(1.5rem, 5vw, 4rem) 8rem;
  overflow: hidden;
  background: var(--hero-veil);
  color: var(--hero-ink);
  isolation: isolate;
}

.landing-inner {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.landing-media {
  position: absolute;
  z-index: -2;
  inset: 0;
  overflow: hidden;
}

.landing-slide {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.landing-slide--fallback {
  background:
    radial-gradient(circle at 72% 45%, color-mix(in srgb, var(--gold) 35%, transparent), transparent 40%),
    linear-gradient(120deg, var(--hero-veil), color-mix(in srgb, var(--hero-veil) 80%, var(--gold)) 60%, var(--hero-veil));
}

.landing-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.landing-slide--cover .landing-photo {
  object-fit: cover;
  object-position: var(--focal, 50% 45%);
}

.landing-slide--contain .landing-photo {
  object-fit: contain;
  object-position: center 45%;
}

.landing-photo-backdrop {
  position: absolute;
  inset: -1rem;
  width: calc(100% + 2rem);
  height: calc(100% + 2rem);
  object-fit: cover;
  object-position: var(--focal, 50% 45%);
  filter: blur(1rem) brightness(0.55);
}

.landing-shade {
  position: absolute;
  z-index: -1;
  inset: 0;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--hero-veil) 93%, transparent), color-mix(in srgb, var(--hero-veil) 60%, transparent) 45%, transparent 75%),
    linear-gradient(0deg, color-mix(in srgb, var(--hero-veil) 87%, transparent), transparent 45%);
}

.landing-shade::after {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  content: '';
  opacity: 0.14;
  pointer-events: none;
  mix-blend-mode: soft-light;
}

.landing-caption {
  position: absolute;
  z-index: 1;
  bottom: 7rem;
  left: clamp(1.5rem, 5vw, 4rem);
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius-control);
  background: rgba(13, 8, 6, 0.58);
  color: #fff;
  font-size: 0.8rem;
  backdrop-filter: blur(6px);
}

.landing-dots {
  position: absolute;
  z-index: 10;
  pointer-events: auto;
  bottom: 5.25rem;
  left: 50%;
  display: flex;
  flex-wrap: wrap;
  max-width: calc(100% - 3rem);
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
}

.landing-arrow {
  position: relative;
  z-index: 1;
  display: grid;
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  opacity: 0.6;
  pointer-events: auto;
  place-items: center;
  touch-action: manipulation;
  transition: opacity 0.2s ease;
}

.landing-arrow:hover {
  opacity: 1;
}

.landing-arrow:focus-visible {
  border-radius: 999px;
  opacity: 1;
  outline: 2px solid #fff;
  outline-offset: -2px;
}

.landing-arrow svg {
  width: 1rem;
  height: 1rem;
  filter: drop-shadow(0 0 2px rgba(13, 8, 6, 0.6));
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.landing-dot {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  place-items: center;
}

.landing-dot::before {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(13, 8, 6, 0.35);
  content: "";
  transition: width 0.25s ease, background-color 0.25s ease;
}

.landing-dot:hover::before {
  background: rgba(255, 255, 255, 0.8);
}

.landing-dot.is-active::before {
  width: 1.25rem;
  background: #fff;
}

.landing-dot:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -2px;
  border-radius: 999px;
}

.landing-caption b {
  color: #fff;
  font-weight: 600;
}

/* ── Texte ────────────────────────────────────────── */
.landing-copy {
  position: relative;
  flex: 1 1 0;
  align-self: center;
  min-width: 0;
  max-width: 48rem;
}

.landing-eyebrow {
  margin: 0;
  color: var(--hero-ink-soft);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.landing-copy h1 {
  margin: 0.9rem 0 1rem;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 4.2vw, 4.5rem);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: 0.01em;
}

.landing-intro {
  margin: 0;
  color: var(--hero-ink-soft);
  font-size: 1.1rem;
  line-height: 1.55;
}

/* ── Cartes d'action ──────────────────────────────── */
.landing-actions {
  position: relative;
  display: grid;
  flex: none;
  width: min(100%, clamp(24rem, 28.5vw, 34rem));
  gap: clamp(0.6rem, 0.8vw, 0.9rem);
}

.landing-action {
  min-width: 0;
  padding: clamp(0.85rem, 1.1vw, 1.25rem);
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background: color-mix(in srgb, var(--bg-card) 94%, transparent);
  color: var(--text);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(12px);
}

.landing-action--bartender,
.landing-action--drinker {
  display: grid;
  gap: clamp(0.7rem, 0.9vw, 1rem);
}

.landing-action-heading {
  margin-bottom: 0.6rem;
  text-align: left;
}

.landing-action--bartender .landing-action-heading,
.landing-action--drinker .landing-action-heading {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  min-width: 0;
  margin-bottom: 0;
}

.landing-action--bartender .landing-action-heading h2 {
  flex: none;
  margin: 0;
}

.landing-action--drinker .landing-action-heading h2 {
  flex: none;
  margin: 0;
}

.landing-action--bartender .landing-action-heading p,
.landing-action--drinker .landing-action-heading p {
  flex: 1;
  min-width: 0;
  margin-left: auto;
  text-align: right;
}

.landing-action-heading h2 {
  margin: 0 0 0.35rem;
  color: var(--gold);
  font-family: var(--font-subtitle, var(--font-body, inherit));
  font-size: clamp(0.8rem, 0.9vw, 1rem);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.landing-action-heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: clamp(0.8rem, 0.9vw, 1rem);
  line-height: 1.45;
}

.landing-action > .landing-button {
  min-width: 12rem;
}

.landing-action--bartender > .landing-button {
  width: 100%;
}

.landing-action--drinker .landing-action-heading {
  margin-bottom: 0;
}

.landing-action--drinker .landing-join {
  margin-top: 0;
}

/* ── Contrôles ────────────────────────────────────── */
.landing-button,
.landing-join input {
  min-height: clamp(2.2rem, 2.5vw, 2.6rem);
  border-radius: var(--radius-control);
  font-family: inherit;
  font-size: clamp(0.85rem, 0.9vw, 1rem);
  line-height: 1.2;
}

.landing-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  border: 0;
  background: var(--gold);
  color: var(--bg);
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.landing-button:hover {
  filter: brightness(1.12);
}

.landing-join {
  display: flex;
  gap: 0.6rem;
}

.landing-join input {
  min-width: 0;
  flex: 1;
  padding: 0 0.9rem;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
}

.landing-join input::placeholder {
  color: var(--text-muted);
  opacity: 1;
}

.landing-button:focus-visible,
.landing-bar:focus-visible,
.landing-join input:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.landing-error {
  margin: 0.5rem 0 0;
  color: var(--danger);
  font-size: 0.85rem;
}

/* ── Liste des bars ───────────────────────────────── */
.landing-public-bars {
  display: grid;
  gap: 0.35rem;
  max-height: min(20rem, 45vh);
  margin-top: 0.65rem;
  padding-top: 0.5rem;
  padding-right: 2px;
  border-top: 1px solid var(--border);
  overflow: auto;
}

.landing-list-title {
  margin: 0;
  padding: 0.15rem 0 0.4rem;
  color: var(--gold);
  font-family: var(--font-subtitle, var(--font-body, inherit));
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.landing-status {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.landing-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--bg);
  font-size: 0.75rem;
  color: var(--text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: color 0.12s ease, background 0.12s ease, border-color 0.12s ease;
}

.landing-bar:hover {
  border-color: var(--gold-dim);
  background: var(--bg-raised);
  color: var(--gold-dim);
}

.landing-bar:focus-visible {
  position: relative;
  z-index: 1;
  outline-offset: -2px;
}

.landing-bar-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.landing-bar-code {
  flex: none;
  color: var(--text-muted);
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
}

/* ── Transition ───────────────────────────────────── */
.landing-fade-enter-active,
.landing-fade-leave-active {
  transition: opacity 1s ease;
}

.landing-fade-enter-from,
.landing-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .landing-fade-enter-active,
  .landing-fade-leave-active,
  .landing-button,
  .landing-bar {
    transition-duration: 0.01ms;
  }

  .landing-dot::before,
  .landing-arrow {
    transition: none;
  }
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 900px) {
  .landing-hero {
    padding-top: 4.5rem;
  }

  .landing-inner {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
  }

  .landing-copy {
    align-self: flex-start;
    width: 100%;
    max-width: none;
  }

  .landing-actions {
    width: 100%;
    max-width: 26rem;
  }

  .landing-caption {
    bottom: 7rem;
    left: 1.5rem;
    width: fit-content;
  }
}

@media (min-width: 901px) and (max-width: 1600px) {
  .landing-copy h1 {
    font-size: clamp(2.4rem, 3.8vw, 4.1rem);
  }

  .landing-actions {
    width: min(100%, clamp(21.7rem, 25.7vw, 30.7rem));
  }

  .landing-action {
    padding: clamp(0.75rem, 0.95vw, 1.1rem);
  }

  .landing-action--bartender,
  .landing-action--drinker {
    gap: clamp(0.6rem, 0.8vw, 0.9rem);
  }

  .landing-action-heading h2,
  .landing-action-heading p {
    font-size: clamp(0.78rem, 0.8vw, 0.9rem);
  }

  .landing-button,
  .landing-join input {
    min-height: clamp(2rem, 2.25vw, 2.35rem);
    font-size: clamp(0.82rem, 0.8vw, 0.9rem);
  }
}

@media (min-width: 901px) and (max-height: 800px) {
  .landing-hero {
    padding-top: clamp(1.5rem, 4vh, 2.5rem);
    padding-bottom: clamp(4rem, 7vh, 5.5rem);
  }

  .landing-actions {
    gap: 0.5rem;
  }

  .landing-action {
    padding: 0.8rem;
  }

  .landing-action--bartender,
  .landing-action--drinker {
    gap: 0.6rem;
  }
}

/* ── Mobile : un écran, photo plein cadre, actions en bas ── */
@media (max-width: 520px) {
  /* Hauteur figée = écran (moins un éventuel header de l'app) → pas de scroll */
  .landing-page {
    flex: none;
    height: var(--landing-h, calc(100dvh - var(--app-header-h, 0px) - var(--app-footer-h, 0px)));
    overflow: hidden;
  }

  .landing-hero {
    flex: 1;
    height: 100%;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .landing-inner {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 0;
    min-height: 0;
    box-sizing: border-box;
    padding:
      1rem
      1rem
      calc(env(safe-area-inset-bottom, 0px) + var(--landing-footer-h, 0px) + 2rem);
  }

  /* Photo limitée à la zone au-dessus du panneau, fondu vers le fond en bas */
  .landing-media,
  .landing-shade {
    bottom: auto;
    /* La photo passe un peu sous le panneau au lieu de s'arrêter net à son bord */
    height: calc(var(--landing-media-h, 60%) + 3rem);
  }

  .landing-shade {
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--hero-veil) 80%, transparent) 0%,
      transparent 36%,
      transparent 62%,
      var(--hero-veil) 100%
    );
  }

  /* Léger zoom centré sur le point focal */
  .landing-photo {
    transform: translateY(3%) scale(1.1);
    transform-origin: var(--focal, 50% 45%);
  }

  .landing-slide--contain .landing-photo {
    object-fit: cover;
    object-position: var(--focal, 50% 45%);
  }

  .landing-photo-backdrop {
    display: none;
  }

  /* Titre */
  .landing-copy {
    flex: none;
    max-width: none;
    padding: 0;
  }

  .landing-copy h1 {
    margin: 0.6rem 0 0.5rem;
    font-size: clamp(2rem, 9vw, 2.6rem);
  }

  .landing-intro {
    font-size: 0.9rem;
  }

  .landing-eyebrow {
    font-size: 0.65rem;
  }

  /* Pas de dots ni de flèches sur mobile (swipe uniquement) */
  .landing-dots {
    display: none;
  }

  /* Légende juste au-dessus du panneau */
  .landing-caption {
    position: static;
    align-self: flex-start;
    margin: auto 0 0.75rem;
    padding: 0.35rem 0.65rem;
    font-size: 0.7rem;
  }

  /* Panneau d'actions */
  .landing-actions {
    width: 100%;
    max-width: none;
    margin-top: auto;
    gap: 0.9rem;
    padding: 0.9rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-panel);
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    backdrop-filter: blur(14px);
    box-shadow: var(--shadow-sm);
  }

  .landing-caption + .landing-actions {
    margin-top: 0;
  }

  .landing-action {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
    gap: 0.6rem;
  }

  .landing-action-heading p {
    display: none;
  }

  /* Drinker = action principale */
  .landing-join {
    gap: 0.4rem;
  }

  .landing-button,
  .landing-join input {
    min-height: 2.6rem;
    font-size: 0.85rem;
  }

  /* Bars ouverts : chips scrollables */
  .landing-public-bars {
    display: flex;
    gap: 0.4rem;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .landing-public-bars::-webkit-scrollbar {
    display: none;
  }

  .landing-list-title,
  .landing-bar-code {
    display: none;
  }

  .landing-bar {
    flex: none;
    width: auto;
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.78rem;
  }

  .landing-status {
    font-size: 0.75rem;
    white-space: nowrap;
  }

  /* Bartender = action secondaire (contour), séparée du bloc Drinker */
  .landing-action--bartender {
    padding-top: 0.9rem;
    border-top: 1px solid var(--border);
  }

  .landing-action--bartender .landing-action-heading {
    display: none;
  }

  .landing-action--bartender > .landing-button {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--gold);
    background: transparent;
    color: var(--gold);
  }
}

/* Pas de scroll de page derrière la landing (mobile) */
@media (max-width: 520px) {
  :global(html.landing-lock),
  :global(html.landing-lock body) {
    overflow: hidden;
    overscroll-behavior: none;
  }
}

/* Mobile peu haut (petits iPhone, barre d'URL visible) : on compacte */
@media (max-width: 520px) and (max-height: 720px) {
  .landing-eyebrow,
  .landing-intro {
    display: none;
  }

  .landing-copy h1 {
    font-size: clamp(1.7rem, 8vw, 2.2rem);
  }

  .landing-actions {
    gap: 0.6rem;
    padding: 0.7rem;
  }

  .landing-button,
  .landing-join input {
    min-height: 2.4rem;
  }
}
</style>