<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Modals -->
    <ProfileModal
      v-if="showProfileModal"
      :profiles="profiles"
      :currentProfile="currentProfile"
      :onClose="() => showProfileModal = false"
      :onCreate="createProfile"
      :onSelect="selectProfile"
      :onDelete="deleteProfile"
    />
    <InventoryModal
      v-if="showInventoryModal"
      :allIngredients="allIngredients"
      :barInventory="barInventory"
      :onToggle="toggleIngredient"
      :onClear="clearInventory"
      :onClose="() => showInventoryModal = false"
    />
    <OrderQueueModal
      v-if="showOrderQueueModal"
      :orderQueue="orderQueue"
      :profiles="profiles"
      :onComplete="completeOrder"
      :onClose="() => showOrderQueueModal = false"
    />
    <AddToQueueModal
      v-if="showAddToQueueModal"
      :cocktails="cocktails"
      :profiles="profiles"
      :onAdd="addToQueue"
      :onClose="() => showAddToQueueModal = false"
    />
    <UploadModal
      v-if="showUploadModal"
      :onClose="() => showUploadModal = false"
      :onUpload="handleFileUpload"
      :onUseSampleData="useSampleData"
      :uploadError="uploadError"
    />

    <!-- Header -->
        <!-- Header -->
    <Header
      :appMode="appMode"
      :setAppMode="setAppMode"
      :currentProfile="currentProfile"
      :profiles="profiles"
      :orderQueue="orderQueue"
      :setShowProfileModal="(v) => showProfileModal = v"
      :setShowOrderQueueModal="(v) => showOrderQueueModal = v"
      :searchTerm="searchTerm"
      :setSearchTerm="setSearchTerm"
      @logout="logoutProfile"
    />

    <!-- Layout principal: Sidebar + Contenu -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar (cachée sur mobile) -->
      <div class="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <!-- Profil -->
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-sm font-bold text-gray-900 mb-3">👤 Profil</h2>
          <div class="mb-3">
            <p v-if="currentProfile && currentProfileData" class="text-sm font-semibold text-gray-800">
              {{ currentProfileData.name }}
            </p>
            <p v-else class="text-sm text-gray-500">Aucun profil sélectionné</p>
          </div>
          <button
            @click="showProfileModal = true"
            class="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Sélectionner un profil
          </button>
        </div>

        <!-- Filtres -->
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-sm font-bold text-gray-900 mb-3">🔍 Filtres</h2>
          
          <!-- Disponibles uniquement -->
          <label class="flex items-center mb-3">
            <input
              type="checkbox"
              v-model="showAvailableOnly"
              class="rounded border-gray-300 mr-2"
            />
            <span class="text-sm text-gray-700">Disponibles uniquement</span>
          </label>

          <!-- Famille d'alcool -->
          <div class="mb-3">
            <label class="text-xs font-bold text-gray-600 block mb-2">Famille d'alcool</label>
            <select v-model="selectedSpirit" class="w-full border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="all">Tous</option>
              <option value="bourbon">Bourbon</option>
              <option value="rum">Rhum</option>
              <option value="gin">Gin</option>
            </select>
          </div>

          <!-- Saison -->
          <div class="mb-3">
            <label class="text-xs font-bold text-gray-600 block mb-2">Saison</label>
            <select v-model="selectedSeason" class="w-full border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="all">Toutes</option>
              <option value="spring">Printemps</option>
              <option value="summer">Été</option>
              <option value="autumn">Automne</option>
              <option value="winter">Hiver</option>
            </select>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="p-4">
          <h2 class="text-sm font-bold text-gray-900 mb-3">📊 Statistiques</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Total cocktails:</span>
              <span class="font-semibold">{{ cocktails.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Disponibles:</span>
              <span class="font-semibold text-green-600">{{ cocktails.filter(c => {
                const available = Array.isArray(c.Recipe) && c.Recipe.every(ing => 
                  ing.Type === 'garnish' || (barInventory && barInventory.has(ing.Ingredient))
                );
                return available;
              }).length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Affichés:</span>
              <span class="font-semibold">{{ filteredCocktails.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-3 md:p-4">
          <!-- Mode Bartender -->
          <div v-if="appMode === 'bartender'">
            <h2 class="text-lg md:text-2xl font-bold mb-4">Outils Bartender</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                @click="setShowInventoryModal(true)"
                class="p-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-left"
              >
                <p class="font-bold">📦 Gérer les stocks</p>
                <p class="text-sm">Articles disponibles au bar</p>
              </button>
              <button
                v-if="orderQueue.length > 0"
                @click="setShowOrderQueueModal(true)"
                class="p-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-left"
              >
                <p class="font-bold">🍹 File d'attente ({{ orderQueue.length }})</p>
                <p class="text-sm">Commandes en attente</p>
              </button>
            </div>
          </div>

          <!-- Mode Drinker -->
          <div v-else>
            <h2 class="text-lg md:text-2xl font-bold mb-4">
              {{ filteredCocktails.length }} cocktails trouvés
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <CocktailCard
                v-for="cocktail in filteredCocktails"
                :key="cocktail.id"
                :cocktail="cocktail"
                :barInventory="barInventory"
                :favorites="favorites"
                :userRatings="userRatings"
                :onToggleFavorite="toggleFavorite"
                :onSetRating="setRating"
                :onSaveNote="saveNote"
                :onOrder="orderCocktail"
                :onToggleHidden="toggleHidden"
                :userNotes="userNotes"
                :isHidden="hiddenCocktails.value && hiddenCocktails.value.has ? hiddenCocktails.value.has(cocktail.id) : false"
                :appMode="appMode"
                :currentProfile="currentProfile"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Storage } from '@/Utils/storage';
import { sampleData } from '@/Utils/sampleData';

import Header from '@/Components/Header.vue';
import CocktailCard from '@/Components/CocktailCard.vue';
import ProfileModal from '@/Components/Modals/ProfileModal.vue';
import InventoryModal from '@/Components/Modals/InventoryModal.vue';
import OrderQueueModal from '@/Components/Modals/OrderQueueModal.vue';
import AddToQueueModal from '@/Components/Modals/AddToQueueModal.vue';
import UploadModal from '@/Components/Modals/UploadModal.vue';

// States
const appMode = ref('bartender');
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
const showProfileModal = ref(false);
const showInventoryModal = ref(false);
const showOrderQueueModal = ref(false);
const showAddToQueueModal = ref(false);
const showUploadModal = ref(false);
const uploadError = ref('');
const fileInputRef = ref(null);

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
  favorites.value = new Set();
  userRatings.value = {}; // Clé : ID du cocktail, Valeur : note

  // Affichage du modal de profil si aucun profil n'est sélectionné
  if (!currentProfile.value) {
    showProfileModal.value = true;
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

  console.log('Loaded cocktails:', allCocktails);

  const ingredientsSet = new Set();
  allCocktails.forEach(cocktail => {
    cocktail.Recipe.forEach(ing => {
      if (ing.Type !== 'garnish') {
        ingredientsSet.add(ing.Ingredient);
      }
    });
  });
  allIngredients.value = Array.from(ingredientsSet).sort();
}

const filteredCocktails = computed(() => {
  const term = searchTerm.value.toLowerCase();
  return cocktails.value.filter(cocktail => {
    // Filtrer par recherche (nom ou ingrédients)
    const matchesSearch = cocktail.Name.toLowerCase().includes(term) ||
      cocktail.Recipe.some(ing => ing.Ingredient.toLowerCase().includes(term));
    
    // En mode drinker, ne pas afficher les cocktails masqués
    if (appMode.value === 'drinker' && hiddenCocktails.value && hiddenCocktails.value.has(cocktail.id)) {
      return false;
    }
    
    // Filtrer par saison
    if (selectedSeason.value !== 'all' && cocktail.Season !== selectedSeason.value) {
      return false;
    }
    
    // Afficher uniquement les disponibles (mode Bartender)
    if (appMode.value === 'bartender' && showAvailableOnly.value) {
      const available = Array.isArray(cocktail.Recipe) && cocktail.Recipe.every(ing => 
        ing.Type === 'garnish' || (barInventory.value && barInventory.value.has(ing.Ingredient))
      );
      if (!available) return false;
    }
    
    return matchesSearch;
  });
});

// ...reprendre toutes les fonctions de gestion (createProfile, deleteProfile, etc.) en adaptant à Vue (utiliser .value pour les refs)

function createProfile(name) {
  const id = Date.now().toString();
  profiles.value.push({ id, name, type: 'drinker' }); // Forcer le type drinker
  currentProfile.value = id;
  showProfileModal.value = false;
}
function deleteProfile(id) {
  profiles.value = profiles.value.filter(p => p.id !== id);
  if (currentProfile.value === id) {
    currentProfile.value = null;
    showProfileModal.value = true;
  }
}
function selectProfile(id) {
  currentProfile.value = id;
  showProfileModal.value = false;
}
function useSampleData() { loadCocktails(sampleData); showUploadModal.value = false; localStorage.removeItem('cocktail_data'); }

function toggleFavorite(id) {
  if (favorites.value.has(id)) {
    favorites.value.delete(id);
  } else {
    favorites.value.add(id);
  }
}

function setRating(id, rating) {
  userRatings.value[id] = rating;
}

function saveNote(id, note) {
  userNotes.value[id] = note;
}

function orderCocktail(cocktail) {
  orderQueue.value.push({
    cocktail,
    profile: currentProfile.value,
    date: new Date().toISOString()
  });
}

function toggleHidden(id) {
  if (hiddenCocktails.value.has(id)) {
    hiddenCocktails.value.delete(id);
  } else {
    hiddenCocktails.value.add(id);
  }
}

function toggleIngredient(ingredient) {
  if (barInventory.value.has(ingredient)) {
    barInventory.value.delete(ingredient);
  } else {
    barInventory.value.add(ingredient);
  }
}

function clearInventory() {
  barInventory.value.clear();
}

function completeOrder(index) {
  orderQueue.value.splice(index, 1);
}

function addToQueue(cocktail, profile) {
  orderQueue.value.push({ cocktail, profile, date: new Date().toISOString() });
}

function handleFileUpload(file) {
  // À implémenter selon vos besoins
  console.log('File uploaded:', file);
}

function setAppMode(mode) {
  // On ne peut passer en mode drinker que si un profil drinker est sélectionné
  if (mode === 'drinker' && currentProfile.value) {
    appMode.value = 'drinker';
  } else if (mode === 'bartender') {
    appMode.value = 'bartender';
  }
}

// Fonction de déconnexion
function logoutProfile() {
  currentProfile.value = null;
  showProfileModal.value = true;
  appMode.value = 'bartender';
}

// Initialisation de hiddenCocktails
onMounted(() => {
  // ...existing code...
  if (!hiddenCocktails.value) hiddenCocktails.value = new Set();
});

// Ajout des console.log pour vérifier les données favorites et userRatings
console.log('Favorites in CocktailMenuApp:', favorites.value);
console.log('User Ratings in CocktailMenuApp:', userRatings.value);

// ...continuer la migration des fonctions et du template

</script>