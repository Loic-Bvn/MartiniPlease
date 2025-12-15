<template>
  <div class="bg-white shadow-md sticky top-0 z-10">
    <div class="w-full px-3 md:px-4 py-3 md:py-4">
      <div class="flex items-center justify-between mb-3 md:mb-4">
        <!-- ... -->
        <div class="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button
            @click="toggleMode"
            :class="['hidden sm:flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-white text-sm md:text-base rounded-lg transition-colors', appMode === 'bartender' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700']"
          >
            <component :is="appMode === 'bartender' ? 'Unlock' : 'Lock'" :size="16" />
            <span class="hidden md:inline">Mode {{ appMode === 'bartender' ? 'Drinker' : 'Bartender' }}</span>
            <span class="md:hidden">{{ appMode === 'bartender' ? '🍹' : '🍸' }}</span>
          </button>
          
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
const emit = defineEmits(['set-mode', 'show-profile-modal', 'show-order-queue-modal', 'set-search-term', 'logout']);

const currentProfileData = computed(() =>
  props.profiles && props.profiles.find(p => p.id === props.currentProfile)
);

function toggleMode() {
  const newMode = props.appMode === 'bartender' ? 'drinker' : 'bartender';
  emit('set-mode', newMode);
}

function logoutProfile() {
  emit('show-profile-modal', true);
  emit('set-mode', 'bartender');
  emit('logout');
}

function setSearchTerm(value) {
  emit('set-search-term', value);
}

function setShowProfileModal(value) {
  emit('show-profile-modal', value);
}

function setShowOrderQueueModal(value) {
  emit('show-order-queue-modal', value);
}
</script>

<style scoped>
/* Styles conservés depuis le JSX, à compléter si besoin */
</style>