<template>
  <div class="main-content">
    <div class="welcome-screen">
      <img :src="randomLogo" alt="Martini Please" class="welcome-logo" />
      <h2 class="welcome-title">Martini Please</h2>
      <p class="welcome-subtitle">{{ locale === 'fr' ? 'Gérez votre bar, explorez les cocktails.' : 'Manage your bar, explore cocktails.' }}</p>

      <div class="welcome-cards">

        <!-- Bloc Bartender -->
        <div class="welcome-card">
          <div class="welcome-card-header">
            <span class="welcome-card-icon">🍾</span>
            <div>
              <div class="welcome-card-title">Bartender</div>
              <div class="welcome-card-desc">{{ locale === 'fr' ? 'Gérez votre stock et vos recettes' : 'Manage your stock and recipes' }}</div>
            </div>
          </div>
          <button @click="$emit('open-auth')" class="password-btn-submit welcome-btn">
            {{ locale === 'fr' ? 'Créer ou accéder à mon bar' : 'Create or access my bar' }}
          </button>
        </div>

        <!-- Bloc Drinker -->
        <div class="welcome-card">
          <div class="welcome-card-header">
            <span class="welcome-card-icon">🥂</span>
            <div>
              <div class="welcome-card-title">Drinker</div>
              <div class="welcome-card-desc">{{ locale === 'fr' ? 'Explorez la carte d\'un bar' : 'Explore a bar\'s menu' }}</div>
            </div>
          </div>

          <!-- Bars publics disponibles -->
          <template v-if="!publicBarsLoading && publicBars.length > 0">
            <p class="welcome-public-title">
              {{ locale === 'fr' ? 'Bars disponibles' : 'Available bars' }}
            </p>
            <button
              v-for="b in publicBars"
              :key="b.id"
              class="welcome-demo"
              @click="$emit('join-public-bar', b)"
            >
              🍸 {{ b.name }}
              <span class="welcome-demo-code">{{ b.invite_code }}</span>
            </button>
            <div class="welcome-or-divider">
              <span>{{ locale === 'fr' ? 'ou entrer un code' : 'or enter a code' }}</span>
            </div>
          </template>
          <div v-if="publicBarsLoading" class="welcome-public-loading">
            {{ locale === 'fr' ? 'Chargement des bars...' : 'Loading bars...' }}
          </div>
          <div class="welcome-code-row">
            <input
              :value="inviteCodeInput"
              @input="$emit('update:inviteCodeInput', $event.target.value)"
              type="text"
              :placeholder="locale === 'fr' ? 'Code du bar (ex: STAR-7514)' : 'Bar code (ex: STAR-7514)'"
              class="password-form-input welcome-code-input"
              @keyup.enter="$emit('join-by-code')"
            />
            <button @click="$emit('join-by-code')" class="password-btn-submit">
              {{ locale === 'fr' ? 'Rejoindre' : 'Join' }}
            </button>
          </div>
          <p v-if="codeError" class="password-form-error">{{ codeError }}</p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  randomLogo: String,
  locale: String,
  publicBars: Array,
  publicBarsLoading: Boolean,
  inviteCodeInput: String,
  codeError: String,
})

const emit = defineEmits([
  'open-auth',
  'join-public-bar',
  'join-by-code',
  'update:inviteCodeInput'
])
</script>