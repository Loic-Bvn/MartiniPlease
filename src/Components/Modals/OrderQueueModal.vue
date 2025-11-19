<script setup>
import { ChefHat, X, User, Clock, Check } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps({
  orderQueue: Array,
  onComplete: Function,
  onClose: Function,
  profiles: Array
});

// Grouper par cocktail + profil pour afficher les quantités
const groupedOrders = computed(() => {
  const groups = {};
  props.orderQueue.forEach(order => {
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
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ChefHat class="text-orange-600" :size="24" />
          File d'attente ({{ orderQueue.length }})
        </h2>
        <button @click="onClose" class="p-1 hover:bg-gray-100 rounded">
          <X :size="20" />
        </button>
      </div>
      <div class="overflow-y-auto flex-1 space-y-3">
        <div v-if="orderQueue.length === 0" class="text-center py-12 text-gray-500">
          <p>Aucune commande en attente</p>
        </div>
        <div v-else>
          <div
            v-for="group in groupedOrders"
            :key="`${group.cocktailId}-${group.profileId}`"
            class="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-lg text-gray-800">{{ group.cocktailName }}</h3>
                <span
                  v-if="group.orders.length > 1"
                  class="px-2 py-0.5 bg-orange-600 text-white text-sm font-semibold rounded"
                >
                  x{{ group.orders.length }}
                </span>
              </div>
              <p class="text-sm text-gray-600 flex items-center gap-2">
                <User :size="14" />
                {{ getProfileName(group.profileId) }}
              </p>
              <p class="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock :size="12" />
                {{ formatTime(group.timestamp) }}
              </p>
            </div>
            <button
              @click="() => handleComplete(group)"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Check :size="18" />
              Servir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>