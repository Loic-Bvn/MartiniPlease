<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileJson class="text-blue-600" :size="24" />
          Importer des données
        </h2>
        <button @click="onClose" class="p-1 hover:bg-gray-100 rounded">
          <X :size="20" />
        </button>
      </div>
      <div class="space-y-4">
        <p class="text-gray-600 text-sm">
          Importe ton fichier JSON de cocktails
        </p>
        <!-- Zone de drop/selection de fichier -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            @change="onUpload"
            class="hidden"
            id="file-upload"
          />
          <label for="file-upload" class="cursor-pointer">
            <Upload class="mx-auto text-gray-400 mb-2" :size="32" />
            <p class="text-sm text-gray-600">Clique pour sélectionner</p>
            <p class="text-xs text-gray-400 mt-1">Format JSON uniquement</p>
          </label>
        </div>
        <!-- Affichage des erreurs -->
        <div
          v-if="uploadError"
          class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle class="text-red-600 flex-shrink-0 mt-0.5" :size="18" />
          <p class="text-sm text-red-800">{{ uploadError }}</p>
        </div>
        <!-- Bouton pour utiliser les données d'exemple -->
        <div class="pt-4 border-t">
          <button
            @click="onUseSampleData"
            class="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Utiliser les données d'exemple
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { X, Upload, FileJson, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  onClose: Function,
  onUpload: Function,
  onUseSampleData: Function,
  uploadError: String
});

const fileInputRef = ref(null);
</script>
<style scoped>
/* À compléter si besoin */
</style>