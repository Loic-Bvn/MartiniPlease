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
.cocktail-card-compact {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.cocktail-card-compact:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.cocktail-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
}

.cocktail-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  font-style: italic;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.875rem;
}

.badge-available {
  background: #10b981;
  color: white;
}

.badge-missing {
  background: #f59e0b;
  color: white;
}

.recipe-compact {
  display: flex;
  flex-direction: column;
  gap: 0.2  rem;
}

.recipe-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.ingredient-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  flex-shrink: 0;
}

.status-available {
  background: #10b981;
}

.status-missing {
  background: #ef4444;
}

.ingredient-name {
  flex: 1;
}

.ingredient-quantity {
  color: #9ca3af;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-order {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-order:hover {
  background: #059669;
}

.btn-toggle {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-show {
  background: #f3f4f6;
  color: #374151;
}

.btn-show:hover {
  background: #e5e7eb;
}

.btn-hidden {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-hidden:hover {
  background: #fecaca;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-order-compact {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-order-compact:hover {
  background: #059669;
}
</style>