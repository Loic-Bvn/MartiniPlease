<template>
  <transition
    enter-active-class="transition-all duration-300"
    leave-active-class="transition-all duration-300"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div v-if="visible" class="fixed bottom-0 left-0 right-0 storage-banner shadow-lg z-50">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <p class="storage-banner-text text-sm flex-1">
            📦 {{ t.message }}
          </p>
          <div class="flex gap-2 flex-shrink-0">
            <button @click="dismiss" class="btn-secondary text-sm">{{ t.close }}</button>
            <button @click="accept" class="btn-primary text-sm">{{ t.accept }}</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  forceShow: { type: Boolean, default: false },
  locale: { type: String, default: 'fr' }
})

const emit = defineEmits(['close'])
const visible = ref(false)

const t = computed(() => props.locale === 'fr' ? {
  message: 'MartiniPlease utilise localStorage uniquement pour vos préférences (thème, langue, unités). Aucun cookie de suivi.',
  close: 'Fermer',
  accept: 'Compris ✓',
} : {
  message: 'MartiniPlease uses localStorage only for your preferences (theme, language, units). No tracking cookies.',
  close: 'Close',
  accept: 'Got it ✓',
})

const accept = () => {
  localStorage.setItem('storage-consent', 'accepted')
  visible.value = false
  emit('close')
}

const dismiss = () => {
  visible.value = false
  emit('close')
}

onMounted(() => {
  if (props.forceShow) {
    visible.value = true
  } else {
    const consent = localStorage.getItem('storage-consent')
    visible.value = !consent
    if (consent) emit('close')
  }
})
</script>

<style scoped>
.storage-banner {
  background: linear-gradient(to right, var(--bg-raised), var(--bg));
  border-top: 1px solid rgba(160, 120, 40, 0.25);
}
.dark .storage-banner {
  background: linear-gradient(135deg, rgba(34,31,26,0.97), rgba(26,24,20,0.97));
  border-top: 1px solid rgba(201,168,76,0.2);
  box-shadow: 0 -4px 16px rgba(0,0,0,0.3);
}
.storage-banner-text {
  color: var(--text-muted);
}
.dark .storage-banner-text { color: var(--text-dim); }
.btn-secondary {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.btn-secondary:hover { opacity: 0.7; }
.btn-primary {
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
  background: var(--gold);
  color: var(--bg);
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  border: none;
  font-weight: 500;
}
.btn-primary:hover { opacity: 0.85; }
</style>