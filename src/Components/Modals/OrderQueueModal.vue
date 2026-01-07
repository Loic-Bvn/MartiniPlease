<script setup>
// Dans OrderQueueModal.vue

const props = defineProps({
  orders: Array,
  onComplete: Function,
  onClose: Function,
  profiles: Array
});

// Adapter les données Supabase
const groupedOrders = computed(() => {
  const groups = {};
  props.orders.forEach(order => {
    // Les données viennent maintenant de Supabase
    const key = `${order.cocktail_id || order.cocktailId}-${order.user_id || order.profileId}`;
    if (!groups[key]) {
      groups[key] = {
        id: order.id,
        cocktailId: order.cocktail_id || order.cocktailId,
        cocktailName: order.cocktail_name || order.cocktailName,
        cocktail: order.cocktail_data || order.cocktail,
        profileId: order.user_id || order.profileId,
        profileName: order.profile_name,
        timestamp: order.created_at,
        orders: []
      };
    }
    groups[key].orders.push(order);
  });
  return Object.values(groups);
});

function getProfileName(profileId) {
  // Utiliser d'abord profile_name de la commande
  const group = groupedOrders.value.find(g => g.profileId === profileId);
  if (group?.profileName) return group.profileName;
  
  // Fallback sur la liste des profils
  const profile = props.profiles.find(p => p.id === profileId);
  return profile?.name || 'Inconnu';
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
/* Tous les styles sont centralisés dans styles.css */
</style>