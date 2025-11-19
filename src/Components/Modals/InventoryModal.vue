<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Package class="text-blue-600" :size="24" />
          Inventaire du bar
        </h2>
        <button @click="onClose" class="p-1 hover:bg-gray-100 rounded">
          <X :size="20" />
        </button>
      </div>
      <div class="mb-4 flex gap-2">
        <button
          @click="selectAll"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          Tout sélectionner
        </button>
        <button
          @click="onClear"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Tout vider
        </button>
        <div class="flex-1 text-right text-sm text-gray-600 flex items-center justify-end">
          {{ barInventory.size }} / {{ allIngredients.length }} ingrédients
        </div>
      </div>
      <div class="overflow-y-auto flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            v-for="ingredient in allIngredients"
            :key="ingredient"
            @click="() => onToggle(ingredient)"
            :class="[
              'p-3 rounded-lg text-left transition-colors',
              barInventory.has(ingredient)
                ? 'bg-green-50 border-2 border-green-500 text-green-900'
                : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ ingredient }}</span>
              <span v-if="barInventory.has(ingredient)" class="text-green-600">✓</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { Package, X } from 'lucide-vue-next';

const props = defineProps({
  allIngredients: Array,
  barInventory: Object,
  onToggle: Function,
  onClear: Function,
  onClose: Function
});

function selectAll() {
  props.allIngredients.forEach(ing => {
    if (!props.barInventory.has(ing)) props.onToggle(ing);
  });
}
</script>
<style scoped>
/* À compléter si besoin */
</style>