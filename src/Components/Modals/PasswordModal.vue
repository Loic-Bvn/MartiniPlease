<template>
  <div class="password-modal-overlay" @click.self="$emit('close')">
    <div class="password-modal-content">

      <div class="password-modal-header">
        <h2 class="password-modal-title">Mode Bartender</h2>
        <button @click="$emit('close')" class="password-modal-close" aria-label="Fermer">
          <X :size="20" />
        </button>
      </div>

      <p class="password-modal-description">
        Entrez le mot de passe pour accéder au mode bartender
      </p>

      <div class="password-form-group">
        <input
          ref="passwordInputRef"
          type="password"
          v-model="password"
          @keypress.enter="handleSubmit"
          placeholder="Mot de passe..."
          class="password-form-input"
          required
        />
        <p v-if="error" class="password-form-error">{{ error }}</p>
      </div>

      <div class="password-modal-buttons">
        <button @click="$emit('close')" class="password-btn-cancel">Annuler</button>
        <button @click="handleSubmit" class="password-btn-submit" :disabled="!password.trim()">
          Valider
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'

const emit = defineEmits(['close', 'success'])

const password = ref('')
const error = ref('')
const passwordInputRef = ref(null)
const previousFocusElement = ref(null)

const BARTENDER_PASSWORD = import.meta.env.VITE_BARTENDER_PASSWORD

// Focus management
onMounted(() => {
  previousFocusElement.value = document.activeElement
  passwordInputRef.value?.focus()
})

onBeforeUnmount(() => {
  // Restaurer le focus au dernier élément actif
  if (previousFocusElement.value?.focus) {
    previousFocusElement.value.focus()
  }
})

function handleSubmit() {
  if (!password.value.trim()) {
    error.value = 'Veuillez entrer un mot de passe'
    return
  }
  if (password.value === BARTENDER_PASSWORD) {
    error.value = ''
    emit('success')
    emit('close')
  } else {
    error.value = 'Mot de passe incorrect'
    password.value = ''
  }
}
</script>
