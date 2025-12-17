<script setup>
import { ChefHat, X, User, Clock, Check } from 'lucide-vue-next';
import { computed } from 'vue';

import CocktailCard from '@/Components/CocktailCard.vue';

const props = defineProps({
  orders: Array,
  onComplete: Function,
  onClose: Function,
  profiles: Array
});

// Grouper par cocktail + profil pour afficher les quantités
const groupedOrders = computed(() => {
  const groups = {};
  props.orders.forEach(order => {
    const key = `${order.cocktailId}-${order.profileId}`;
    if (!groups[key]) {
      groups[key] = {
        ...order,
        orders: []
      };
    }
    groups[key].orders.push(order);
  });
  return Object.values(groups);
});

function getProfileName(profileId) {
  const profile = props.profiles.find(p => p.id === profileId);
  return profile?.name || 'Inconnu';
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleComplete(group) {
  // Compléter toutes les commandes du groupe
  group.orders.forEach(order => {
    props.onComplete(order);
  });
}

const ingredientTypes = (cocktail) => {
  if (!cocktail?.Recipe) return ''

  return cocktail.Recipe
    .map(i => i.Type)
    .filter(Boolean)
    .join(' · ')
}

</script>

<template>
  <div class="orderQueue-manager">
    <div class="orderQueue-header">
      <div class="overflow-y-auto flex-1 space-y-3">
        <div v-if="orders.length === 0" class="text-center py-12 text-gray-500">
          <p>Aucune commande en attente</p>
        </div>
        <div v-else>
          <div
            v-for="group in groupedOrders"
            :key="`${group.cocktailId}-${group.profileId}`"
            class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 flex items-center justify-between"
          >

            <div class="flex-1">
              <!-- Ligne titre / meta -->
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-bold text-lg text-gray-800">
                  {{ group.cocktailName }}
                </h3>

                <span class="text-sm text-gray-600 flex items-center gap-1">
                  <User :size="14" />
                  {{ getProfileName(group.profileId) }}
                </span>

                <span class="text-xs text-gray-600 flex items-center gap-1">
                  <Clock :size="12" />
                  {{ formatTime(group.timestamp) }}
                </span>

                <span
                  v-if="group.orders.length > 1"
                  class="px-2 py-0.5 bg-orange-600 text-white text-sm font-semibold rounded"
                >
                  x{{ group.orders.length }}
                </span>

                <button
                  @click="() => handleComplete(group)"
                  class="btn-servir flex items-center gap-1 ml-auto"
                >
                  <Check :size="18" />
                  Servir
                </button>
              </div>

              <!-- Recette -->
              <ul class="mt-1 space-y-1 text-sm text-gray-700">
                <li
                  v-for="(ingredient, index) in group.cocktail?.Recipe"
                  :key="index"
                  class="flex items-center"
                >
                  <!-- Bullet -->
                  <span class="mr-2 text-gray-400">•</span>

                  <!-- Type -->
                  <span class="flex-1">
                    {{ ingredient.Type }} - {{ ingredient.Oz }} oz
                  </span>

                </li>
              </ul>
            </div>



          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orderQueue-manager {
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
}

.orderQueue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.orderQueue-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.btn-servir {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
</style>