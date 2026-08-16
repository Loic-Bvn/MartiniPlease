<template>
  <div class="password-modal-overlay" @click.self="$emit('close')">
    <div class="password-modal-content">

      <div class="password-modal-header">
        <h2 class="password-modal-title">
          {{ mode === 'login' ? '🍸 Connexion Bartender'
             : mode === 'reset' ? '🔑 Mot de passe oublié'
             : '🍾 Créer mon bar' }}
        </h2>
        <button @click="$emit('close')" class="password-modal-close">
          <X :size="20" />
        </button>
      </div>

      <!-- Tabs login / signup -->
      <div class="auth-tabs" v-if="mode !== 'reset'">
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
          <PasswordInput
            v-model="password"
            placeholder="Mot de passe"
            autocomplete="current-password"
          />
        </div>

        <p v-if="authError" class="password-form-error">{{ authError }}</p>

        <button
          type="button"
          class="password-forgot-link"
          @click="mode = 'reset'; authError = ''; resetSent = false"
        >Mot de passe oublié ?</button>

        <div class="password-modal-buttons">
          <button type="button" @click="$emit('close')" class="password-btn-cancel">Annuler</button>
          <button type="submit" class="password-btn-submit" :disabled="authLoading">
            {{ authLoading ? '...' : 'Se connecter' }}
          </button>
        </div>
      </form>

      <!-- Formulaire reset mot de passe -->
      <form v-else-if="mode === 'reset'" @submit.prevent="handleResetRequest" novalidate>
        <p class="password-modal-description">
          Indique ton email, on t'envoie un lien pour choisir un nouveau mot de passe.
        </p>

        <div v-if="!resetSent" class="password-form-group">
          <input
            type="email"
            v-model="email"
            placeholder="Email"
            class="password-form-input"
            autocomplete="email"
          />
        </div>
        <p v-else class="password-reset-success">
          📬 Si un compte existe pour cet email, un lien vient d'être envoyé. Pense à vérifier tes spams.
        </p>

        <p v-if="authError" class="password-form-error">{{ authError }}</p>

        <div class="password-modal-buttons">
          <button type="button" @click="mode = 'login'; authError = ''" class="password-btn-cancel">
            {{ resetSent ? 'Retour' : 'Annuler' }}
          </button>
          <button
            v-if="!resetSent"
            type="submit"
            class="password-btn-submit"
            :disabled="authLoading"
          >
            {{ authLoading ? '...' : 'Envoyer le lien' }}
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
          <PasswordInput
            v-model="password"
            placeholder="Mot de passe (8 caractères min)"
            autocomplete="new-password"
          />
        </div>
        <div class="password-form-group">
          <input
            type="text"
            v-model="inviteCode"
            placeholder="Code VIP (optionnel)"
            class="password-form-input"
            autocomplete="off"
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
import PasswordInput from '@/Components/PasswordInput.vue'

const emit = defineEmits(['close', 'success'])

const { signIn, signUp, resetPasswordForEmail, authLoading, authError } = useAuth()

const mode       = ref('login')
const email      = ref('')
const password   = ref('')
const barName    = ref('')
const inviteCode = ref('')
const resetSent  = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  const result = await signIn({ email: email.value, password: password.value })
  if (result.success) {
    emit('success')
    emit('close')
  }
}

async function handleResetRequest() {
  if (!email.value) return
  // Supabase ne renvoie pas d'erreur si l'email n'existe pas (pas d'énumération
  // de comptes possible) : on ne voit une vraie erreur ici qu'en cas de souci
  // réel (rate limit, email mal formé, etc.).
  const result = await resetPasswordForEmail(email.value)
  if (result.success) resetSent.value = true
}

async function handleSignup() {
  if (!email.value || !password.value || !barName.value) return
  const result = await signUp({
    email:      email.value,
    password:   password.value,
    barName:    barName.value,
    inviteCode: inviteCode.value,
  })
  if (result.success) {
    emit('success')
    emit('close')
  }
}
</script>