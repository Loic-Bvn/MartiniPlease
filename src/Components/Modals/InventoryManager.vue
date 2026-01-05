<template>
  <div class="inventory-manager">
    <div class="inventory-header">
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

const { barInventory, toggleIngredient: toggleInventoryItem, clearInventory } = useInventory();

// Plus besoin de emit
// const emit = defineEmits(['toggle']);

const searchQuery = ref('');

// Organiser les ingrédients par catégorie
const categoryMetadata = {
  spirits: { label: 'Spiritueux', icon: '🥃' },
  liqueurs: { label: 'Liqueurs', icon: '🍷' },
  modifiers: { label: 'Modificateurs', icon: '🍸' },
  juices: { label: 'Jus', icon: '🍊' },
  syrups: { label: 'Sirops', icon: '🍯' },
  bitters: { label: 'Bitters', icon: '💧' },
  mixers: { label: 'Mixers', icon: '🥤' },
  others: { label: 'Autres', icon: '📦' }
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

// Utiliser directement toggleIngredient du composable
function toggleIngredient(ingredientKey) {
  console.log('Toggle ingredient:', ingredientKey); // DEBUG
  toggleInventoryItem(ingredientKey);
  console.log('Inventory after toggle:', Array.from(barInventory.value)); // DEBUG
}

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
      toggleIngredient(ing.key); // Utiliser la fonction locale qui appelle le composable
    } else if (!allSelected && !barInventory.value.has(ing.key)) {
      toggleIngredient(ing.key);
    }
  });
};

// Tout sélectionner
const selectAll = () => {
  allIngredients.value.forEach(ing => {
    if (!barInventory.value.has(ing.key)) {
      toggleIngredient(ing.key);
    }
  });
};

// Tout désélectionner
const deselectAll = () => {
  clearInventory(); // Utiliser directement la fonction du composable
};

// Supprimer le filteredIngredients qui n'est pas utilisé
// const filteredIngredients = computed(() => { ... });

// Ajouter cette computed pour le nombre de cocktails réalisables
// Tu devras l'importer de CocktailMenuApp ou le calculer ici
const availableCocktailsCount = computed(() => {
  // Cette valeur devrait venir de ton parent ou être calculée ici
  // Pour l'instant, retourne 0
  return 0;
});
</script>

<style scoped>
/* Tous les styles sont centralisés dans styles.css */
</style>