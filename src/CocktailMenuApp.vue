<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="header">
      <div class="header-container">
        <div class="header-top">
          <div class="header-brand">
            <Wine class="header-icon" :size="28" />
            <div>
              <h1 class="header-title">Mon Home Bar</h1>
              <p class="header-subtitle">
                <span :class="['mode-badge', appMode === 'bartender' ? 'text-orange-600' : 'text-purple-600']">
                  {{ appMode === 'bartender' ? '🧊 Bartender' : '🍹 Drinker' }}
                </span>
                <template v-if="currentProfileData"> • {{ currentProfileData.name }}</template>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Bouton switch mode -->
            <button
              @click="toggleMode"
              :class="['btn-mode', appMode === 'bartender' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700']"
            >
              {{ appMode === 'bartender' ? 'Mode Drinker' : 'Mode Bartender' }}
            </button>
            
            <!-- Bouton déconnexion -->
            <button
              v-if="currentProfileData"
              @click="logoutProfile"
              class="btn-logout"
            >
              Déco
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="search-container">
          <Search class="search-icon" :size="18" />
          <input
            type="text"
            placeholder="Rechercher un cocktail ou un ingrédient..."
            v-model="searchTerm"
            class="search-input"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">

      <!-- Profile Section -->
      <div class="section-card">
        <!-- <div class="section-header">
          <User class="section-icon" :size="20" />
          <h2 class="section-title">Profil</h2>
        </div>

        <div v-if="!currentProfile" class="profile-empty">
          <p class="profile-empty-text">Aucun profil sélectionné</p>
          <button @click="showProfileModal = true" class="btn-primary">
            Sélectionner un profil
          </button>
        </div>

        <div v-else class="profile-selected">
          <span class="profile-name">{{ currentProfileData.name }}</span>
          <button @click="showProfileModal = true" class="btn-text">
            Changer
          </button>
        </div> -->
         
        <!-- Bouton pour ouvrir la popup si aucun profil sélectionné -->
        <div v-if="!currentProfile" class="profile-empty">
          <p class="profile-empty-text">Aucun profil sélectionné</p>
          <button @click="showProfileModal = true" class="btn-primary">
            Sélectionner un profil
          </button>
        </div>

        <!-- Ou un bouton dans ton interface pour ouvrir la modale -->
        <button @click="showProfileModal = true" class="btn-secondary">
          Gérer les profils
        </button>

        <!-- ProfileModal -->
        <ProfileModal
          v-if="showProfileModal"
          :profiles="profiles"
          :currentProfile="currentProfile"
          :onClose="closeProfileModal"
          :onCreate="createProfile"
          :onSelect="selectProfile"
          :onDelete="deleteProfile"
        />
      </div>

      <!-- Filters -->
      <div class="section-card">
        <div class="section-header">
          <Filter class="section-icon" :size="20" />
          <h2 class="section-title">Filtres</h2>
        </div>

        <div class="filters-content">
          <!-- Disponibles uniquement -->
          <label class="filter-checkbox">
            <input
              type="checkbox"
              v-model="showAvailableOnly"
            />
            <span>Disponibles uniquement</span>
          </label>

          <!-- Famille d'alcool -->
          <div>
            <label class="filter-label">Famille d'alcool</label>
            <select v-model="selectedSpirit" class="filter-select">
              <option value="all">Tous</option>
              <option value="whiskey">Whiskey</option>
              <option value="rum">Rhum</option>
              <option value="gin">Gin</option>
              <option value="vodka">Vodka</option>
              <option value="tequila">Tequila</option>
              <option value="brandy">Brandy</option>
            </select>
          </div>

          <!-- Saison -->
          <div>
            <label class="filter-label">Saison</label>
            <select v-model="selectedSeason" class="filter-select">
              <option value="all">Toutes saisons</option>
              <option value="spring">Printemps</option>
              <option value="summer">Été</option>
              <option value="fall">Automne</option>
              <option value="winter">Hiver</option>
            </select>
          </div>

          <button @click="resetFilters" class="btn-reset">
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div class="section-card">
        <h2 class="section-title">Statistiques</h2>
        <div class="stats-list">
          <div class="stat-item">
            <span class="stat-label">Total cocktails:</span>
            <span class="stat-value">{{ cocktails.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Disponibles:</span>
            <span class="stat-value available">{{ availableCocktailsCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Affichés:</span>
            <span class="stat-value">{{ filteredCocktails.length }}</span>
          </div>
        </div>
      </div>

      <!-- Cocktails List -->
      <div>
        <h2 class="cocktails-header">{{ filteredCocktails.length }} cocktails trouvés</h2>

        <div v-if="filteredCocktails.length === 0" class="text-center py-8 text-gray-500">
          Aucun cocktail trouvé avec ces critères
        </div>

        <div v-for="cocktail in filteredCocktails" :key="cocktail.id" class="cocktail-card">
          <button
            @click="toggleCocktail(cocktail.id)"
            class="cocktail-header"
          >
            <div class="cocktail-header-content">
              <div class="cocktail-info">
                <h3 class="cocktail-name">{{ cocktail.Name }}</h3>
                <p class="cocktail-missing">
                  {{ getMissingIngredientsText(cocktail) }}
                </p>
                <div class="cocktail-tags">
                  <span class="tag tag-spirit">{{ cocktail.spiritType }}</span>
                  <span class="tag tag-family">{{ cocktail.family }}</span>
                  <span v-if="cocktail.Season && cocktail.Season !== 'all'" class="tag tag-family">
                    {{ cocktail.Season }}
                  </span>
                </div>
              </div>
              <ChevronDown
                :class="['chevron-icon', { expanded: expandedCocktail === cocktail.id }]"
                :size="20"
              />
            </div>
          </button>

          <!-- Details -->
          <div v-if="expandedCocktail === cocktail.id" class="cocktail-details">
            <h4 class="cocktail-details-title">Recette</h4>
            <div class="recipe-list">
              <div
                v-for="(ingredient, idx) in cocktail.Recipe"
                :key="idx"
                class="recipe-item"
              >
                <span class="recipe-dot"></span>
                <span>{{ ingredient.Ingredient }}</span>
                <span v-if="ingredient.Type=== 'bitter'" class="text-gray-400">
                  - {{ ingredient.Oz }}
                </span>
                <span v-if="ingredient.Ml!==null" class="text-gray-400">
                  - {{ ingredient.Oz }}oz
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex gap-2">
              <button
                v-if="appMode === 'drinker' && currentProfile"
                @click="orderCocktail(cocktail)"
                class="btn-primary"
              >
                Commander
              </button>
              <button
                v-if="appMode === 'bartender'"
                @click="toggleHidden(cocktail.id)"
                class="btn-secondary"
              >
                {{ hiddenCocktails.has(cocktail.id) ? 'Afficher' : 'Masquer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- <ProfileModal
      v-if="showProfileModal"
      :profiles="profiles"
      :current-profile="currentProfile"
      @create="createProfile"
      @select="selectProfile"
      @delete="deleteProfile"
      @close="showProfileModal = false"
    /> -->

    <InventoryModal
      v-if="showInventoryModal"
      :inventory="barInventory"
      :all-ingredients="allIngredients"
      @toggle="toggleIngredient"
      @clear="clearInventory"
      @close="showInventoryModal = false"
    />

    <OrderQueueModal
      v-if="showOrderQueueModal"
      :orders="orderQueue"
      :profiles="profiles"
      @complete="completeOrder"
      @close="showOrderQueueModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Wine, Search, User, Filter, ChevronDown } from 'lucide-vue-next';
import { Storage } from '@/Utils/storage';
import { sampleData } from '@/Utils/sampleData';

import ProfileModal from '@/Components/Modals/ProfileModal.vue';
import InventoryModal from '@/Components/Modals/InventoryModal.vue';
import OrderQueueModal from '@/Components/Modals/OrderQueueModal.vue';

// States
const appMode = ref('drinker'); // 'bartender' ou 'drinker'
const currentProfile = ref(null);
const profiles = ref([]);
const cocktails = ref([]);
const searchTerm = ref('');
const selectedSpirit = ref('all');
const selectedSeason = ref('all');
const showAvailableOnly = ref(false);
const hiddenCocktails = ref(new Set());
const barInventory = ref(new Set());
const allIngredients = ref([]);
const favorites = ref(new Set());
const userRatings = ref({});
const userNotes = ref({});
const orderHistory = ref([]);
const orderQueue = ref([]);
// const showProfileModal = ref(false);
const showInventoryModal = ref(false);
const showOrderQueueModal = ref(false);
const expandedCocktail = ref(null);

// Computed
const currentProfileData = computed(() => 
  profiles.value.find(p => p.id === currentProfile.value)
);


// Variable pour contrôler l'affichage de la modale
const showProfileModal = ref(false);

// Fonction pour fermer la modale
function closeProfileModal() {
  showProfileModal.value = false;
}

// Tes fonctions existantes (légèrement modifiées)
function createProfile(name) {
  if (!name.trim()) return;
  const id = Date.now().toString();
  const newProfile = { 
    id, 
    name: name.trim(), 
    type: 'drinker',
    createdAt: new Date().toISOString()
  };
  profiles.value.push(newProfile);
  currentProfile.value = id;
  appMode.value = 'drinker';
  showProfileModal.value = false; // Ferme la modale après création
  
  // Sauvegarde le nouveau profil
  saveProfiles();
}

function deleteProfile(id) {
  // La confirmation est maintenant gérée dans le ProfileModal
  // Mais tu peux la laisser ici aussi pour double sécurité
  profiles.value = profiles.value.filter(p => p.id !== id);
  
  localStorage.removeItem(`profile_${id}_favorites`);
  localStorage.removeItem(`profile_${id}_ratings`);
  localStorage.removeItem(`profile_${id}_notes`);
  localStorage.removeItem(`profile_${id}_history`);
  
  if (currentProfile.value === id) {
    currentProfile.value = null;
    appMode.value = 'bartender';
  }
  
  // Sauvegarde la liste mise à jour
  saveProfiles();
}

function selectProfile(id) {
  currentProfile.value = id;
  appMode.value = 'drinker';
  showProfileModal.value = false; // Ferme la modale après sélection
  
  favorites.value = Storage.getProfileData(id, 'favorites');
  userRatings.value = Storage.getProfileData(id, 'ratings');
  userNotes.value = Storage.getProfileData(id, 'notes');
  orderHistory.value = Storage.getProfileData(id, 'history');
}

// Fonction utilitaire pour sauvegarder les profils
function saveProfiles() {
  localStorage.setItem('profiles', JSON.stringify(profiles.value));
}

// Charge les profils au démarrage
function loadProfiles() {
  const saved = localStorage.getItem('profiles');
  if (saved) {
    profiles.value = JSON.parse(saved);
  }
}

// Appelle loadProfiles au montage du composant
loadProfiles();


const availableCocktailsCount = computed(() => {
  return cocktails.value.filter(cocktail => {
    if (!Array.isArray(cocktail.Recipe)) return false;
    return cocktail.Recipe.every(ing => 
      ing.Type === 'garnish' || barInventory.value.has(ing.Ingredient)
    );
  }).length;
});

const filteredCocktails = computed(() => {
  const term = searchTerm.value.toLowerCase();
  return cocktails.value.filter(cocktail => {
    // Recherche
    const matchesSearch = cocktail.Name.toLowerCase().includes(term) ||
      (Array.isArray(cocktail.Recipe) && cocktail.Recipe.some(ing => 
        ing.Ingredient.toLowerCase().includes(term)
      ));
    
    if (!matchesSearch) return false;
    
    // Mode drinker : masquer les cocktails cachés
    if (appMode.value === 'drinker' && hiddenCocktails.value.has(cocktail.id)) {
      return false;
    }
    
    // Filtre famille
    if (selectedSpirit.value !== 'all' && cocktail.family !== selectedSpirit.value) {
      return false;
    }
    
    // Filtre saison
    if (selectedSeason.value !== 'all' && cocktail.Season !== selectedSeason.value && cocktail.Season !== 'all') {
      return false;
    }
    
    // Disponibles uniquement
    if (showAvailableOnly.value) {
      const available = Array.isArray(cocktail.Recipe) && cocktail.Recipe.every(ing => 
        ing.Type === 'garnish' || barInventory.value.has(ing.Ingredient)
      );
      if (!available) return false;
    }
    
    return true;
  });
});

// Watch pour sauvegarder
watch(barInventory, (newVal) => {
  Storage.saveBarInventory(newVal);
}, { deep: true });

watch(hiddenCocktails, (newVal) => {
  Storage.saveHiddenCocktails(newVal);
}, { deep: true });

watch(orderQueue, (newVal) => {
  Storage.saveOrderQueue(newVal);
}, { deep: true });

watch(profiles, (newVal) => {
  Storage.saveProfiles(newVal);
}, { deep: true });

watch([favorites, userRatings, userNotes, orderHistory], () => {
  if (currentProfile.value) {
    Storage.saveProfileData(currentProfile.value, 'favorites', favorites.value);
    Storage.saveProfileData(currentProfile.value, 'ratings', userRatings.value);
    Storage.saveProfileData(currentProfile.value, 'notes', userNotes.value);
    Storage.saveProfileData(currentProfile.value, 'history', orderHistory.value);
  }
}, { deep: true });

watch(currentProfile, (newProfileId) => {
  if (newProfileId) {
    favorites.value = Storage.getProfileData(newProfileId, 'favorites');
    userRatings.value = Storage.getProfileData(newProfileId, 'ratings');
    userNotes.value = Storage.getProfileData(newProfileId, 'notes');
    orderHistory.value = Storage.getProfileData(newProfileId, 'history');
  } else {
    favorites.value = new Set();
    userRatings.value = {};
    userNotes.value = {};
    orderHistory.value = [];
  }
});

// Initialisation
onMounted(() => {
  profiles.value = Storage.getProfiles();
  barInventory.value = Storage.getBarInventory();
  hiddenCocktails.value = Storage.getHiddenCocktails();
  selectedSeason.value = Storage.getSeasonFilter();
  orderQueue.value = Storage.getOrderQueue();

  const savedData = Storage.getCocktailData();
  if (savedData) {
    loadCocktails(savedData);
  } else {
    loadCocktails(sampleData);
  }
});

function loadCocktails(data) {
  const allCocktails = [];
  Object.entries(data).forEach(([family, spirits]) => {
    Object.entries(spirits).forEach(([spiritType, cocktailList]) => {
      cocktailList.forEach(cocktail => {
        allCocktails.push({
          ...cocktail,
          family,
          spiritType,
          id: `${family}-${spiritType}-${cocktail.Name}`,
          Season: cocktail.Season || 'all'
        });
      });
    });
  });
  cocktails.value = allCocktails;

  const ingredientsSet = new Set();
  allCocktails.forEach(cocktail => {
    if (Array.isArray(cocktail.Recipe)) {
      cocktail.Recipe.forEach(ing => {
        if (ing.Type !== 'garnish') {
          ingredientsSet.add(ing.Ingredient);
        }
      });
    }
  });
  allIngredients.value = Array.from(ingredientsSet).sort();
}

function getMissingIngredientsText(cocktail) {
  if (!Array.isArray(cocktail.Recipe)) return 'Recette non disponible';
  
  const missing = cocktail.Recipe.filter(ing => 
    ing.Type !== 'garnish' && !barInventory.value.has(ing.Ingredient)
  ).length;

  if (missing === 0) return '✓ Tous les ingrédients disponibles';
  return `Manque ${missing} ingrédient${missing > 1 ? 's' : ''}`;
}

function toggleCocktail(id) {
  expandedCocktail.value = expandedCocktail.value === id ? null : id;
}

function toggleMode() {
  const newMode = appMode.value === 'bartender' ? 'drinker' : 'bartender';
  
  if (newMode === 'drinker' && !currentProfile.value) {
    showProfileModal.value = true;
    return;
  }
  
  appMode.value = newMode;
}

function resetFilters() {
  selectedSpirit.value = 'all';
  selectedSeason.value = 'all';
  showAvailableOnly.value = false;
}

function toggleIngredient(ingredient) {
  const newInventory = new Set(barInventory.value);
  if (newInventory.has(ingredient)) {
    newInventory.delete(ingredient);
  } else {
    newInventory.add(ingredient);
  }
  barInventory.value = newInventory;
}

function clearInventory() {
  if (!confirm('Vider tout l\'inventaire du bar ?')) return;
  barInventory.value = new Set();
}

function orderCocktail(cocktail) {
  if (!currentProfile.value) return;
  
  const order = {
    id: Date.now().toString(),
    cocktailId: cocktail.id,
    cocktailName: cocktail.Name,
    cocktail: cocktail,
    profileId: currentProfile.value,
    timestamp: new Date().toISOString()
  };
  
  orderQueue.value.push(order);
  
  orderHistory.value.unshift({
    cocktailId: cocktail.id,
    cocktailName: cocktail.Name,
    timestamp: order.timestamp
  });
  
  alert(`${cocktail.Name} ajouté à la file d'attente !`);
}

function toggleHidden(id) {
  const newHidden = new Set(hiddenCocktails.value);
  if (newHidden.has(id)) {
    newHidden.delete(id);
  } else {
    newHidden.add(id);
  }
  hiddenCocktails.value = newHidden;
}

function completeOrder(order) {
  orderQueue.value = orderQueue.value.filter(o => o.id !== order.id);
}

function logoutProfile() {
  currentProfile.value = null;
  appMode.value = 'bartender';
  showProfileModal.value = true;
}
</script>

<style scoped>
.btn-mode {
  padding: 0.5rem 1rem;
  color: rgb(255, 247, 231);
  background-color: #ffa01c;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout {
  padding: 0.5rem 0.75rem;
  background-color: #f4938f;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background-color: #e5e7eb;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.profile-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.profile-empty-text {
  color: #6b7280;
  font-size: 0.875rem;
}

/* .btn-primary {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
} */

/* .btn-secondary {
  padding: 0.5rem 1rem;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #d1d5db;
} */
</style>