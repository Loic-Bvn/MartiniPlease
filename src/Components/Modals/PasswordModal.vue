<!-- PASSWORD HANDLING FOR SWITCHING TO BARTENDER MODE -->
<template>
<div 
    class="password-modal-overlay"
    @click.self="onClose"
>
    <div class="password-modal-content">
        <!-- Header -->
        <div class="password-modal-header">
            <h2 class="password-modal-title">Mode Bartender</h2>
            <button 
                @click="onClose" 
                class="password-modal-close"
                aria-label="Fermer"
            >
                <X :size="20" />
            </button>
        </div>

        <!-- Message -->
        <p class="password-modal-description">
            Entrez le mot de passe pour accéder au mode bartender
        </p>

        <!-- Input mot de passe -->
        <div class="password-form-group">
            <input
                type="password"
                v-model="password"
                @keypress.enter="handleSubmit"
                placeholder="Mot de passe..."
                class="password-form-input"
                autofocus
            />
            <p v-if="error" class="password-form-error">{{ error }}</p>
        </div>

        <!-- Boutons -->
        <div class="password-modal-buttons">
            <button
                @click="onClose"
                class="password-btn-cancel"
            >
                Annuler
            </button>
            <button
                @click="handleSubmit"
                class="password-btn-submit"
                :disabled="!password.trim()"
            >
                Valider
            </button>
        </div>
    </div>
</div>
</template>

<script setup>
import { ref } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
    onClose: {
    type: Function,
        required: true
    },
    onSuccess: {
        type: Function,
        required: true
    }
    });

const password = ref('');
const error = ref('');

// Définis ton mot de passe ici (ou récupère-le depuis une variable d'environnement)
// const BARTENDER_PASSWORD = 'MartiniPlease';
const BARTENDER_PASSWORD = 'a';

function handleSubmit() {
    if (!password.value.trim()) {
        error.value = 'Veuillez entrer un mot de passe';
        return;
    }

    if (password.value === BARTENDER_PASSWORD) {
        error.value = '';
        props.onSuccess();
        props.onClose();
    } else {
        error.value = 'Mot de passe incorrect';
        password.value = '';
    }
}
</script>

<style scoped>
/* Tous les styles sont centralisés dans styles.css */
</style>