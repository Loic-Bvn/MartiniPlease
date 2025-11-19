<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800">Ajouter à la file</h2>
        <button @click="onClose" class="p-1 hover:bg-gray-100 rounded">
          <X :size="20" />
        </button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Cocktail</label>
          <select
            v-model="selectedCocktail"
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un cocktail</option>
            <option v-for="cocktail in cocktails" :key="cocktail.id" :value="cocktail.id">
              {{ cocktail.Name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Pour qui</label>
          <select
            v-model="selectedProfile"
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un profil</option>
            <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
              {{ profile.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
          <div class="flex items-center gap-2">
            <button
              @click="decrementQuantity"
              class="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              <Minus :size="18" />
            </button>
            <span class="px-4 py-2 font-semibold text-lg">{{ quantity }}</span>
            <button
              @click="incrementQuantity"
              class="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              <Plus :size="18" />
            </button>
          </div>
        </div>
        <button
          @click="handleAdd"
          :disabled="!selectedCocktail || !selectedProfile"
          class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          Ajouter à la file
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { X, Minus, Plus } from 'lucide-vue-next';

const props = defineProps({
  cocktails: Array,
  profiles: Array,
  onAdd: Function,
  onClose: Function
});

const selectedCocktail = ref('');
const selectedProfile = ref('');
const quantity = ref(1);

function handleAdd() {
  if (selectedCocktail.value && selectedProfile.value) {
    const cocktail = props.cocktails.find(c => c.id === selectedCocktail.value);
    props.onAdd(cocktail, selectedProfile.value, quantity.value);
    selectedCocktail.value = '';
    quantity.value = 1;
  }
}
function decrementQuantity() {
  quantity.value = Math.max(1, quantity.value - 1);
}
function incrementQuantity() {
  quantity.value = quantity.value + 1;
}
</script>
<style scoped>
/* À compléter si besoin */
</style>