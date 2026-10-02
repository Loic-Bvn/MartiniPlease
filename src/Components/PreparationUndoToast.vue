<template>
  <Transition name="modal-fade">
    <div v-if="lastEntry" class="prep-undo" role="status" aria-live="polite">
      <span class="prep-undo-text">
        {{ locale === 'fr' ? 'Préparé' : 'Prepared' }} : {{ lastEntry.cocktailName || '—' }}<template v-if="lastEntry.quantity > 1"> ×{{ lastEntry.quantity }}</template>
      </span>
      <button type="button" class="prep-undo-btn" @click="undoLast">
        {{ locale === 'fr' ? 'Annuler' : 'Undo' }}
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { usePreparations } from '@/composables/usePreparations'

defineProps({ locale: { type: String, default: 'fr' } })
const { lastEntry, undoLast } = usePreparations()
</script>

<style scoped>
.prep-undo {
  position: fixed;
  left: 50%;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-mid);
  background: var(--bg-raised);
  color: var(--text);
  font-size: 0.88rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}
.prep-undo-btn {
  border: none;
  background: none;
  color: var(--gold);
  font-weight: 600;
  cursor: pointer;
}
.prep-undo-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
</style>