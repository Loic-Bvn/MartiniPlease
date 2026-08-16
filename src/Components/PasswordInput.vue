<!--
  PasswordInput.vue
  Champ mot de passe réutilisable avec bouton œil pour afficher/masquer
  la saisie en clair. Utilisé partout où un mot de passe est saisi :
  AuthModal.vue (connexion + création de compte) et ResetPasswordView.vue
  (nouveau mot de passe + confirmation).

  Usage :
    <PasswordInput v-model="password" placeholder="Mot de passe" autocomplete="current-password" />
-->
<template>
  <div class="password-input-wrapper">
    <input
      :type="visible ? 'text' : 'password'"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      class="password-form-input"
      :autocomplete="autocomplete"
    />
    <button
      type="button"
      class="password-toggle-visibility"
      tabindex="-1"
      :aria-label="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="18" />
      <Eye v-else :size="18" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' },
})
defineEmits(['update:modelValue'])

// État local : volontairement non exposé au parent, chaque champ gère
// sa propre visibilité indépendamment des autres.
const visible = ref(false)
</script>

<style scoped>
.password-input-wrapper {