<template>
  <div :class="['bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all h-full flex flex-col', !available ? 'opacity-60' : '', isHidden ? 'ring-2 ring-red-300' : '']">
    <div v-if="cocktail.Image && isExpanded" class="h-32 sm:h-40 md:h-48 overflow-hidden bg-gray-200 flex-shrink-0">
      <img
        :src="cocktail.Image"
        :alt="cocktail.Name"
        class="w-full h-full object-cover"
        @error="hideImage"
      />
    </div>
    <div class="p-3 md:p-4 flex-1 flex flex-col">
      <div class="flex justify-between items-start mb-2 md:mb-3">
        <div class="flex-1">
          <h3 :class="['text-base md:text-lg font-bold', available ? 'text-gray-800' : 'text-gray-400']">{{ cocktail.Name }}</h3>
          <p v-if="!available" class="text-xs text-red-600 mt-0.5">
            Manque {{ missingIngs.length }} ingrédient{{ missingIngs.length > 1 ? 's' : '' }}
          </p>
          <p v-if="isHidden" class="text-xs text-red-600 mt-0.5">Masqué en mode Drinker</p>
        </div>
        <button
          v-if="currentProfile && appMode === 'drinker'"
          @click="() => onToggleFavorite(cocktail.id)"
          :class="['p-1.5 md:p-2 rounded-full transition-colors flex-shrink-0', isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50']"
        >
          <Star :size="18" :fill="isFavorite ? 'currentColor' : 'none'" />
        </button>
      </div>
      <div class="flex items-center gap-1.5 mb-2 md:mb-3 flex-wrap">
        <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs md:text-sm rounded-full">{{ cocktail.spiritType }}</span>
        <span class="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs md:text-sm rounded-full">{{ cocktail.family.replace('_', ' ') }}</span>
        <span v-if="cocktail.Season" class="px-2 py-0.5 bg-pink-100 text-pink-800 text-xs md:text-sm rounded-full">{{ cocktail.Season }}</span>
        <span v-if="available" class="px-2 py-0.5 bg-green-100 text-green-800 text-xs md:text-sm rounded-full">✓</span>
      </div>
      <div v-if="currentProfile && appMode === 'drinker'" class="flex items-center gap-0.5 mb-2 md:mb-3">
        <button
          v-for="star in 5"
          :key="star"
          @click="() => onSetRating(cocktail.id, star)"
          :class="[star <= rating ? 'text-yellow-400' : 'text-gray-300', 'hover:text-yellow-400 transition-colors']"
        >
          <Star :size="16" :fill="star <= rating ? 'currentColor' : 'none'" />
        </button>
      </div>
      <button
        v-if="appMode === 'bartender'"
        @click="() => onToggleHidden(cocktail.id)"
        :class="['w-full mb-2 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm', isHidden ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
      >
        {{ isHidden ? 'Afficher' : 'Masquer' }}
      </button>
      <button
        @click="toggleExpanded"
        class="w-full flex items-center justify-between text-blue-600 hover:text-blue-800 font-medium mb-2 md:mb-3 text-sm"
      >
        <span>{{ isExpanded ? '- Recette' : '+ Recette' }}</span>
        <component :is="isExpanded ? 'ChevronUp' : 'ChevronDown'" :size="18" />
      </button>
      <div v-if="isExpanded" class="border-t pt-2 md:pt-3 mt-2 md:mt-3 space-y-2 md:space-y-3">
        <div class="space-y-1">
          <h4 class="font-semibold text-gray-700 text-sm">Ingrédients:</h4>
          <div v-for="(ing, idx) in cocktail.Recipe" :key="idx" :class="['flex justify-between text-xs md:text-sm gap-2', (ing.Type !== 'garnish' && !barInventory.has(ing.Ingredient)) ? 'text-gray-400 line-through' : 'text-gray-700']">
            <span>{{ ing.Ingredient }}</span>
            <span class="text-gray-500">
              <span v-if="ing.Oz">{{ ing.Oz }} oz</span>
              <span v-if="ing.Ml"> ({{ ing.Ml }} ml)</span>
            </span>
          </div>
        </div>
        <button
          v-if="appMode === 'drinker' && currentProfile && available"
          @click="() => onOrder(cocktail)"
          class="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
        >
          Commander ce cocktail
        </button>
        <div v-if="currentProfile && appMode === 'drinker'" class="space-y-2">
          <h4 class="font-semibold text-gray-700 text-sm">Notes personnelles:</h4>
          <textarea
            :value="note"
            @input="e => onSaveNote(cocktail.id, e.target.value)"
            placeholder="Ajoute tes notes..."
            class="w-full p-2 border rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { Star, ChevronDown, ChevronUp } from 'lucide-vue-next';

const props = defineProps({
  cocktail: Object,
  appMode: String,
  currentProfile: [String, Number],
  barInventory: Object,
  favorites: Object,
  userRatings: Object,
  userNotes: Object,
  isHidden: Boolean,
  onToggleFavorite: Function,
  onSetRating: Function,
  onSaveNote: Function,
  onOrder: Function,
  onToggleHidden: Function
});

const isExpanded = ref(false);
const isFavorite = computed(() => props.favorites.has(props.cocktail.id));
const rating = computed(() => props.userRatings[props.cocktail.id] || 0);
const note = computed(() => props.userNotes[props.cocktail.id] || '');
const available = computed(() => Array.isArray(props.cocktail.Recipe) && props.cocktail.Recipe.every(ing => ing.Type === 'garnish' || ((props.barInventory || new Set()).has(ing.Ingredient))));
const missingIngs = computed(() => Array.isArray(props.cocktail.Recipe) ? props.cocktail.Recipe.filter(ing => ing.Type !== 'garnish' && !(props.barInventory || new Set()).has(ing.Ingredient)) : []);

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}
function hideImage(e) {
  e.target.style.display = 'none';
}
</script>
<style scoped>
/* À compléter si besoin */
</style>