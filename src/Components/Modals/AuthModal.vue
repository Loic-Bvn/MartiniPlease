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
          @click="mode = 'login'; authError = ''"
        >Connexion</button>
        <button
          :class="['auth-tab', { active: mode === 'signup' }]"
          @click="mode = 'signup'; authError = ''"
        >Créer un compte</button>
      </div>

      <!-- Formulaire login -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" novalidate>
        <div class="password-form-group">
          <input
            type="email"
            v-model="email"
            placeholder="Email"
            class="password-form-input"
            autocomplete="email"
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
          <button type="submit" class="password-btn-submit" :disabled="authLoading">
            {{ authLoading ? '...' : 'Se connecter' }}
          </button>
        </div>
      </form>

      <!-- Formulaire signup -->
      <form v-else @submit.prevent="handleSignup" novalidate>
        <div class="password-form-group">
          <input
            type="text"
            v-model="barName"
            placeholder="Nom de ton bar"
            class="password-form-input"
            autocomplete="organization"
          />
        </div>
        <div class="password-form-group">
          <input
            type="email"
            v-model="email"
            placeholder="Email"
            class="password-form-input"
            autocomplete="email"
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
          <button type="submit" class="password-btn-submit" :disabled="authLoading">
            {{ authLoading ? '...' : 'Créer mon bar' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits(['close', 'success'])

const { signIn, signUp, authLoading, authError } = useAuth()

const mode     = ref('login')
const email    = ref('')
const password = ref('')
const barName  = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  const result = await signIn({ email: email.value, password: password.value })
  if (result.success) {
    emit('success')
    emit('close')
  }
}

async function handleSignup() {
  if (!email.value || !password.value || !barName.value) return
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
</script>