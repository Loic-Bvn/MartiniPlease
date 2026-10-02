<template>
  <span v-if="enabled" class="prep-wrap" @click.stop>
    <!-- Mode quantité ouvert (modal de détail) -->
    <template v-if="open">
      <button type="button" class="prep-step" :disabled="qty <= 1" @click.stop="qty--" :aria-label="locale === 'fr' ? 'Moins' : 'Less'">
        <Minus :size="14" />
      </button>
      <span class="prep-qty" aria-live="polite">{{ qty }}</span>
      <button type="button" class="prep-step" :disabled="qty >= 50" @click.stop="qty++" :aria-label="locale === 'fr' ? 'Plus' : 'More'">
        <Plus :size="14" />
      </button>
      <button type="button" class="prep-confirm" :disabled="busy" @click.stop="submit(qty)">
        <Check :size="14" />
        {{ locale === 'fr' ? 'Valider' : 'Confirm' }}
      </button>
      <button type="button" class="prep-step" @click.stop="close" :aria-label="locale === 'fr' ? 'Annuler' : 'Cancel'">
        <X :size="14" />
      </button>
    </template>

    <!-- Bouton principal -->
    <button
      v-else
      type="button"
      :class="['btn-icon', 'prep-btn', { 'prep-btn--done': justLogged }]"
      :disabled="busy"
      :title="title"
      :aria-label="title"
      @click.stop="onMainClick"
    >
      <Check v-if="justLogged" :size="18" />
      <CircleFadingPlus v-else :size="18" />
    </button>
  </span>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Check, CircleFadingPlus, Plus, Minus, X } from 'lucide-vue-next'
import { useBarFeatures } from '@/composables/useBarFeatures'
import { usePreparations } from '@/composables/usePreparations'

const props = defineProps({
  cocktailId:   { type: String, required: true },
  cocktailName: { type: String, default: '' },
  barId:        { type: String, default: '' },
  cardId:       { type: String, default: null },
  locale:       { type: String, default: 'fr' },
  // false : un clic = +1 (card). true : un clic ouvre le choix de quantité (modal).
  withQuantity: { type: Boolean, default: false },
})

const { isFeatureEnabled } = useBarFeatures()
const { logPreparation } = usePreparations()

const enabled    = computed(() => !!props.barId && isFeatureEnabled('preparationCounter'))
const open       = ref(false)
const qty        = ref(1)
const busy       = ref(false)
const justLogged = ref(false)
let _flashTimer  = null

const title = computed(() =>
  props.locale === 'fr'
    ? (props.withQuantity ? 'Marquer comme préparé (quantité)' : 'Marquer comme préparé (+1)')
    : (props.withQuantity ? 'Mark as prepared (quantity)' : 'Mark as prepared (+1)')
)
function close() {
  open.value = false
  qty.value = 1
}

function onMainClick() {
  if (props.withQuantity) { open.value = true; return }
  submit(1)
}

async function submit(quantity) {
  if (busy.value) return
  busy.value = true
  try {
    const res = await logPreparation({
      barId:        props.barId,
      cocktailId:   props.cocktailId,
      cocktailName: props.cocktailName,
      cardId:       props.cardId,
      quantity,
    })
    if (res.success) {
      close()
      justLogged.value = true
      if (_flashTimer) clearTimeout(_flashTimer)
      _flashTimer = setTimeout(() => { justLogged.value = false }, 1200)
    }
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.prep-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.prep-btn:disabled { opacity: 0.5; cursor: progress; }

.prep-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--border-mid);
  background: var(--bg-input);
  color: var(--text-muted);
  cursor: pointer;
}
.prep-step:hover:not(:disabled) { color: var(--text); border-color: var(--gold); }
.prep-step:disabled { opacity: 0.4; cursor: not-allowed; }
.prep-step:focus-visible,
.prep-confirm:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

.prep-qty {
  min-width: 22px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}
.prep-confirm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--gold);
  background: var(--gold);
  color: var(--bg);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.prep-confirm:disabled { opacity: 0.6; cursor: progress; }
</style>