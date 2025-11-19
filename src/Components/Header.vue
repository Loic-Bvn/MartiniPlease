<template>
  <div class="bg-white shadow-md sticky top-0 z-10">
    <div class="w-full px-3 md:px-4 py-3 md:py-4">
      <div class="flex items-center justify-between mb-3 md:mb-4">
        <div class="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <Wine class="text-blue-600 flex-shrink-0" :size="28" />
          <div class="min-w-0">
            <h1 class="text-lg md:text-2xl font-bold text-gray-800 truncate">Mon Home Bar</h1>
            <p class="text-xs md:text-sm text-gray-500 truncate">
              <span :class="['font-semibold', appMode === 'bartender' ? 'text-orange-600' : 'text-purple-600']">
                {{ appMode === 'bartender' ? '🍸 Bartender' : '🍹 Drinker' }}
              </span>
              <template v-if="currentProfileData"> • {{ currentProfileData.name }}</template>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <!-- Bouton mode (visible md+) -->
          <button
            @click="toggleMode"
            :class="['hidden sm:flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-white text-sm md:text-base rounded-lg transition-colors', appMode === 'bartender' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700']"
          >
            <component :is="appMode === 'bartender' ? 'Unlock' : 'Lock'" :size="16" />
            <span class="hidden md:inline">Mode {{ appMode === 'bartender' ? 'Drinker' : 'Bartender' }}</span>
            <span class="md:hidden">{{ appMode === 'bartender' ? '🍹' : '🍸' }}</span>
          </button>
          <!-- File d'attente (mode Bartender) -->
          <button
            v-if="appMode === 'bartender' && orderQueue && orderQueue.length > 0"
            @click="setShowOrderQueueModal(true)"
            class="relative px-2 md:px-4 py-1 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 md:gap-2 text-sm md:text-base"
          >
            <ChefHat :size="16" />
            <span class="hidden md:inline">File</span>
            <span class="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {{ orderQueue.length }}
            </span>
          </button>
          
          <!-- Déconnexion -->
          <button
            v-if="currentProfileData"
            @click="logoutProfile"
            class="px-2 md:px-3 py-1 md:py-1 text-xs md:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex-shrink-0"
          >
            <span class="hidden sm:inline">Déco</span>
            <span class="sm:hidden">✕</span>
          </button>
        </div>
      </div>
      <!-- Barre de recherche -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" :size="18" />
        <input
          type="text"
          placeholder="Cocktails ou ingrédients..."
          :value="searchTerm"
          @input="e => setSearchTerm(e.target.value)"
          class="w-full pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { Wine, Search, ChefHat, Unlock, Lock } from 'lucide-vue-next';

const props = defineProps({
  appMode: String,
  setAppMode: Function,
  currentProfile: [String, Number],
  profiles: Array,
  orderQueue: Array,
  setShowProfileModal: Function,
  setShowOrderQueueModal: Function,
  searchTerm: String,
  setSearchTerm: Function
});

const currentProfileData = computed(() =>
  props.profiles && props.profiles.find(p => p.id === props.currentProfile)
);

function toggleMode() {
  // On ne peut passer en mode drinker que si un profil drinker est sélectionné
  const profile = currentProfileData.value;
  if (props.appMode === 'bartender' && profile && profile.type === 'drinker') {
    props.setAppMode('drinker');
  } else if (props.appMode === 'drinker') {
    props.setAppMode('bartender');
  }
}

const emits = defineEmits(['logout']);

function logoutProfile() {
  props.setShowProfileModal(true);
  props.setAppMode('bartender');
  emits('logout');
}
</script>
<style scoped>
/* Styles conservés depuis le JSX, à compléter si besoin */
</style>