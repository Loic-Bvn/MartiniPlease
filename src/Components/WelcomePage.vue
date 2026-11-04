<template>
  <div class="landing-page">
    <main class="landing-hero">
      <Transition name="landing-fade">
        <div v-if="activeCocktail" :key="activeCocktail.id" class="landing-slide" aria-hidden="true">
          <img :src="activeCocktail.image" alt="" class="landing-photo" />
          <div class="landing-caption">{{ activeCocktail.name }} · <b>{{ featuredBar?.name }}</b></div>
        </div>
      </Transition>
      <div v-if="!activeCocktail" class="landing-slide landing-slide--fallback" aria-hidden="true"></div>
      <div class="landing-shade" aria-hidden="true"></div>

      <div class="landing-copy">
        <p class="landing-eyebrow">COCKTAILS · {{ locale === 'fr' ? 'STOCK · RECETTES' : 'INVENTORY · RECIPES' }}</p>
        <h1>{{ locale === 'fr' ? 'Ton bar, ta carte, un seul code.' : 'Your bar, your menu, one simple code.' }}</h1>
        <p class="landing-intro">
          {{ locale === 'fr'
            ? 'Gère ton bar, partage ta carte. Tes invités n’ont plus qu’à choisir.'
            : 'Manage your bar and share your menu. Your guests just have to choose.' }}
        </p>
      </div>

      <div class="landing-actions">
        <section class="landing-action">
          <h2>BARTENDER</h2>
          <p>{{ locale === 'fr' ? 'Gère ton stock et tes recettes.' : 'Manage your inventory and recipes.' }}</p>
          <button type="button" class="landing-primary-button" @click="emit('open-auth')">
            {{ locale === 'fr' ? 'Créer ou accéder à mon bar' : 'Create or access my bar' }}
          </button>
        </section>

        <section class="landing-action">
          <h2>DRINKER</h2>
          <p>{{ locale === 'fr' ? 'Explore la carte d’un bar avec son code.' : 'Explore a bar menu with its code.' }}</p>
          <form class="landing-join" @submit.prevent="emit('join-by-code')">
            <input
              :value="inviteCodeInput"
              type="text"
              :placeholder="locale === 'fr' ? 'Code du bar (ex : STAR-7514)' : 'Bar code (e.g. STAR-7514)'"
              :aria-label="locale === 'fr' ? 'Code du bar' : 'Bar code'"
              autocomplete="off"
              @input="emit('update:inviteCodeInput', $event.target.value)"
            />
            <button type="submit" class="landing-primary-button">
              {{ locale === 'fr' ? 'Rejoindre' : 'Join' }}
            </button>
          </form>
          <p v-if="codeError" class="landing-error" role="alert">{{ codeError }}</p>
          <div id="landing-public-bars" class="landing-public-bars" aria-live="polite">
            <p v-if="publicBarsLoading" class="landing-public-status">
              {{ locale === 'fr' ? 'Chargement des bars…' : 'Loading bars…' }}
            </p>
            <p v-else-if="publicBarsError" class="landing-public-status" role="alert">
              {{ locale === 'fr' ? 'Impossible de charger les bars. Réessaie plus tard.' : 'Unable to load bars. Please try again later.' }}
            </p>
            <p v-else-if="publicBars.length === 0" class="landing-public-status">
              {{ locale === 'fr' ? 'Aucun bar ouvert pour le moment.' : 'No open bars right now.' }}
            </p>
            <template v-else>
              <h3 class="landing-list-title">{{ locale === 'fr' ? 'Bars ouverts' : 'Open bars' }}</h3>
              <button
                v-for="bar in publicBars"
                :key="bar.id"
                type="button"
                :class="['landing-public-bar', { 'landing-public-bar--featured': bar.id === featuredBarId }]"
                :aria-label="bar.id === featuredBarId
                  ? `${bar.name} — ${locale === 'fr' ? 'bar à la une' : 'featured bar'}`
                  : bar.name"
                @click="emit('join-public-bar', bar)"
              >
                <span class="landing-public-bar-name">
                  {{ bar.name }}
                </span>
                <span v-if="bar.id === featuredBarId" class="landing-featured-badge">
                  {{ locale === 'fr' ? 'À la une' : 'Featured' }}
                </span>
                <span class="landing-bar-code">{{ bar.invite_code }}</span>
              </button>
            </template>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  locale: { type: String, default: 'fr' },
  featuredBarId: { type: String, default: '' },
  featuredBar: { type: Object, default: null },
  featuredCocktails: { type: Array, default: () => [] },
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

const activeCocktailIndex = ref(0)
const activeCocktail = computed(() => props.featuredCocktails[activeCocktailIndex.value] || null)
let carouselTimer

watch(() => props.featuredCocktails.length, () => {
  activeCocktailIndex.value = 0
})

onMounted(() => {
  carouselTimer = window.setInterval(() => {
    if (props.featuredCocktails.length > 1) {
      activeCocktailIndex.value = (activeCocktailIndex.value + 1) % props.featuredCocktails.length
    }
  }, 6000)
})

onBeforeUnmount(() => window.clearInterval(carouselTimer))
</script>

<style scoped>
.landing-page {
  --landing-paper: var(--bg);
  --landing-ink: var(--text);
  --landing-card: var(--bg-card);
  --landing-border: var(--border);
  --landing-muted: var(--text-muted);
  --landing-accent: var(--gold);
  --landing-orange: var(--amber);
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  color: var(--landing-ink);
  font-family: inherit;
}

.landing-primary-button:focus-visible,
.landing-public-bar:focus-visible,
.landing-join input:focus-visible {
  outline: 3px solid #f2a516;
  outline-offset: 2px;
}

.landing-hero {
  position: relative;
  display: flex;
  min-height: 660px;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  margin-top: 24px;
  padding: 56px 56px 32px;
  overflow: hidden;
  border-radius: var(--radius-dialog);
  background: #120805;
  color: #f4eddc;
  isolation: isolate;
}

.landing-slide {
  position: absolute;
  z-index: -2;
  inset: 0;
  overflow: hidden;
}

.landing-slide--fallback {
  background:
    radial-gradient(circle at 72% 45%, rgba(216, 182, 101, 0.45), transparent 35%),
    linear-gradient(120deg, #181510, #35251b 58%, #181510);
  opacity: 1;
}

.landing-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 45%;
}

.landing-caption {
  position: absolute;
  top: 28px;
  right: 32px;
  padding: 8px 16px;
  border: 1px solid color-mix(in srgb, var(--gold) 40%, transparent);
  border-radius: 999px;
  background: #1a0c08aa;
  color: #eadfcb;
  font-size: 13px;
}

.landing-caption b {
  color: #f2a516;
}

.landing-shade {
  position: absolute;
  z-index: -1;
  inset: 0;
  background:
    linear-gradient(90deg, #120805ee, #12080599 45%, transparent 75%),
    linear-gradient(0deg, #120805dd, transparent 45%);
}

.landing-copy {
  position: relative;
  max-width: 560px;
}

.landing-eyebrow {
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.landing-copy h1 {
  margin: 14px 0;
  font: 600 64px/1.04 var(--font-display);
  letter-spacing: 0.01em;
}

.landing-intro {
  margin: 0;
  color: #e5dac9;
  font-size: 18px;
  line-height: 1.5;
}

.landing-actions {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.landing-action {
  min-width: 0;
  padding: 22px 24px;
  border: 1px solid var(--landing-border);
  border-radius: var(--radius-panel);
  background: var(--landing-card);
  color: var(--landing-ink);
  backdrop-filter: blur(10px);
}

.landing-action h2 {
  margin: 0 0 4px;
  color: var(--landing-orange);
  font-size: 13px;
  letter-spacing: 0.16em;
}

.landing-action > p {
  margin: 0 0 14px;
  color: var(--landing-muted);
  font-size: 14px;
}

.landing-primary-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  padding: 0 22px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--landing-accent);
  color: var(--landing-paper);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
}

.landing-primary-button:hover {
  filter: brightness(1.12);
}

.landing-join {
  display: flex;
  gap: 10px;
}

.landing-join input {
  min-width: 0;
  min-height: 46px;
  flex: 1;
  padding: 0 14px;
  border: 1px solid var(--landing-border);
  border-radius: var(--radius-control);
  background: var(--bg-input);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
}

.landing-join input::placeholder {
  color: var(--text-muted);
  opacity: 1;
}

.landing-public-bars {
  display: grid;
  gap: 6px;
  max-height: 190px;
  margin-top: 14px;
  overflow: auto;
}

.landing-list-title {
  position: sticky;
  top: 0;
  padding: 4px 0;
  background: var(--landing-card);
  color: var(--landing-muted);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.landing-public-status {
  color: var(--landing-muted);
  font-size: 13px;
}

.landing-public-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--landing-border);
  border-radius: var(--radius-control);
  background: var(--landing-paper);
  color: var(--landing-ink);
  text-align: left;
  cursor: pointer;
}

.landing-public-bar:hover {
  border-color: var(--landing-accent);
  background: var(--bg-raised);
}

.landing-public-bar--featured {
  border: 2px solid var(--landing-accent);
  background: var(--bg-raised);
  box-shadow: 0 0 0 2px rgba(167, 120, 42, 0.16);
}

.landing-public-bar-name {
  min-width: 0;
  font-weight: 600;
}

.landing-featured-badge {
  flex: none;
  padding: 3px 7px;
  border: 1px solid var(--gold);
  border-radius: 999px;
  background: var(--bg-input);
  color: var(--landing-orange);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.landing-bar-code {
  color: var(--landing-muted);
  font-size: 12px;
}

.landing-error {
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 13px;
}

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
  .landing-fade-leave-active {
    transition-duration: 0.01ms;
  }
}

@media (max-width: 900px) {
  .landing-actions {
    grid-template-columns: 1fr;
  }

  .landing-hero {
    padding: 72px 24px 24px;
  }

  .landing-copy h1 {
    font-size: 40px;
  }

  .landing-caption {
    top: 20px;
    right: 20px;
    left: 20px;
    width: fit-content;
  }

}

@media (max-width: 520px) {
  .landing-page {
    padding: 1rem;
  }

  .landing-hero {
    min-height: 680px;
    gap: 24px;
    margin-top: 16px;
    padding: 76px 16px 16px;
    border-radius: var(--radius-dialog);
  }

  .landing-copy h1 {
    font-size: clamp(36px, 10vw, 46px);
  }

  .landing-intro {
    font-size: 16px;
  }

  .landing-action {
    padding: 18px 16px;
  }

  .landing-join {
    flex-wrap: wrap;
  }

  .landing-join input {
    flex-basis: 100%;
  }

  .landing-join .landing-primary-button {
    width: 100%;
  }
}
</style>
