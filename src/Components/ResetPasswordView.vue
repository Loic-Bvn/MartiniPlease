<!--
  ResetPasswordView.vue
  Affichée à la place de l'appli tant que passwordRecoveryMode === true
  (cf. useAuth.js → événement 'PASSWORD_RECOVERY'), c'est-à-dire quand
  l'utilisateur arrive depuis le lien reçu par mail après avoir demandé
  un reset. Voir CocktailMenuApp.vue pour le point de branchement.
-->
<template>
  <div class="reset-password-view">
    <div class="reset-password-card">
      <div class="icon">🔑</div>
      <h2>Choisis un nouveau mot de passe</h2>
      <p class="sub">Ce lien est à usage unique, valable un temps limité.</p>

      <template v-if="!done">
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="password-form-group">
            <input
              type="password"
              v-model="newPassword"
              placeholder="Nouveau mot de passe (8 caractères min)"
              class="password-form-input"
              autocomplete="new-password"
            />
          </div>
          <div class="password-form-group">
            <input
              type="password"
              v-model="confirmPassword"
              placeholder="Confirme le mot de passe"
              class="password-form-input"
              autocomplete="new-password"
            />
          </div>

          <p v-if="localError || authError" class="password-form-error">
            {{ localError || authError }}
          </p>

          <div class="password-modal-buttons">
            <button type="button" class="password-btn-cancel" @click="handleCancel">
              Annuler
            </button>
            <button type="submit" class="password-btn-submit" :disabled="authLoading">
              {{ authLoading ? '...' : 'Valider' }}
            </button>
          </div>
        </form>
      </template>

      <template v-else>
        <p class="success-message">✅ Mot de passe mis à jour, te voilà connecté·e !</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { updatePassword, cancelPasswordRecovery, authLoading, authError } = useAuth()

const newPassword     = ref('')
const confirmPassword = ref('')
const localError      = ref('')
const done            = ref(false)

async function handleSubmit() {
  localError.value = ''

  if (newPassword.value.length < 8) {
    localError.value = 'Le mot de passe doit faire au moins 8 caractères.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    localError.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }

  const result = await updatePassword(newPassword.value)
  if (result.success) done.value = true
}

function handleCancel() {
  cancelPasswordRecovery()
}
</script>

<style scoped>
.reset-password-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.reset-password-card {
  max-width: 420px;
  width: 100%;
  text-align: center;
  padding: 40px 28px;
  border-radius: 16px;
  background: var(--surface, #fff);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.icon {
  font-size: 40px;
  margin-bottom: 16px;
}

h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: var(--text);
}

.sub {
  margin: 0 0 24px;
  color: var(--text-muted, #666);
  font-size: 0.85rem;
  line-height: 1.5;
}

form {
  text-align: left;
}

.success-message {
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>