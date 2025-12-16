<!-- PASSWORD HANDLING FOR SWITCHING TO BARTENDER MODE -->
<template>
<div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="onClose"
>
    <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-800">Mode Bartender</h2>
            <button 
                @click="onClose" 
                class="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Fermer"
            >
                <X :size="20" />
            </button>
        </div>

        <!-- Message -->
        <p class="text-gray-600 mb-4 text-sm">
            Entrez le mot de passe pour accéder au mode bartender
        </p>

        <!-- Input mot de passe -->
        <div class="mb-4">
            <input
                type="password"
                v-model="password"
                @keypress.enter="handleSubmit"
                placeholder="Mot de passe..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                autofocus
            />
            <p v-if="error" class="text-red-600 text-sm mt-2">{{ error }}</p>
        </div>

        <!-- Boutons -->
        <div class="flex gap-2">
            <button
                @click="onClose"
                class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
                Annuler
            </button>
            <button
                @click="handleSubmit"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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