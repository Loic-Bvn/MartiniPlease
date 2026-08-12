<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--trends">
      <div class="modal-header">
        <h2 class="modal-title">📈 {{ locale === 'fr' ? 'Tendances' : 'Trends' }}</h2>
        <button @click="$emit('close')" class="btn-icon btn-icon--close">
          <X :size="20" />
        </button>
      </div>

      <div class="trends-window-picker">
        <button
          v-for="opt in windowOptions"
          :key="opt.days ?? 'all'"
          :class="['trends-window-btn', { active: days === opt.days }]"
          @click="days = opt.days"
        >
          {{ opt.label }}
        </button>
      </div>

      <div v-if="loading" class="trends-loading">{{ locale === 'fr' ? 'Chargement…' : 'Loading…' }}</div>

      <div v-else-if="!rows.length" class="trends-empty">
        {{ locale === 'fr' ? 'Pas encore de commandes ou de favoris sur cette période.' : 'No orders or favorites yet for this period.' }}
      </div>

      <table v-else class="trends-table">
        <thead>
          <tr>
            <th>{{ locale === 'fr' ? 'Cocktail' : 'Cocktail' }}</th>
            <th>{{ locale === 'fr' ? 'Commandes' : 'Orders' }}</th>
            <th>{{ locale === 'fr' ? 'Favoris' : 'Favorites' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.cocktail_id">
            <td>{{ row.name || '—' }}</td>
            <td>{{ row.orders_count }}</td>
            <td>{{ row.favorites_count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useTrends } from '@/composables/useTrends'

const props = defineProps({
  barId: { type: String, required: true },
  locale: { type: String, default: 'fr' },
})
defineEmits(['close'])

const { getTrends } = useTrends()

const windowOptions = [
  { days: 7,    label: '7j' },
  { days: 30,   label: '30j' },
  { days: 90,   label: '90j' },
  { days: null, label: props.locale === 'fr' ? 'Total' : 'All time' },
]

const days    = ref(7)
const rows    = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  rows.value = await getTrends(props.barId, { days: days.value, limit: 10 })
  loading.value = false
}

watch(days, load)
onMounted(load)
</script>

<style scoped>
.modal-container--trends {
  max-width: 480px;
  width: 100%;
}
.trends-window-picker {
  display: flex;
  gap: 8px;
  margin: 12px 0 16px;
}
.trends-window-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}
.trends-window-btn.active {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--bg);
  font-weight: 600;
}
.trends-loading,
.trends-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}
.trends-table {
  width: 100%;
  border-collapse: collapse;
}
.trends-table th,
.trends-table td {
  padding: 8px 6px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}
.trends-table th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}
.trends-table td:nth-child(2),
.trends-table td:nth-child(3),
.trends-table th:nth-child(2),
.trends-table th:nth-child(3) {
  text-align: right;
}
</style>
