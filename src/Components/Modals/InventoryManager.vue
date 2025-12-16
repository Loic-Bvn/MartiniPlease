<template>
  <div class="inventory-manager">
    <div class="inventory-header">
      <h2 class="inventory-title">Gérer l'inventaire du bar</h2>
      <div class="inventory-controls">
        <button @click="selectAll" class="btn-control btn-select-all">
          <CheckSquare :size="16" />
          Tout sélectionner
        </button>
        <button @click="deselectAll" class="btn-control btn-deselect-all">
          <Square :size="16" />
          Tout désélectionner
        </button>
      </div>
    </div>

    <!-- Barre de recherche -->
    <div class="search-box">
      <Search :size="18" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher un ingrédient..."
        class="search-input"
      />
    </div>

    <!-- Statistiques -->
    <div class="inventory-stats">
      <div class="stat">
        <span class="stat-label">Sélectionnés:</span>
        <span class="stat-value">{{ selectedCount }} / {{ totalIngredientsCount }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Cocktails réalisables:</span>
        <span class="stat-value text-green-600">{{ availableCocktailsCount }}</span>
      </div>
    </div>

    <!-- Catégories -->
    <div v-if="!searchQuery" class="categories-container">
      <div 
        v-for="category in categories" 
        :key="category.key"
        class="category-section"
      >
        <div class="category-header">
          <div class="category-title-row">
            <h3 class="category-title">
              <span class="category-icon">{{ category.icon }}</span>
              {{ category.label }}
            </h3>
            <span class="category-count">
              {{ getSelectedInCategory(category.key) }} / {{ category.ingredients.length }}
            </span>
          </div>
          <button 
            @click="toggleCategory(category.key)"
            class="btn-toggle-category"
          >
            {{ isAllCategorySelected(category.key) ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
        </div>
        
        <div class="ingredients-grid">
          <label 
            v-for="ingredient in category.ingredients" 
            :key="ingredient.key"
            class="ingredient-item"
          >
            <input 
              type="checkbox"
              :checked="isSelected(ingredient.key)"
              @change="toggleIngredient(ingredient.key)"
              class="ingredient-checkbox"
            />
            <span class="ingredient-name">{{ ingredient.value }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Résultats de recherche -->
    <div v-else>
      <div v-if="searchResults.length > 0" class="ingredients-grid">
        <label 
          v-for="ingredient in searchResults" 
          :key="ingredient.key"
          class="ingredient-item"
        >
          <input 
            type="checkbox"
            :checked="isSelected(ingredient.key)"
            @change="toggleIngredient(ingredient.key)"
            class="ingredient-checkbox"
          />
          <span class="ingredient-name">{{ ingredient.value }}</span>
        </label>
      </div>
      <div v-else class="no-results">
        <p>Aucun ingrédient trouvé pour "{{ searchQuery }}"</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { CheckSquare, Square, Search } from 'lucide-vue-next';
import { ingredients } from '@/Utils/sampleData';
import { useInventory } from '@/Utils/useInventory';

const { barInventory, toggleIngredient, clearInventory} = useInventory();

// S'assurer que barInventory est toujours défini
const filteredIngredients = computed(() => {
  // Vérifier que barInventory.value existe
  if (!barInventory.value) {
    barInventory.value = new Set();
  }
  
  // Ton code de filtrage ici
  return ingredients.filter(ing => {
    // Ta logique de filtrage
    return barInventory.value.has(ing.name);
  });
});

const emit = defineEmits(['toggle']);

const searchQuery = ref('');

// Organiser les ingrédients par catégorie
// Définir les métadonnées des catégories
const categoryMetadata = {
  spirits: { label: 'Spiritueux', icon: '🥃' },
  liqueurs: { label: 'Liqueurs', icon: '🍷' },
  modifiers: { label: 'Modificateurs', icon: '🍸' },
  juices: { label: 'Jus', icon: '🍊' },
  syrups: { label: 'Sirops', icon: '🍯' },
  bitters: { label: 'Bitters', icon: '💧' },
  mixers: { label: 'Mixers', icon: '🥤' }
};

// Organiser les ingrédients par catégorie
const categories = computed(() => {
  const grouped = {};
  
  ingredients.forEach(ing => {
    if (ing.key === 'all' || !ing.category) return;
    
    if (!grouped[ing.category]) {
      grouped[ing.category] = [];
    }
    grouped[ing.category].push(ing);
  });
  
  return Object.entries(grouped).map(([key, ings]) => ({
    key,
    label: categoryMetadata[key]?.label || key,
    icon: categoryMetadata[key]?.icon || '📦',
    ingredients: ings
  }));
});

// Tous les ingrédients (sans 'all')
const allIngredients = computed(() => 
  ingredients.filter(ing => ing.key !== 'all')
);

// Total d'ingrédients
const totalIngredientsCount = computed(() => allIngredients.value.length);

// Résultats de recherche
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return [];
  
  const search = searchQuery.value.toLowerCase();
  return allIngredients.value.filter(ing => 
    ing.value.toLowerCase().includes(search) ||
    ing.key.toLowerCase().includes(search)
  );
});

// Nombre d'ingrédients sélectionnés
const selectedCount = computed(() => {
  return allIngredients.value.filter(ing => 
    barInventory.value.has(ing.key)
  ).length;
});

// Vérifier si un ingrédient est sélectionné
function isSelected(ingredientKey) {
  return barInventory.value.has(ingredientKey);
}

defineExpose({ barInventory });

// Nombre sélectionné dans une catégorie
const getSelectedInCategory = (categoryKey) => {
  const category = categories.value.find(cat => cat.key === categoryKey);
  if (!category) return 0;
  return category.ingredients.filter(ing => barInventory.value.has(ing.key)).length;
};

// Vérifier si toute la catégorie est sélectionnée
const isAllCategorySelected = (categoryKey) => {
  const category = categories.value.find(cat => cat.key === categoryKey);
  if (!category) return false;
  return category.ingredients.every(ing => barInventory.value.has(ing.key));
};

// Basculer toute une catégorie
const toggleCategory = (categoryKey) => {
  const category = categories.value.find(cat => cat.key === categoryKey);
  if (!category) return;
  
  const allSelected = isAllCategorySelected(categoryKey);
  category.ingredients.forEach(ing => {
    if (allSelected && barInventory.value.has(ing.key)) {
      emit('toggle', ing.key);
    } else if (!allSelected && !barInventory.value.has(ing.key)) {
      emit('toggle', ing.key);
    }
  });
};

// Tout sélectionner
const selectAll = () => {
  allIngredients.value.forEach(ing => {
    if (!barInventory.value.has(ing.key)) {
      emit('toggle', ing.key);
    }
  });
};

// Tout désélectionner
const deselectAll = () => {
  allIngredients.value.forEach(ing => {
    if (barInventory.value.has(ing.key)) {
      emit('toggle', ing.key);
    }
  });
};
</script>

<style scoped>
.inventory-manager {
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.inventory-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.inventory-controls {
  display: flex;
  gap: 0.75rem;
}

.btn-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-control:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-select-all:hover {
  background: #ecfdf5;
  border-color: #10b981;
  color: #10b981;
}

.btn-deselect-all:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.inventory-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.text-green-600 {
  color: #10b981;
}

.categories-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.category-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  background: #fafafa;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.category-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.category-icon {
  font-size: 1.5rem;
}

.category-count {
  font-size: 0.875rem;
  color: #6b7280;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
}

.btn-toggle-category {
  padding: 0.375rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  color: #374151;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-toggle-category:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.ingredient-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.ingredient-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ingredient-item:has(.ingredient-checkbox:checked) {
  background: #ecfdf5;
  border-color: #10b981;
}

.ingredient-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
  accent-color: #10b981;
}

.ingredient-name {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.no-results p {
  margin: 0;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .inventory-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .inventory-controls {
    width: 100%;
  }
  
  .btn-control {
    flex: 1;
    justify-content: center;
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .btn-toggle-category {
    width: 100%;
  }
  
  .ingredients-grid {
    grid-template-columns: 1fr;
  }
}
</style>