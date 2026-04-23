<template>
  <div class="password-modal-overlay" @click.self="$emit('close')">
    <div class="password-modal-content">

      <div class="password-modal-header">
        <h2 class="password-modal-title">🥂 {{ locale === 'fr' ? 'Bienvenue !' : 'Welcome!' }}</h2>
        <button @click="$emit('close')" class="password-modal-close">
          <X :size="20" />
        </button>
      </div>

      <p class="password-modal-description">
        {{ locale === 'fr' 
          ? 'Comment veux-tu être identifié(e) ? Rentre un pseudo pour sauvegarder tes favoris et ton historique.' 
          : 'How would you like to be identified? Enter a nickname to save your favorites and history.' 
        }}
      </p>

      <div class="password-form-group">
        <input
          v-model="pseudoInput"
          type="text"
          :placeholder="locale === 'fr' ? 'Ton pseudo...' : 'Your nickname...'"
          class="password-form-input"
          @keyup.enter="submitPseudo"
          :maxlength="24"
          autofocus
        />
      </div>

      <p v-if="errorMessage" class="password-form-error">{{ errorMessage }}</p>

      <div class="password-modal-buttons">
        <button
          @click="submitPseudo"
          class="password-btn-submit"
          :disabled="!pseudoInput.trim() || isLoading"
        >
          {{ isLoading 
            ? (locale === 'fr' ? '⏳ Chargement...' : '⏳ Loading...')
            : (locale === 'fr' ? "C'est parti" : 'Got it')
          }}
        </button>
        <button @click="guestMode" class="password-btn-cancel">
          {{ locale === 'fr' ? '👻 Mode invité' : '👻 Guest mode' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  locale: String,
})

const emit = defineEmits(['drinker-created', 'guest-mode', 'close'])

const pseudoInput = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function submitPseudo() {
  const pseudo = pseudoInput.value.trim()
  if (!pseudo) return
  errorMessage.value = ''
  isLoading.value = true
  emit('drinker-created', pseudo)
  // Note: isLoading sera réinitialisé après fermeture
}

function guestMode() {
  emit('guest-mode')
}
</script>
