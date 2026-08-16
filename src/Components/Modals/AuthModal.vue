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
          <button type="submit" class="password-btn-submit"