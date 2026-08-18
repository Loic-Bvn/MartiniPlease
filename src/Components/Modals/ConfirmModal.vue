<template>
  <transition name="fade">
    <div v-if="open" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-container modal-container--confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div class="modal-header">
          <h2 class="modal-title" id="confirm-modal-title">{{ title }}</h2>
          <button @click="$emit('cancel')" class="btn-icon btn-icon--close" aria-label="Annuler">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <p class="delete-warning">{{ message }}</p>
        </div>

        <div class="modal-footer">
          <button @click="$emit('cancel')" class="btn-modal-secondary">
            {{ cancelLabel }}
          </button>
          <button @click="$emit('confirm')" class="btn-modal-danger" autofocus>
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { X } from 'lucide-vue-next'
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  open:         { type: Boolean, default: false },
  title:        { type: String,  default: '⚠️ Confirmer' },
  message:      { type: String,  default: '' },
  confirmLabel: { type: String,  default: 'Supprimer' },
  cancelLabel:  { type: String,  default: 'Annuler' },
})

const emit = defineEmits(['confirm', 'cancel'])

function handleKeydown(e) {
  if (e.key === 'Escape' && props.open) emit('cancel')
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>