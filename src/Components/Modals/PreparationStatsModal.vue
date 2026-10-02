  allSpirits: fr.value ? 'Toutes les familles' : 'All families',
<template>
  <div class="modal-overlay modal-overlay--prep" @click.self="$emit('close')">
    <div class="modal-container modal-container--prep" role="dialog" aria-modal="true" aria-labelledby="prep-modal-title">
      <div class="modal-header">
        <h2 class="modal-title" id="prep-modal-title">🍸 {{ t.title }}</h2>
        <div class="prep-header-actions">
          <div
            class="settings-switch"
            role="group"
            :aria-label="locale === 'fr' ? 'Changer la langue' : 'Change language'"
            @click="$emit('set-locale', locale === 'fr' ? 'en' : 'fr')"
          >
            <button
              type="button"
              class="view-toggle-btn"
              :class="{ 'view-toggle-btn--active': locale === 'fr' }"
              :title="locale === 'fr' ? 'Switch to English' : 'Passer en français'"
            ><span>FR</span></button>
            <button
              type="button"
              class="view-toggle-btn"
              :class="{ 'view-toggle-btn--active': locale === 'en' }"
              :title="locale === 'fr' ? 'Switch to English' : 'Passer en français'"
            ><span>EN</span></button>
          </div>
          <ThemeToggle />
          <button @click="$emit('close')" class="btn-icon btn-icon--close" :aria-label="t.close">
            <X :size="20" />
          </button>
        </div>
      </div>

      <div class="prep-content">

      <div class="prep-layout">
        <div class="prep-primary">

  <div class="prep-controls">
      <!-- Période -->
      <div class="prep-picker" role="group" :aria-label="t.period">
        <button
          v-for="opt in periodOptions"
          :key="opt.key"
          :class="['prep-pill', { active: period === opt.key }]"
          @click="period = opt.key"
        >{{ opt.label }}</button>
      </div>

      <div v-if="period === 'custom'" class="prep-custom">
        <label>
          <span>{{ t.from }}</span>
          <input type="date" v-model="customFrom" :max="customTo || undefined" />
        </label>
        <label>
          <span>{{ t.to }}</span>
          <input type="date" v-model="customTo" :min="customFrom || undefined" />
        </label>
      </div>

      <div class="prep-filters">
        <label class="prep-card-filter">
          <span>{{ t.card }}</span>
          <select v-model="cardFilter">
            <option value="all">{{ t.allCards }}</option>
            <option v-for="c in menuCards" :key="c.id" :value="c.id">{{ c.name }}</option>
            <option value="none">{{ t.uncardedRecipes }}</option>
          </select>
        </label>

        <label class="prep-card-filter">
          <span>{{ t.recipe }}</span>
          <select v-model="cocktailFilter">
            <option value="all">{{ t.allCocktails }}</option>
            <option v-for="c in sortedCocktails" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>

        <label class="prep-card-filter">
          <span>{{ t.profile }}</span>
          <select v-model="profileFilter">
            <option value="all">{{ t.allProfiles }}</option>
            <option v-for="profile in profileOptions" :key="profile.value" :value="profile.value">{{ profile.label }}</option>
          </select>
        </label>

        <label class="prep-card-filter">
          <span>{{ t.baseSpirit }}</span>
          <select v-model="baseSpiritFilter">
            <option value="all">{{ t.allSpirits }}</option>
            <option v-for="spirit in baseSpiritOptions" :key="spirit.value" :value="spirit.value">{{ spirit.label }}</option>
          </select>
        </label>
      </div>
      </div>

      <!-- Total -->
      <div class="prep-total" aria-live="polite" :aria-busy="loading">
        <div class="prep-total-main">
          <span class="prep-total-value">{{ stats.total }}</span>
          <span class="prep-total-label">{{ t.totalLabel(stats.total) }}</span>
        </div>
        <div class="prep-total-side">
          <strong>{{ stats.by_cocktail.length }}</strong>
          <span>{{ t.recipeCount }}</span>
        </div>
      </div>

      <section class="prep-section" :aria-busy="loading">
        <div class="prep-section-header">
          <h3 class="prep-section-title">{{ t.byCocktail }}</h3>
        </div>

        <div v-if="loading" class="prep-state" role="status">{{ t.loading }}</div>
        <div v-else-if="!activeRows.length" class="prep-state">{{ t.empty }}</div>

        <template v-else>
          <div class="prep-distribution" role="img" :aria-label="t.distribution">
            <span
              v-for="segment in distributionSegments"
              :key="segment.id"
              :style="{ width: `${segment.width}%`, backgroundColor: segment.color }"
            ></span>
          </div>
          <ol class="prep-ranking">
            <li
              v-for="(row, index) in visibleRows"
              :key="row.id"
              class="prep-ranking-item"
              :style="{ '--rank-color': rankColor(index) }"
            >
            <span class="prep-rank" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="prep-row-thumb">
              <img
                v-if="row.image && !failedImages.has(row.id)"
                :src="row.image"
                alt=""
                loading="lazy"
                @error="markImageFailed(row.id)"
              />
              <Martini v-else :size="17" />
            </span>
            <div class="prep-rank-content">
              <div class="prep-rank-heading">
                <span class="prep-row-name">{{ row.name }}</span>
                <strong class="prep-rank-count">{{ row.count }}</strong>
              </div>
              <span class="prep-bar" aria-hidden="true">
                <span class="prep-bar-fill" :style="{ width: barWidth(row.count) }"></span>
              </span>
            </div>
          </li>
          </ol>
        </template>
        <button
          v-if="!isWideLayout && activeRows.length > 8"
          type="button"
          class="prep-show-more"
          @click="showAllRows = !showAllRows"
        >{{ showAllRows ? t.showLess : t.showAll(activeRows.length) }}</button>
      </section>
        </div>

        <aside class="prep-aside">
          <section class="prep-side-section prep-side-section--cards" :aria-busy="loading">
            <div class="prep-section-header">
              <h3 class="prep-section-title">{{ t.byCard }}</h3>
              <span class="prep-side-note">{{ t.allMenusContext }}</span>
            </div>
            <div v-if="loading" class="prep-state" role="status">{{ t.loading }}</div>
            <div v-else-if="!cardRows.length" class="prep-state">{{ t.emptyCards }}</div>
            <ol v-else class="prep-card-ranking">
              <li
                v-for="(row, index) in cardRows"
                :key="row.id"
                class="prep-card-ranking-item"
                :style="{ '--rank-color': rankColor(index) }"
              >
                <div class="prep-card-ranking-heading">
                  <span>{{ row.name }}</span>
                  <strong>{{ row.count }}</strong>
                </div>
                <span class="prep-bar" aria-hidden="true">
                  <span class="prep-bar-fill" :style="{ width: cardBarWidth(row.count) }"></span>
                </span>
              </li>
            </ol>
          </section>

          <section class="prep-side-section" :aria-busy="loading">
            <div class="prep-section-header">
              <h3 class="prep-section-title">{{ t.byProfile }}</h3>
            </div>
            <div v-if="loading" class="prep-state" role="status">{{ t.loading }}</div>
            <div v-else-if="!profileRows.length" class="prep-state">{{ t.emptyRecipeTraits }}</div>
            <ol v-else class="prep-insight-list">
              <li
                v-for="(row, index) in profileRows.slice(0, 5)"
                :key="row.id"
                :style="{ '--rank-color': rankColor(index) }"
              >
                <div class="prep-insight-heading">
                  <span>{{ row.name }}</span>
                  <strong>{{ row.count }}</strong>
                </div>
                <span class="prep-bar" aria-hidden="true">
                  <span class="prep-bar-fill" :style="{ width: insightBarWidth(row.count, profileRows) }"></span>
                </span>
              </li>
            </ol>
          </section>

          <section class="prep-side-section" :aria-busy="loading">
            <div class="prep-section-header">
              <h3 class="prep-section-title">{{ t.bySpirit }}</h3>
            </div>
            <div v-if="loading" class="prep-state" role="status">{{ t.loading }}</div>
            <div v-else-if="!spiritRows.length" class="prep-state">{{ t.emptyRecipeTraits }}</div>
            <ol v-else class="prep-insight-list">
              <li
                v-for="(row, index) in spiritRows.slice(0, 5)"
                :key="row.id"
                :style="{ '--rank-color': rankColor(index + 2) }"
              >
                <div class="prep-insight-heading">
                  <span>{{ row.name }}</span>
                  <strong>{{ row.count }}</strong>
                </div>
                <span class="prep-bar" aria-hidden="true">
                  <span class="prep-bar-fill" :style="{ width: insightBarWidth(row.count, spiritRows) }"></span>
                </span>
              </li>
            </ol>
          </section>

          <section class="prep-side-section">
            <div class="prep-section-header">
              <h3 class="prep-section-title">{{ t.recent }}</h3>
              <span class="prep-recent-count">{{ recent.length }}</span>
            </div>
            <ul v-if="recent.length" class="prep-recent">
              <li v-for="e in recent" :key="e.id">
                <span class="prep-recent-main">
                  {{ e.bar_cocktails?.name || '—' }}<template v-if="e.quantity > 1"> ×{{ e.quantity }}</template>
                </span>
                <span class="prep-recent-date">{{ formatDate(e.prepared_at) }}</span>
                <button
                  class="btn-icon btn-icon--delete"
                  :title="t.remove"
                  :aria-label="t.remove"
                  @click="removeEntry(e.id)"
                >
                  <Trash2 :size="15" />
                </button>
              </li>
            </ul>
            <div v-else class="prep-state">{{ t.emptyRecent }}</div>
          </section>
        </aside>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Martini, X, Trash2 } from 'lucide-vue-next'
import { usePreparations } from '@/composables/usePreparations'
import { getIngredientLabel, getProfileLabel } from '@/constants/typeLabels.js'
import { getBaseSpiritGroups } from '@/lib/cocktail-constants'
import ThemeToggle from '@/Components/ThemeToggle.vue'

const props = defineProps({
  barId:     { type: String, required: true },
  locale:    { type: String, default: 'fr' },
  menuCards: { type: Array,  default: () => [] },
  cocktails: { type: Array,  default: () => [] },   // cocktails du bar (filtre par recette)
})
const emit = defineEmits(['close', 'set-locale'])

const { getStats, getRecent, deleteEntry } = usePreparations()

// ── Fermeture clavier ────────────────────────────────────────────────────────
function handleKeydown(e) { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// ── Libellés ─────────────────────────────────────────────────────────────────
const fr = computed(() => props.locale === 'fr')
const t = computed(() => ({
  title:    fr.value ? 'Compteur' : 'Counter',
  close:    fr.value ? 'Fermer' : 'Close',
  period:   fr.value ? 'Période' : 'Period',
  from:     fr.value ? 'Du' : 'From',
  to:       fr.value ? 'Au' : 'To',
  card:     fr.value ? 'Carte' : 'Menu',
  allCards: fr.value ? 'Toutes les cartes' : 'All menus',
  noCard:   fr.value ? 'Hors carte' : 'Off-menu',
  uncardedRecipes: fr.value ? 'Cocktails sans carte' : 'Cocktails not on a menu',
  recipe:   fr.value ? 'Recette' : 'Recipe',
  allCocktails: fr.value ? 'Toutes les recettes' : 'All recipes',
  profile: fr.value ? 'Profil' : 'Profile',
  allProfiles: fr.value ? 'Tous les profils' : 'All profiles',
  baseSpirit: fr.value ? 'Spiritueux de base' : 'Base spirit',
  allSpirits: fr.value ? 'Tous les spiritueux' : 'All spirits',
  recipeCount: fr.value ? 'recettes différentes' : 'different recipes',
  byCocktail: fr.value ? 'Cocktails les plus préparés' : 'Most prepared cocktails',
  byCard: fr.value ? 'Préparations par carte' : 'Preparations by menu',
  byProfile: fr.value ? 'Profils les plus préparés' : 'Most prepared profiles',
  bySpirit: fr.value ? 'Spiritueux de base' : 'Base spirits',
  emptyRecipeTraits: fr.value ? 'Aucune donnée de recette pour cette sélection.' : 'No recipe data for this selection.',
  allMenusContext: fr.value ? 'Toutes les cartes' : 'All menus',
  emptyCards: fr.value ? 'Aucune préparation enregistrée par carte.' : 'No preparations recorded by menu.',
  emptyRecent: fr.value ? 'Aucune préparation récente.' : 'No recent preparations.',
  distribution: fr.value ? 'Répartition des préparations' : 'Preparation distribution',
  showAll: n => fr.value ? `Afficher les ${n} recettes` : `Show all ${n} recipes`,
  showLess: fr.value ? 'Réduire' : 'Show less',
  recent:   fr.value ? 'Dernières préparations du bar' : 'Latest bar preparations',
  remove:   fr.value ? 'Supprimer cette entrée' : 'Delete this entry',
  loading:  fr.value ? 'Chargement…' : 'Loading…',
  empty:    fr.value ? 'Aucune préparation enregistrée sur cette sélection.' : 'No preparation logged for this selection.',
  totalLabel: n => fr.value
    ? (n > 1 ? 'cocktails préparés' : 'cocktail préparé')
    : (n === 1 ? 'cocktail prepared' : 'cocktails prepared'),
}))

const periodOptions = computed(() => [
  { key: 'today', label: fr.value ? "Aujourd'hui" : 'Today' },
  { key: '7d',    label: '7j' },
  { key: '30d',   label: '30j' },
  { key: 'all',   label: fr.value ? 'Total' : 'All time' },
  { key: 'custom', label: fr.value ? 'Perso' : 'Custom' },
])

// ── État ─────────────────────────────────────────────────────────────────────
const period     = ref('today')
const customFrom = ref('')   // 'YYYY-MM-DD'
const customTo   = ref('')
const cardFilter = ref('all') // 'all' | 'none' | <card uuid>
const cocktailFilter = ref('all') // 'all' | <cocktail uuid>
const profileFilter = ref('all')
const baseSpiritFilter = ref('all')
const showAllRows = ref(false)
const isWideLayout = ref(false)
const failedImages = ref(new Set())
const sortedCocktails = computed(() =>
  [...props.cocktails].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
)
const profileOptions = computed(() => [...new Set(props.cocktails.flatMap(cocktail =>
  Array.isArray(cocktail.profile) ? cocktail.profile : []
))]
  .map(value => ({ value, label: getProfileLabel(value, props.locale) }))
  .sort((a, b) => a.label.localeCompare(b.label))
)
const baseSpiritGroups = computed(() => getBaseSpiritGroups())
const baseSpiritOptions = computed(() => baseSpiritGroups.value.map(group => ({
  value: group.categoryValue,
  label: group.label,
})))
const spiritsByFamily = computed(() => Object.fromEntries(baseSpiritGroups.value.map(group => [
  group.categoryValue,
  group.spirits.map(spirit => spirit.key),
])))

const loading = ref(false)
const stats   = ref({ total: 0, by_cocktail: [], by_card: [] })
const recent  = ref([])

// ── Calcul des bornes de la période (heure locale du navigateur) ─────────────
function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function parseDay(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}


function daysAgoStart(n) {
  const d = startOfDay(new Date())
  d.setDate(d.getDate() - n)
  return d
}

function currentRange() {
  const now = new Date()
  switch (period.value) {
    case 'today': return { from: startOfDay(now), to: null }
    case '7d':    return { from: daysAgoStart(6),  to: null }   // aujourd'hui + 6 jours
    case '30d':   return { from: daysAgoStart(29), to: null }
    case 'custom': {
      const from = parseDay(customFrom.value)
      const to   = parseDay(customTo.value)
      return { from, to: to ? new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1) : null }
    }
    default:      return { from: null, to: null }
  }
}


// ── Chargement (le compteur évite qu'une réponse lente écrase une plus récente) ─
let _req = 0
async function load() {
  const req = ++_req
  loading.value = true

  const { from, to } = currentRange()
  const s = await getStats(props.barId, {
    from, to,
    cardId:       cardFilter.value !== 'all' && cardFilter.value !== 'none' ? cardFilter.value : null,
    uncardedOnly: cardFilter.value === 'none',
    cocktailId:   cocktailFilter.value !== 'all' ? cocktailFilter.value : null,
    profile:      profileFilter.value !== 'all' ? profileFilter.value : null,
    baseSpirits:  spiritsByFamily.value[baseSpiritFilter.value] || null,
  })

  if (req !== _req) return
  stats.value   = s
  loading.value = false
}

async function loadRecent() {
  recent.value = await getRecent(props.barId, 8)
}

watch([period, customFrom, customTo, cardFilter, cocktailFilter, profileFilter, baseSpiritFilter], load)
onMounted(() => { load(); loadRecent() })

let layoutMediaQuery
function updateLayoutMode(event) {
  isWideLayout.value = event.matches
}
onMounted(() => {
  layoutMediaQuery = window.matchMedia('(min-width: 1024px)')
  isWideLayout.value = layoutMediaQuery.matches
  layoutMediaQuery.addEventListener('change', updateLayoutMode)
})
onUnmounted(() => layoutMediaQuery?.removeEventListener('change', updateLayoutMode))

async function removeEntry(id) {
  const res = await deleteEntry(id)
  if (res.success) { load(); loadRecent() }
}

watch([period, customFrom, customTo, cardFilter, cocktailFilter], load)
onMounted(load)

// ── Helpers d'affichage ──────────────────────────────────────────────────────
const cocktailsById = computed(() => new Map(props.cocktails.map(c => [c.id, c])))

const activeRows = computed(() => stats.value.by_cocktail.map(row => ({
  id: row.cocktail_id,
  name: row.name || '—',
  count: row.count,
  image: cocktailsById.value.get(row.cocktail_id)?.image || null,
})))
const cardRows = computed(() => stats.value.by_card.map(row => ({
  id: row.card_id || 'none',
  name: row.name || t.value.noCard,
  count: row.count,
})))
const profileRows = computed(() => aggregateRecipeTraits('profile'))
const spiritRows = computed(() => aggregateRecipeTraits('base_spirit'))
const visibleRows = computed(() => isWideLayout.value || showAllRows.value
  ? activeRows.value
  : activeRows.value.slice(0, 8)
)
const maxCount = computed(() => Math.max(1, ...activeRows.value.map(row => row.count)))
const maxCardCount = computed(() => Math.max(1, ...cardRows.value.map(row => row.count)))
const distributionTotal = computed(() => activeRows.value.reduce((total, row) => total + row.count, 0))
const distributionSegments = computed(() => activeRows.value.map((row, index) => ({
  id: row.id,
  width: distributionTotal.value ? row.count / distributionTotal.value * 100 : 0,
  color: rankColor(index),
})))
const rankColors = ['#b9772b', '#3d7b69', '#477b9e', '#a6584d', '#7770a5', '#8b714c']
function rankColor(index) {
  return rankColors[index % rankColors.length]
}
function aggregateRecipeTraits(field) {
  const counts = new Map()
  for (const row of activeRows.value) {
    const cocktail = cocktailsById.value.get(row.id)
    const values = field === 'profile'
      ? (Array.isArray(cocktail?.profile) ? [...new Set(cocktail.profile)] : [])
      : (cocktail?.base_spirit ? [cocktail.base_spirit] : [])

    for (const value of values) {
      const label = field === 'profile'
        ? getProfileLabel(value, props.locale)
        : getIngredientLabel(value, props.locale)
      const fallback = props.locale === 'fr' ? 'Indisponible' : 'Unavailable'
      const name = label === fallback ? value.replaceAll('_', ' ') : label
      counts.set(value, { id: value, name, count: (counts.get(value)?.count || 0) + row.count })
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
function insightBarWidth(count, rows) {
  const max = Math.max(1, ...rows.map(row => row.count))
  return `${Math.round((count / max) * 100)}%`
}
function markImageFailed(id) {
  failedImages.value = new Set(failedImages.value).add(id)
}
function barWidth(count) {
  return `${Math.round((count / maxCount.value) * 100)}%`
}
function cardBarWidth(count) {
  return `${Math.round((count / maxCardCount.value) * 100)}%`
}
function formatDate(iso) {
  return new Date(iso).toLocaleString(fr.value ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

</script>

<style scoped>
/* ── Modale plein écran ─────────────────────────────────────────────────── */
.modal-overlay--prep {
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  background: var(--bg);
  backdrop-filter: none;
}
.modal-container--prep {
  width: 100%;
  max-width: none;
  height: 100vh;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--border) 62%, transparent) transparent;
}
.modal-container--prep::-webkit-scrollbar,
.prep-primary::-webkit-scrollbar,
.prep-aside::-webkit-scrollbar { width: 6px; }
.modal-container--prep::-webkit-scrollbar-track,
.prep-primary::-webkit-scrollbar-track,
.prep-aside::-webkit-scrollbar-track { background: transparent; }
.modal-container--prep::-webkit-scrollbar-thumb,
.prep-primary::-webkit-scrollbar-thumb,
.prep-aside::-webkit-scrollbar-thumb {
  border: 1px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--border) 62%, transparent);
  background-clip: padding-box;
}
.modal-container--prep::-webkit-scrollbar-thumb:hover,
.prep-primary::-webkit-scrollbar-thumb:hover,
.prep-aside::-webkit-scrollbar-thumb:hover { background: var(--border-mid); background-clip: padding-box; }
.modal-header {
  position: sticky;
  top: 0;
  z-index: 5;
  flex: 0 0 auto;
  padding: 12px clamp(16px, 4vw, 48px);
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}
.prep-header-actions { display: flex; align-items: center; gap: 8px; }
.prep-content {
  width: 100%;
  flex: 1 0 auto;
  margin: 0;
  padding: 20px clamp(20px, 4vw, 56px) calc(24px + env(safe-area-inset-bottom, 0px));
}
.prep-controls {
  position: sticky;
  top: 66px;
  z-index: 4;
  padding: 4px 0 12px;
  background: var(--bg-card);
}

/* ── Sélecteur de période ───────────────────────────────────────────────── */
.prep-picker {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin: 4px 0 14px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-raised);
}
.prep-pill {
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.prep-pill.active {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--bg);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
}
.prep-pill:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* ── Dates perso + filtres ──────────────────────────────────────────────── */
.prep-custom,
.prep-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.prep-custom { margin: 0 0 12px; }
.prep-custom label,
.prep-card-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.prep-custom input,
.prep-card-filter select {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 6px 8px;
  border: 1px solid var(--border-mid);
  border-radius: 6px;
  background: var(--bg-input);
  color: inherit;
  font-size: 0.9rem;
}

/* ── Total ──────────────────────────────────────────────────────────────── */
.prep-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 16px 0 0;
  padding: 14px 4px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.prep-total-main { display: flex; align-items: baseline; gap: 12px; min-width: 0; }
.prep-total-value {
  color: var(--gold);
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.prep-total-label { color: var(--text-muted); font-size: 0.86rem; }
.prep-total-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding-left: 16px;
  border-left: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.76rem;
  text-align: right;
}
.prep-total-side strong { color: var(--text); font-size: 1.15rem; font-variant-numeric: tabular-nums; }

/* ── Layout principal / aside ───────────────────────────────────────────── */
.prep-layout { display: grid; gap: 24px; }
.prep-primary,
.prep-aside { min-width: 0; min-height: 0; }
.prep-aside { display: grid; align-content: start; align-self: start; gap: 24px; }

.prep-section { margin-top: 16px; }
.prep-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.prep-section-title { margin: 0; color: var(--text); font-size: 0.95rem; font-weight: 600; }

.prep-side-section {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.prep-side-section .prep-section-header {
  align-items: baseline;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.prep-side-note { color: var(--text-dim); font-size: 0.72rem; white-space: nowrap; }

.prep-state {
  padding: 20px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ── Barres (partagées) ─────────────────────────────────────────────────── */
.prep-bar {
  display: block;
  height: 5px;
  margin: 0;
  border-radius: 2px;
  background: var(--bg-raised);
  overflow: hidden;
}
.prep-bar-fill {
  display: block;
  height: 100%;
  min-width: 3px;
  border-radius: 2px;
  background: var(--rank-color, var(--gold));
  transition: width 0.25s ease;
}

/* ── Classement cocktails ───────────────────────────────────────────────── */
.prep-distribution {
  display: flex;
  gap: 2px;
  width: 100%;
  height: 10px;
  margin: 14px 0 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--bg-raised);
}
.prep-distribution span { min-width: 2px; border-radius: 999px; transition: width 0.25s ease; }

.prep-ranking { list-style: none; margin: 0; padding: 0; }
.prep-ranking-item {
  --rank-color: var(--gold);
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 8px 2px;
}
.prep-rank {
  width: 24px;
  flex: 0 0 24px;
  color: var(--text-dim);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.prep-row-thumb {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--rank-color) 38%, var(--border));
  border-radius: 6px;
  background: color-mix(in srgb, var(--rank-color) 12%, var(--bg-raised));
  color: var(--rank-color);
}
.prep-row-thumb img { width: 100%; height: 100%; object-fit: cover; }
.prep-rank-content { flex: 1; min-width: 0; }
.prep-rank-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
}
.prep-row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prep-rank-count {
  flex: 0 0 auto;
  min-width: 34px;
  color: var(--text);
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.prep-show-more {
  display: block;
  margin: 10px auto 0;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  color: var(--gold-dim);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.prep-show-more:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* ── Aside : cartes, profils, spiritueux ────────────────────────────────── */
.prep-card-ranking,
.prep-insight-list { list-style: none; margin: 0; padding: 0; }

.prep-card-ranking-item,
.prep-insight-list li {
  --rank-color: var(--gold);
}
.prep-card-ranking-item { padding: 10px 0; }
.prep-insight-list li { padding: 9px 0; }

.prep-card-ranking-heading,
.prep-insight-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
}
.prep-card-ranking-heading { font-size: 0.86rem; }
.prep-insight-heading { font-size: 0.84rem; }
.prep-card-ranking-heading span,
.prep-insight-heading span {
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prep-card-ranking-heading strong,
.prep-insight-heading strong {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* ── Dernières préparations ─────────────────────────────────────────────── */
.prep-recent { list-style: none; margin: 0; padding: 0; }
.prep-recent li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.86rem;
}
.prep-recent-main { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prep-recent-date { color: var(--text-dim); font-size: 0.78rem; white-space: nowrap; }
.prep-recent-count {
  margin-left: auto;
  color: var(--text-dim);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (min-width: 1024px) {
  .modal-container--prep { display: flex; flex-direction: column; overflow: hidden; }
  .prep-content { min-height: 0; flex: 1 1 0; overflow: hidden; }
  .prep-layout {
    height: 100%;
    min-height: 0;
    grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.85fr);
    grid-template-rows: minmax(0, 1fr);
    gap: clamp(28px, 4vw, 64px);
  }
  .prep-primary,
  .prep-aside {
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding-right: 20px;
  }
  .prep-controls { top: 0; }
  .prep-aside { align-content: start; align-self: stretch; }
}

@media (max-width: 520px) {
  .prep-content { padding: 16px 16px calc(20px + env(safe-area-inset-bottom, 0px)); }
  .prep-picker { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .prep-total-main { flex-wrap: wrap; gap: 4px 10px; }
  .prep-total-value { font-size: 2.25rem; }
  .prep-total-label { flex-basis: 100%; }
  .prep-ranking-item { gap: 8px; }
  .prep-rank { width: 20px; flex-basis: 20px; }
  .prep-row-thumb { width: 36px; height: 36px; flex-basis: 36px; }
  .prep-recent li { flex-wrap: wrap; gap: 4px 8px; }
  .prep-recent-date { flex: 1 0 calc(100% - 44px); order: 1; }
  .prep-recent li .btn-icon { order: 2; }
}
</style>