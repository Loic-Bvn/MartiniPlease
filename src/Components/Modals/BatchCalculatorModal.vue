<!--
  BatchCalculatorModal.vue
  Calcule les volumes d'ingrédients et le coût total pour préparer un cocktail
  en gros lot (ex: 50 Negroni pour un événement).

  Props:
    - open: Boolean
    - cocktail: objet bar_cocktails_debug (name, recipe)
    - ingredients: liste des ingredients du bar (pour le pricing)
  Emits:
    - close
    - saved (si sauvegarde d'un preset — optionnel, cf useBatches à créer si besoin)
-->
<template>
  <transition name="fade">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-container modal-container--batch" role="dialog" aria-modal="true" aria-labelledby="batch-modal-title">
        <div class="modal-header">
          <h2 class="modal-title" id="batch-modal-title">🧪 Batch — {{ cocktail?.name }}</h2>
          <button @click="$emit('close')" class="btn-icon btn-icon--close" aria-label="Fermer">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <div class="batch-controls">
            <label class="batch-field">
              <span>Nombre de portions</span>
              <input
                type="number"
                min="1"
                v-model.number="servings"
              />
            </label>

            <label class="batch-field">
              <span>
                Dilution
                <small>(eau ajoutée par le shake/stir — 20-25% typique)</small>
              </span>
              <input
                type="number"
                min="0"
                max="60"
                v-model.number="dilutionPercent"
              />
              <span class="unit-suffix">%</span>
            </label>
          </div>

          <div v-if="batch.missingPrice.length" class="batch-warning">
            ⚠️ Prix manquant pour : {{ batch.missingPrice.join(', ') }}.
            Le coût affiché est incomplet.
          </div>

          <table class="batch-table">
            <thead>
              <tr>
                <th>Ingrédient</th>
                <th>Qté / verre</th>
                <th>Qté batch</th>
                <th>Coût batch</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in batch.ingredientLines" :key="line.name">
                <td>{{ line.name }}</td>
                <td>{{ formatMl(line.ml) }}</td>
                <td>{{ formatMl(line.batchMl) }}</td>
                <td>{{ line.priced ? formatPrice(line.batchCost) : '—' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="batch-summary">
            <div class="summary-row">
              <span>Volume total (avant dilution)</span>
              <strong>{{ formatMl(batch.baseVolumeMl) }}</strong>
            </div>
            <div class="summary-row">
              <span>Eau à ajouter</span>
              <strong>{{ formatMl(batch.waterToAddMl) }}</strong>
            </div>
            <div class="summary-row summary-row--total">
              <span>Volume final</span>
              <strong>{{ formatMl(batch.totalVolumeMlWithDilution) }}</strong>
            </div>
            <div class="summary-row summary-row--total">
              <span>Coût matière total</span>
              <strong>{{ formatPrice(batch.totalCost) }}</strong>
            </div>
            <div class="summary-row">
              <span>Coût par portion</span>
              <strong>{{ formatPrice(batch.costPerServing) }}</strong>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-modal-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { calculateBatch } from '@/composables/useCostCalculator'

const props = defineProps({
  open:        { type: Boolean, default: false },
  cocktail:    { type: Object,  default: () => null },
  ingredients: { type: Array,   default: () => [] },
})

const emit = defineEmits(['close'])

function handleKeydown(e) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

const servings        = ref(20)
const dilutionPercent = ref(20)

const batch = computed(() =>
  calculateBatch(
    props.cocktail?.recipe ?? [],
    props.ingredients,
    Math.max(1, servings.value || 1),
    dilutionPercent.value
  )
)

function formatMl(ml) {
  if (ml >= 1000) return `${(ml / 1000).toFixed(2)} L`
  return `${Math.round(ml)} ml`
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0)
}
</script>

<style scoped>
.batch-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.batch-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
}

.batch-field small {
  font-weight: normal;
  color: var(--text-secondary, #888);
}

.batch-field input {
  padding: 8px 10px;
  border: 1px solid var(--border, #ddd);
  border-radius: 8px;
  width: 140px;
}

.batch-warning {
  background: rgba(230, 160, 30, 0.12);
  border: 1px solid rgba(230, 160, 30, 0.4);
  color: #8a5a00;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.batch-table th,
.batch-table td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border, #eee);
}

.batch-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.summary-row--total {
  font-size: 1rem;
  padding-top: 6px;
  border-top: 1px solid var(--border, #eee);
}
</style>