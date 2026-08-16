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
  position: relative;
}

/* Laisse la place au bouton œil pour que le texte ne passe pas dessous */
.password-input-wrapper :deep(.password-form-input) {
  padding-right: 2.5rem;
}

.password-toggle-visibility {
  position: absolute;
  top: 50%;
  right: 0.6rem;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.55;
  transition: opacity 0.15s;
}

/* color: inherit + opacity plutôt qu'une var(--...) spécifique : évite de
   dépendre des noms de variables (qui diffèrent selon le thème actif,
   cf. assets/styles*.css) tout en restant lisible sur tous les fonds. */
.password-toggle-visibility:hover,
.password-toggle-visibility:focus-visible {
  opacity: 1;
}

.password-toggle-visibility:focus-visible {
  outline: 2px solid var(--gold-dim, currentColor);
  outline-offset: 1px;
  border-radius: 4px;
}
</style>