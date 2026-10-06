<template>
  <div class="password-modal-overlay" @click.self="$emit('close')">
    <div ref="dialogRef" class="password-modal-content" role="dialog" aria-modal="true" aria-labelledby="drinker-login-modal-title">

      <div class="password-modal-header">
        <h2 class="password-modal-title" id="drinker-login-modal-title">🥂 {{ locale === 'fr' ? 'Bienvenue !' : 'Welcome!' }}</h2>
        <button @click="$emit('close')" class="password-modal-close" :aria-label="locale === 'fr' ? 'Fermer' : 'Close'">
          <X :size="20" />
        </button>
      </div>

      <div class="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'select'"
          :class="['auth-tab', { active: mode === 'select' }]"
          @click="setMode('select')"
        >{{ locale === 'fr' ? 'Sélectionner un compte' : 'Select an account' }}</button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'create'"
          :class="['auth-tab', { active: mode === 'create' }]"
          @click="setMode('create')"
        >{{ locale === 'fr' ? 'Créer un compte' : 'Create an account' }}</button>
      </div>

      <!-- Sélectionner un compte -->
      <template v-if="mode === 'select'">
        <p class="password-modal-description">
          {{ locale === 'fr'
            ? 'Retrouve ton profil parmi les clients de ce bar.'
            : 'Find your profile among this bar\'s customers.'
          }}
        </p>

        <div class="password-form-group">
          <select
            v-model="selectedPseudo"
            class="password-form-input"
            :disabled="loadingList || !drinkers.length"
            :aria-label="locale === 'fr' ? 'Compte' : 'Account'"
          >
            <option value="" disabled>
              {{ loadingList
                ? (locale === 'fr' ? 'Chargement...' : 'Loading...')
                : drinkers.length
                  ? (locale === 'fr' ? 'Choisis ton pseudo...' : 'Choose your nickname...')
                  : (locale === 'fr' ? 'Aucun compte pour l\'instant' : 'No account yet')
              }}
            </option>
            <option v-for="d in drinkers" :key="d.id" :value="d.pseudo">{{ d.pseudo }}</option>
          </select>
        </div>

        <p v-if="errorMessage" class="password-form-error">{{ errorMessage }}</p>

        <div class="password-modal-buttons">
          <button
            @click="submitSelect"
            class="password-btn-submit"
            :disabled="!selectedPseudo || isLoading"
          >
            {{ isLoading
              ? (locale === 'fr' ? '⏳ Chargement...' : '⏳ Loading...')
              : (locale === 'fr' ? 'Me connecter' : 'Log in')
            }}
          </button>
        </div>
      </template>

      <!-- Créer un compte -->
      <template v-else>
        <p class="password-modal-description">
          {{ locale === 'fr'
            ? 'Comment veux-tu être identifié(e) ? Rentre un pseudo pour sauvegarder tes favoris et ton historique.'
            : 'How would you like to be identified? Enter a nickname to save your favorites and history.'
          }}
        </p>

        <div class="password-form-group">
          <input
            ref="pseudoField"
            v-model="pseudoInput"
            type="text"
            :placeholder="locale === 'fr' ? 'Ton pseudo...' : 'Your nickname...'"
            class="password-form-input"
            @keyup.enter="submitCreate"
            :maxlength="24"
          />
        </div>

        <p v-if="errorMessage" class="password-form-error">{{ errorMessage }}</p>

        <div class="password-modal-buttons">
          <button
            @click="submitCreate"
            class="password-btn-submit"
            :disabled="!pseudoInput.trim() || isLoading"
          >
            {{ isLoading
              ? (locale === 'fr' ? '⏳ Chargement...' : '⏳ Loading...')
              : (locale === 'fr' ? "C'est parti" : 'Got it')
            }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useDrinker } from '@/composables/useDrinker'
import { useModalAccessibility } from '@/composables/useModalAccessibility'

const props = defineProps({
  locale: String,
  barId: { type: String, required: true },
})

const emit = defineEmits(['drinker-created', 'drinker-selected', 'close'])
const dialogRef = ref(null)
useModalAccessibility(dialogRef, () => emit('close'))

const { fetchBarDrinkers } = useDrinker()

const mode = ref('select')
const drinkers = ref([])
const loadingList = ref(true)
const selectedPseudo = ref('')
const pseudoInput = ref('')
const pseudoField = ref(null)
const errorMessage = ref('')
const isLoading = ref(false)

onMounted(async () => {
  drinkers.value = await fetchBarDrinkers(props.barId)
  loadingList.value = false
  // Aucun compte dans le bar → on ouvre directement la création
  if (!drinkers.value.length) setMode('create')
})

function setMode(next) {
  mode.value = next
  errorMessage.value = ''
  if (next === 'create') nextTick(() => pseudoField.value?.focus())
}

// Callback passé au parent : réinitialise le loading et affiche l'erreur éventuelle
function done(err) {
  isLoading.value = false
  if (err) errorMessage.value = err
}

function submitSelect() {
  if (!selectedPseudo.value || isLoading.value) return
  errorMessage.value = ''
  isLoading.value = true
  emit('drinker-selected', selectedPseudo.value, done)
}

function submitCreate() {
  const pseudo = pseudoInput.value.trim()
  if (!pseudo || isLoading.value) return
  errorMessage.value = ''
  isLoading.value = true
  emit('drinker-created', pseudo, done)
}
</script>
