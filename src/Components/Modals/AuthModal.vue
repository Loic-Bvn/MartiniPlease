<template>
  <div class="password-modal-overlay" @click.self="$emit('close')">
    <div class="password-modal-content">

      <div class="password-modal-header">
        <h2 class="password-modal-title">
          {{ mode === 'login' ? '🍸 Connexion Bartender' : '🍾 Créer mon bar' }}
        </h2>
        <button @click="$emit('close')" class="password-modal-close">
          <X :size="20" />
        </button>
      </div>

      <!-- Tabs login / signup -->
      <div class="auth-tabs">
        <button
          :class="['auth-tab', { active: mode === 'login' }]"
          @click="switchMode('login')"
        >Connexion</button>
        <button
          :class="['auth-tab', { active: mode === 'signup' }]"
          @click="switchMode('signup')"
        >Créer un compte</button>
      </div>

      <!-- Formulaire login -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" novalidate>
        <div class="password-form-group">
          <input
            ref="emailInputRef"
            type="email"
            v-model="email"
            placeholder="Email"
            class="password-form-input"
            autocomplete="email"
            required
          />
        </div>
        <div class="password-form-group">
          <input
            type="password"
            v-model="password"
            placeholder="Mot de passe"
            class="password-form-input"
            autocomplete="current-password"
          />
        </div>

        <p v-if="authError" class="password-form-error">{{ authError }}</p>

        <div class="password-modal-buttons">
          <button type="button" @click="$emit('close')" class="password-btn-cancel">Annuler</button>
          <button type="submit" class="password-btn-submit" :disabled="authLoading || !isLoginValid">
            {{ authLoading ? '...' : 'Se connecter' }}
          </button>
        </div>
      </form>

      <!-- Formulaire signup -->
      <form v-else @submit.prevent="handleSignup" novalidate>
        <div class="password-form-group">
          <input
            ref="barNameInputRef"
            type="text"
            v-model="barName"
            placeholder="Nom de ton bar"
            class="password-form-input"
            autocomplete="organization"
            required
          />
        </div>
        <div class="password-form-group">
          <input
            type="email"
            v-model="email"
            placeholder="Email"
            class="password-form-input"
            autocomplete="email"
            required
          />
        </div>
        <div class="password-form-group">
          <input
            type="password"
            v-model="password"
            placeholder="Mot de passe (8 caractères min)"
            class="password-form-input"
            autocomplete="new-password"
          />
        </div>

        <p v-if="authError" class="password-form-error">{{ authError }}</p>

        <div class="password-modal-buttons">
          <button type="button" @click="$emit('close')" class="password-btn-cancel">Annuler</button>
          <button type="submit" class="password-btn-submit" :disabled="authLoading || !isSignupValid">
            {{ authLoading ? '...' : 'Créer mon bar' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits(['close', 'success'])

const { signIn, signUp, authLoading, authError: authErrorFromAPI } = useAuth()

const mode     = ref('login')
const email    = ref('')
const password = ref('')
const barName  = ref('')
const validationError = ref('')
const previousFocusElement = ref(null)
const emailInputRef = ref(null)
const barNameInputRef = ref(null)

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation functions
const validateLogin = () => {
  if (!email.value.trim()) {
    validationError.value = 'Email requis'
    return false
  }
  if (!isValidEmail(email.value)) {
    validationError.value = 'Email invalide'
    return false
  }
  if (!password.value) {
    validationError.value = 'Mot de passe requis'
    return false
  }
  if (password.value.length < 6) {
    validationError.value = 'Mot de passe trop court (min 6 caractères)'
    return false
  }
  validationError.value = ''
  return true
}

const validateSignup = () => {
  if (!barName.value.trim()) {
    validationError.value = 'Nom du bar requis'
    return false
  }
  if (barName.value.trim().length < 2) {
    validationError.value = 'Nom du bar trop court (min 2 caractères)'
    return false
  }
  if (!email.value.trim()) {
    validationError.value = 'Email requis'
    return false
  }
  if (!isValidEmail(email.value)) {
    validationError.value = 'Email invalide'
    return false
  }
  if (!password.value) {
    validationError.value = 'Mot de passe requis'
    return false
  }
  if (password.value.length < 8) {
    validationError.value = 'Mot de passe trop court (min 8 caractères)'
    return false
  }
  validationError.value = ''
  return true
}

const isLoginValid = computed(() => {
  return email.value.trim() && isValidEmail(email.value) && password.value.length >= 6
})

const isSignupValid = computed(() => {
  return barName.value.trim().length >= 2 && isValidEmail(email.value) && password.value.length >= 8
})

const authError = computed(() => validationError.value || authErrorFromAPI.value)

async function handleLogin() {
  if (!validateLogin()) return
  const result = await signIn({ email: email.value, password: password.value })
  if (result.success) {
    emit('success')
    emit('close')
  }
}

async function handleSignup() {
  if (!validateSignup()) return
  const result = await signUp({
    email:    email.value,
    password: password.value,
    barName:  barName.value,
  })
  if (result.success) {
    emit('success')
    emit('close')
  }
}

const resetForm = () => {
  email.value = ''
  password.value = ''
  barName.value = ''
  validationError.value = ''
}

const switchMode = (newMode) => {
  mode.value = newMode
  resetForm()
  // Focus sur le premier input après switch
  setTimeout(() => {
    if (newMode === 'login') {
      emailInputRef.value?.focus()
    } else {
      barNameInputRef.value?.focus()
    }
  }, 0)
}

// Focus management
onMounted(() => {
  previousFocusElement.value = document.activeElement
  emailInputRef.value?.focus()
})

onBeforeUnmount(() => {
  // Restaurer le focus au dernier élément actif
  if (previousFocusElement.value?.focus) {
    previousFocusElement.value.focus()
  }
})
</script>