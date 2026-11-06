<template>
  <div class="landing-page">
    <main class="landing-hero">
      <Transition name="landing-fade">
        <div v-if="activeSlide" :key="activeSlide.id" class="landing-slide" aria-hidden="true">
          <img :src="activeSlide.image" alt="" class="landing-photo-backdrop" />
          <img :src="activeSlide.image" alt="" class="landing-photo" />
        </div>
      </Transition>
      <div v-if="!activeSlide" class="landing-slide landing-slide--fallback" aria-hidden="true"></div>
      <div class="landing-shade" aria-hidden="true"></div>
      <div v-if="activeSlide?.caption" class="landing-caption">
        {{ activeSlide.caption }}
      </div>

      <div class="landing-inner">
      <div class="landing-copy">
        <p class="landing-eyebrow">{{ t.eyebrow }}</p>
        <h1>{{ t.title }}</h1>
        <p class="landing-intro">{{ t.intro }}</p>
      </div>

      <div class="landing-actions">
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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

watch(() => slides.value.length, () => {
  activeCocktailIndex.value = 0
})

onMounted(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) return
  carouselTimer = window.setInterval(() => {
    const count = slides.value.length
    if (count > 1) activeCocktailIndex.value = (activeCocktailIndex.value + 1) % count
  }, 6000)
})

onBeforeUnmount(() => window.clearInterval(carouselTimer))
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

.landing-slide {
  position: absolute;
  z-index: -2;
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
  object-fit: contain;
  object-position: center 45%;
}

.landing-photo-backdrop {
  position: absolute;
  inset: -1rem;
  width: calc(100% + 2rem);
  height: calc(100% + 2rem);
  object-fit: cover;
  object-position: center 45%;
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

@media (max-width: 520px) {
  .landing-page,
  .landing-hero {
    flex: none;
  }

  .landing-hero {
    min-height: 0;
    padding: 0;
  }

  .landing-inner {
    align-items: stretch;
    gap: 0;
  }

  .landing-slide,
  .landing-shade {
    bottom: auto;
    height: clamp(14rem, 34vh, 19rem);
  }

  .landing-photo {
    object-fit: cover;
  }

  .landing-photo-backdrop {
    display: none;
  }

  .landing-shade {
    background: linear-gradient(
      0deg,
      color-mix(in srgb, var(--hero-veil) 80%, transparent),
      color-mix(in srgb, var(--hero-veil) 36%, transparent) 55%,
      color-mix(in srgb, var(--hero-veil) 25%, transparent)
    );
  }

  .landing-copy {
    display: flex;
    flex: 0 0 clamp(14rem, 34vh, 19rem);
    flex-direction: column;
    justify-content: flex-start;
    max-width: none;
    padding: 2rem 1rem 2.5rem;
  }

  .landing-actions {
    position: relative;
    z-index: 1;
    flex: 1 0 auto;
    width: 100%;
    max-width: none;
    margin-top: -2.5rem;
    padding: 1rem;
    border-radius: var(--radius-panel) var(--radius-panel) 0 0;
    background: var(--bg);
  }

  .landing-caption {
    top: calc(clamp(14rem, 34vh, 19rem) - 2.75rem);
    right: 1rem;
    bottom: auto;
    left: auto;
    width: fit-content;
    max-width: calc(100% - 2rem);
    padding: 0.35rem 0.65rem;
    font-size: 0.7rem;
  }

  .landing-intro {
    font-size: 0.9rem;
  }

  .landing-copy h1 {
    font-size: clamp(1.75rem, 8vw, 2.5rem);
  }

  .landing-eyebrow {
    font-size: 0.65rem;
  }

  .landing-action-heading h2 {
    font-size: 0.72rem;
  }

  .landing-action-heading p,
  .landing-status {
    font-size: 0.72rem;
  }

  .landing-button,
  .landing-join input {
    font-size: 0.8rem;
  }

  .landing-action {
    padding: 0 0 1rem;
    border: 0;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }

  .landing-action:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .landing-action--bartender > .landing-button {
    min-width: 0;
    width: auto;
  }

  .landing-action > .landing-button {
    width: auto;
  }

  .landing-join {
    gap: 0.4rem;
  }
}
</style>