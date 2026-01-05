<template>
  <div :class="['cocktail-card-compact', !available ? 'opacity-60' : '', isHidden ? 'ring-2 ring-red-300' : '']">
    
    <!-- Header avec nom et actions -->
    <div class="card-header">
      <div class="flex-1">
        <h3 :class="['cocktail-title', available ? 'text-gray-800' : 'text-gray-400']">
          {{ cocktail.Name }}
        </h3>
        <p class="cocktail-subtitle">{{ cocktail.Profile?.join(', ') || getProfileText() }}</p>
      </div>
      
      <!-- Actions principales à droite -->
      <div class="header-actions">
        <button
          v-if="currentProfile && appMode === 'drinker'"
          @click="() => onToggleFavorite(cocktail.id)"
          :class="['btn-icon', isFavorite ? 'text-yellow-500' : 'text-gray-400']"
          title="Ajouter aux favoris"
        >
          <Star :size="20" :fill="isFavorite ? 'currentColor' : 'none'" />
        </button>
        

        <!--TODO: condition a completer  && available -->
        <button
          v-if="appMode === 'drinker' && currentProfile"
          @click="() => onOrder(cocktail)"
          class="btn-order-compact"
          title="Commander"
        >
          Commander
        </button>

        <button
          v-if="appMode === 'bartender'"
          @click="() => onToggleHidden(cocktail.id)"
          :class="['btn-toggle', isHidden ? 'btn-hidden' : 'btn-show']"
        >
          {{ isHidden ? 'Afficher' : 'Masquer' }}
        </button>
      </div>
    </div>

    <!-- Recette visible directement -->
    <div class="recipe-compact">
      <div 
        v-for="(ing, idx) in cocktail.Recipe" 
        :key="idx" 
        class="recipe-line"
      >
        <div class="ingredient-info">
          <span v-if="ing.Type !== 'garnish'" :class="[
            'status-dot',
            isIngredientAvailable(ing) ? 'status-available' : 'status-missing'
          ]"></span>
          <span :class="[
            'ingredient-name',
            ing.Type !== 'garnish' && !isIngredientAvailable(ing) ? 'text-red-600' : 'text-gray-700'
          ]">
            {{ ing.Ingredient }}
          </span>
        </div>
        <span class="ingredient-quantity">
          <span v-if="ing.Oz">{{ ing.Oz }}oz</span>
        </span>
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

const showActions = ref(false);
const isFavorite = computed(() => props.favorites.has(props.cocktail.id));

// const available = computed(() => 
//   Array.isArray(props.cocktail.Recipe) && 
//   props.cocktail.Recipe.every(ing => 
//     ing.Type === 'garnish' || 
//     (props.barInventory || new Set()).has(ing.Type)
//   )
// );


// Vérifier si un ingrédient est disponible dans l'inventaire
function isIngredientAvailable(ingredient) {
  // Les garnitures sont toujours disponibles
  if (ingredient.Type === 'garnish') return true;
  
  // Vérifier si la catégorie (Type) est dans l'inventaire
  // Ex: si "gin" est coché, tous les gins sont disponibles
  return props.barInventory.has(ingredient.Type);
}

const available = computed(() => 
  Array.isArray(props.cocktail.Recipe) && 
  props.cocktail.Recipe.every(ing => 
    ing.Type === 'garnish' || 
    (props.barInventory || new Set()).has(ing.Type)
  )
);

const missingIngs = computed(() => 
  Array.isArray(props.cocktail.Recipe) 
    ? props.cocktail.Recipe.filter(ing => 
        ing.Type !== 'garnish' && 
        !(props.barInventory || new Set()).has(ing.Ingredient)
      ) 
    : []
);

function getProfileText() {
  const profiles = props.cocktail.Profile?.filter(p => p) || [];
  return profiles.join(', ') || props.cocktail.spiritType + ' based';
}


</script>

<style scoped>
/* Tous les styles sont centralisés dans styles.css */
</style>