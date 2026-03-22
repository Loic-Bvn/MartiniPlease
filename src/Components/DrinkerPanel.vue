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
            <button :class="['auth-tab', { active: loginTab === 'create' }]" @click="loginTab = 'create'; createError = ''">
              Nouveau profil
            </button>
            <button :class="['auth-tab', { active: loginTab === 'reconnect' }]" @click="loginTab = 'reconnect'; createError = ''">
              Se reconnecter
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
const loginTab    = ref('create')
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

<style scoped>
.drinker-panel-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.drinker-identity {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-mid);
  background: var(--bg-raised);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: default;
  user-select: none;
}

.btn-drinker {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-mid);
  background: var(--bg-raised);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-drinker:hover {
  border-color: var(--gold-dim);
  color: var(--gold);
}

.auth-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.auth-tab {
  flex: 1;
  padding: 8px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.15s;
  margin-bottom: -1px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.auth-tab.active {
  color: var(--gold);
  border-bottom-color: var(--gold);
}
</style>