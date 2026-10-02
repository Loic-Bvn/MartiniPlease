<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--prep" role="dialog" aria-modal="true" aria-labelledby="prep-modal-title">
      <div class="modal-header">
        <h2 class="modal-title" id="prep-modal-title">🍸 {{ t.title }}</h2>
        <button @click="$emit('close')" class="btn-icon btn-icon--close" :aria-label="t.close">
          <X :size="20" />
        </button>
      </div>

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

      <!-- Carte -->
      <label class="prep-card-filter">
        <span>{{ t.card }}</span>
        <select v-model="cardFilter">
          <option value="all">{{ t.allCards }}</option>
          <option v-for="c in menuCards" :key="c.id" :value="c.id">{{ c.name }}</option>
          <option value="none">{{ t.noCard }}</option>
        </select>
      </label>

      <!-- Total -->
      <div class="prep-total" aria-live="polite">
        <span class="prep-total-value">{{ stats.total }}</span>
        <span class="prep-total-label">{{ t.totalLabel(stats.total) }}</span>
      </div>

      <div v-if="loading" class="prep-state">{{ t.loading }}</div>
      <div v-else-if="!stats.by_cocktail.length" class="prep-state">{{ t.empty }}</div>

      <template v-else>
        <!-- Par cocktail -->
        <table class="prep-table">
          <thead>
            <tr>
              <th>{{ t.cocktail }}</th>
              <th class="num">{{ t.count }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stats.by_cocktail" :key="row.cocktail_id">
              <td>
                <span class="prep-row-name">{{ row.name || '—' }}</span>
                <span class="prep-bar" aria-hidden="true">
                  <span class="prep-bar-fill" :style="{ width: barWidth(row.count) }"></span>
                </span>
              </td>
              <td class="num">{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Répartition par carte (ignore le filtre carte) -->
      <section v-if="!loading && stats.by_card.length > 1" class="prep-section">
        <h3 class="prep-section-title">{{ t.byCard }}</h3>
        <ul class="prep-card-list">
          <li v-for="row in stats.by_card" :key="row.card_id ?? 'none'">
            <button class="prep-card-row" @click="cardFilter = row.card_id ?? 'none'">
              <span>{{ row.name || t.noCard }}</span>
              <strong>{{ row.count }}</strong>
            </button>
          </li>
        </ul>
      </section>

      <!-- Dernières entrées : corriger une erreur au-delà du délai d'annulation -->
      <section v-if="recent.length" class="prep-section">
        <h3 class="prep-section-title">{{ t.recent }}</h3>
        <ul class="prep-recent">
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
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { X, Trash2 } from 'lucide-vue-next'
import { usePreparations } from '@/composables/usePreparations'

const props = defineProps({
  barId:     { type: String, required: true },
  locale:    { type: String, default: 'fr' },
  menuCards: { type: Array,  default: () => [] },
})
const emit = defineEmits(['close'])

const { getStats, getRecent, deleteEntry } = usePreparations()

// ── Fermeture clavier ────────────────────────────────────────────────────────
function handleKeydown(e) { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// ── Libellés ─────────────────────────────────────────────────────────────────
const fr = computed(() => props.locale === 'fr')
const t = computed(() => ({
  title:    fr.value ? 'Compteur de préparations' : 'Preparation counter',
  close:    fr.value ? 'Fermer' : 'Close',
  period:   fr.value ? 'Période' : 'Period',
  from:     fr.value ? 'Du' : 'From',
  to:       fr.value ? 'Au' : 'To',
  card:     fr.value ? 'Carte' : 'Menu',
  allCards: fr.value ? 'Toutes les cartes' : 'All menus',
  noCard:   fr.value ? 'Hors carte' : 'Off-menu',
  cocktail: 'Cocktail',
  count:    fr.value ? 'Préparés' : 'Prepared',
  byCard:   fr.value ? 'Répartition par carte' : 'Breakdown by menu',
  recent:   fr.value ? 'Dernières entrées' : 'Latest entries',
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

function currentRange() {
  const now = new Date()
  switch (period.value) {
    case 'today': return { from: startOfDay(now), to: null }
    case '7d':    return { from: new Date(now.getTime() - 7  * 86400000), to: null }
    case '30d':   return { from: new Date(now.getTime() - 30 * 86400000), to: null }
    case 'custom': {
      const from = parseDay(customFrom.value)
      const to   = parseDay(customTo.value)
      // la date de fin est inclusive → on prend le début du jour suivant
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
  const [s, r] = await Promise.all([
    getStats(props.barId, {
      from, to,
      cardId:       cardFilter.value !== 'all' && cardFilter.value !== 'none' ? cardFilter.value : null,
      uncardedOnly: cardFilter.value === 'none',
    }),
    getRecent(props.barId, 8),
  ])

  if (req !== _req) return
  stats.value   = s
  recent.value  = r
  loading.value = false
}

watch([period, customFrom, customTo, cardFilter], load)
onMounted(load)

// ── Helpers d'affichage ──────────────────────────────────────────────────────
const maxCount = computed(() => Math.max(1, ...stats.value.by_cocktail.map(r => r.count)))
function barWidth(count) {
  return `${Math.round((count / maxCount.value) * 100)}%`
}
function formatDate(iso) {
  return new Date(iso).toLocaleString(fr.value ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

async function removeEntry(id) {
  const res = await deleteEntry(id)
  if (res.success) load()
}
</script>

<style scoped>
.modal-container--prep {
  max-width: 540px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.prep-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
.prep-pill {
  flex: 1 1 auto;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s ease, color 0.15s ease;
}
.prep-pill.active {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--bg);
  font-weight: 600;
}
.prep-pill:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

.prep-custom {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.prep-custom label,
.prep-card-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.prep-custom input,
.prep-card-filter select {
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--border-mid);
  background: var(--bg-input);
  color: inherit;
  font-size: 0.9rem;
}
.prep-card-filter { margin-bottom: 4px; }

.prep-total {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 16px 0 8px;
}
.prep-total-value {
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--gold);
}
.prep-total-label { color: var(--text-muted); font-size: 0.9rem; }

.prep-state {
  padding: 20px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.prep-table { width: 100%; border-collapse: collapse; }
.prep-table th,
.prep-table td {
  padding: 8px 6px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}
.prep-table th { color: var(--text-muted); font-weight: 600; font-size: 0.78rem; }
.prep-table .num { text-align: right; width: 72px; font-variant-numeric: tabular-nums; }
.prep-row-name { display: block; }
.prep-bar {
  display: block;
  height: 4px;
  margin-top: 5px;
  border-radius: 2px;
  background: var(--bg-raised);
  overflow: hidden;
}
.prep-bar-fill {
  display: block;
  height: 100%;
  background: var(--gold);
  border-radius: 2px;
}

.prep-section { margin-top: 20px; }
.prep-section-title {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}
.prep-card-list,
.prep-recent { list-style: none; margin: 0; padding: 0; }

.prep-card-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 7px 10px;
  margin-bottom: 4px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: inherit;
  font-size: 0.88rem;
  cursor: pointer;
}
.prep-card-row:hover { border-color: var(--gold); }
.prep-card-row:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

.prep-recent li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.86rem;
}
.prep-recent-main { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prep-recent-date { color: var(--text-dim); font-size: 0.78rem; white-space: nowrap; }
</style>