<template>
  <div class="drinker-panel-wrapper">

    <!-- Connecté : pseudo non cliquable + bouton déconnexion -->
    <template v-if="hasDrinker">
      <div class="drinker-identity">
        <User :size="15" />
        <span class="btn-mode-label">{{ drinkerPseudo }}</span>
      </div>
      <button @click="handleClear" class="btn-mode btn-mode-inactive" title="Se déconnecter">
        <LogOut :size="15" />
      </button>
    </template>

    <!-- Pas connecté : bouton qui ouvre la modal -->
    <template v-else>
      <button @click="showModal = true" class="btn-drinker">
        <User :size="15" />
        <span class="btn-mode-label">Mon profil</span>
      </button>

      <!-- Modal -->
      <div v-if="showModal" class="password-modal-overlay" @click.self="showModal = false">
        <div class="password-modal-content">

          <div class="password-modal-header">
            <h2 class="password-modal-title">👤 Mon profil</h2>
            <button @click="showModal = false" class="password-modal-close">
              <X :size="20" />
            </button>
          </div>

          <div class="auth-tabs">
            <button :class="['auth-tab', { active: loginTab === 'reconnect' }]" @click="loginTab = 'reconnect'; createError = ''">
              Se connecter
            </button>
            <button :class="['auth-tab', { active: loginTab === 'create' }]" @click="loginTab = 'create'; createError = ''">
              Nouveau profil
            </button>
          </div>

          <!-- Créer un profil -->
          <template v-if="loginTab === 'create'">
            <p class="password-modal-description">Choisis un pseudo pour sauvegarder tes favoris et ton historique.</p>
            <div class="password-form-group">
              <input
                v-model="pseudoInput"
                type="text"
                placeholder="Ton pseudo..."
                class="password-form-input"
                @keyup.enter="handleCreate"
                maxlength="24"
                autofocus
              />
            </div>
          </template>

          <!-- Reconnexion par pseudo -->
          <template v-else>
            <p class="password-modal-description">Entre ton pseudo pour retrouver ton profil.</p>
            <div class="password-form-group">
              <input
                v-model="tokenInput"
                type="text"
                placeholder="Ton pseudo..."
                class="password-form-input"
                @keyup.enter="handleReconnect"
                maxlength="24"
              />
            </div>
          </template>

          <p v-if="createError" class="password-form-error">{{ createError }}</p>

          <div class="password-modal-buttons">
            <button @click="showModal = false" class="password-btn-cancel">Annuler</button>
            <button
              @click="loginTab === 'create' ? handleCreate() : handleReconnect()"
              class="password-btn-submit"
              :disabled="loginTab === 'create' ? !pseudoInput.trim() : !tokenInput.trim()"
            >
              {{ loginTab === 'create' ? "C'est parti !" : 'Retrouver mon profil' }}
            </button>
          </div>

        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { User, LogOut, X } from 'lucide-vue-next'
import { useDrinker } from '@/composables/useDrinker'

const props = defineProps({
  barId: { type: String, required: true },
})

const { hasDrinker, drinkerPseudo, createDrinker, reconnectDrinker, clearDrinker } = useDrinker()

const showModal   = ref(false)
const loginTab    = ref('reconnect')
const pseudoInput = ref('')
const tokenInput  = ref('')
const createError = ref('')

async function handleCreate() {
  if (!pseudoInput.value.trim()) return
  createError.value = ''
  const result = await createDrinker({ pseudo: pseudoInput.value.trim(), barId: props.barId })
  if (!result.success) {
    createError.value = result.error?.includes('unique') || result.error?.includes('duplicate')
      ? 'Ce pseudo est déjà pris dans ce bar.'
      : 'Erreur lors de la création. Réessaie.'
  } else {
    showModal.value   = false
    pseudoInput.value = ''
  }
}

async function handleReconnect() {
  if (!tokenInput.value.trim()) return
  createError.value = ''
  const result = await reconnectDrinker({ pseudo: tokenInput.value.trim(), barId: props.barId })
  if (!result.success) {
    createError.value = 'Pseudo introuvable dans ce bar.'
  } else {
    showModal.value = false
  }
  tokenInput.value = ''
}

function handleClear() {
  clearDrinker()
  pseudoInput.value = ''
  loginTab.value    = 'create'
}
</script>