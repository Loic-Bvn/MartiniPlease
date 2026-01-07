<template>
  <div class="min-h-screen menu-app">
    <!-- Header -->
    <div class="header">
      <div class="header-container">

        <div class="header-top">
          <div class="header-brand">
            <Wine class="header-icon" :size="28" />
            <div>
              <h1 class="header-title">Martini Please</h1>
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
              v-if="!currentProfileData"              
              @click="toggleMode"
              :class="['btn-mode', appMode === 'bartender' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700']"
            >
              {{ appMode === 'bartender' ? 'Mode Drinker' : 'Mode Bartender' }}
            </button>

            <!-- Bouton connexion -->
            <button 
              v-if="!currentProfileData"
              @click="showProfileModal = true" class="btn-mode"
            >
              Sélection du profil
            </button>

            <!-- Bouton déconnexion -->
            <button
              v-if="currentProfileData"
              @click="logoutProfile"
              class="btn-logout"
            >
              Déconnexion
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

      <!-- Filtres Section Déroulante -->
      <div v-if="appMode === 'drinker'" class="section-card">
        <button
          v-if="appMode === 'drinker'"
          @click="showFiltersModal = !showFiltersModal"
          class="expand-actions-btn"
        >
          <ChevronDown 
            :size="18"
            :class="{ rotated: showFiltersModal }"
          />
          <h2 class="section-title">Filtres</h2>
          <span></span>
        </button>

        <!-- Contenu des filtres déroulant -->
        <div v-if="showFiltersModal" class="filters-dropdown-content">
          <!-- Spiritueux -->
          <div class="filter-group">
            <label class="filter-label">Spiritueux</label>
            <div class="chips-container">
              <button 
                v-for="spirit in spirit_categories" 
                :key="spirit.key"
                @click="toggleFilter(selectedSpirits, spirit.key)"
                :class="['chip', { active: selectedSpirits.includes(spirit.key) }]">
                {{ spirit.value }}
              </button>
            </div>
          </div>

          <!-- Sous-catégories (conditionnelles) -->
          <div v-if="filteredSubcategories.length > 1" class="filter-group">
            <label class="filter-label">Type</label>
            <div class="chips-container">
              <button 
                v-for="sub in filteredSubcategories" 
                :key="sub.key"
                @click="toggleFilter(selectedSubcategories, sub.key)"
                :class="['chip', { active: selectedSubcategories.includes(sub.key) }]">
                {{ sub.value }}
              </button>
            </div>
          </div>

          <!-- Saison -->
          <div class="filter-group">
            <label class="filter-label">Saison</label>
            <div class="chips-container">
              <button 
                v-for="season in seasons" 
                :key="season.key"
                @click="season.key === 'all' ? selectedSeasons = [] : toggleFilter(selectedSeasons, season.key)"
                :class="['chip', { 
                  active: season.key === 'all' 
                    ? selectedSeasons.length === 0 
                    : selectedSeasons.includes(season.key) 
                }]">
                {{ season.icon }} {{ season.value }}
              </button>
            </div>
          </div>

          <!-- Disponibilité -->
          <div class="filter-group">
            <label class="filter-label">Disponibilité</label>
            <div class="chips-container">
              <button 
                @click="showOnlyMakeable = !showOnlyMakeable"
                :class="['chip', { active: showOnlyMakeable }]">
                🍸 Cocktails réalisables
              </button>
            </div>
          </div>

          <!-- Filtres actifs -->
          <div v-if="hasActiveFilters" class="active-filters-bar">
            <span v-for="spirit in selectedSpirits" :key="spirit" class="filter-tag">
              {{ getSpiritLabel(spirit) }}
              <X @click="toggleFilter(selectedSpirits, spirit)" :size="14" />
            </span>
            <span v-for="sub in selectedSubcategories" :key="sub" class="filter-tag">
              {{ getSubcategoryLabel(sub) }}
              <X @click="toggleFilter(selectedSubcategories, sub)" :size="14" />
            </span>
            <span v-for="season in selectedSeasons" :key="season" class="filter-tag">
              {{ getSeasonLabel(season) }}
              <X @click="toggleFilter(selectedSeasons, season)" :size="14" />
            </span>
            <button @click="clearAllFilters" class="clear-all-btn">
              Effacer tout
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div v-if="appMode === 'drinker'" class="section-card">
        <button 
          @click="showStatistics = !showStatistics"
          class="expand-actions-btn"
        >
          <ChevronDown 
            :size="18"
            :class="{ rotated: showStatistics }"
          />
          <h2 class="section-title">Statistiques</h2>
          <span></span>
        </button>

        <!-- Contenu des statistiques déroulant -->
        <div v-if="showStatistics" class="filters-dropdown-content">
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
      </div>

      <!-- Mode Bartender only -->
      <div v-if="appMode === 'bartender'" class="section-card">

        <button 
          v-if="appMode === 'bartender'"
          @click="toggleOrderQueue"
          class="expand-actions-btn"
        >
          <ChevronDown 
            :size="18"
            :class="{ rotated: showOrderQueueModal }"
          />
          <h2 class="section-title">🕔️ Commandes ({{ orders.length }})</h2>
          <span></span>
        </button>

        <OrderQueueModal
          v-if="showOrderQueueModal"
          :orders="orders"
          :profiles="profiles"
          @complete="completeOrder"
          @close="showOrderQueueModal = false"
        />
      </div>


      <!-- Inventory Manager -->

      <div v-if="appMode === 'bartender'" class="section-card">
        <button 
          v-if="appMode === 'bartender'"
          @click="toggleInventoryManager"
          class="expand-actions-btn"
        >
          <ChevronDown 
            :size="18"
            :class="{ rotated: showInventoryManager }"
          />
          <h2 class="section-title">📦️ Gérer le stock du bar</h2>
          <span></span>
        </button>
        <InventoryManager 
          v-if="showInventoryManager"
          :barInventory="barInventory"
          :availableCocktailsCount="availableCocktailsCount"
          @toggle="toggleIngredient"
          @close="showInventoryManager = false"
        />
      </div>
      <!-- End of Mode Bartender only -->

      <!-- Start of Cocktails List -->
      <div>
        <h2 class="cocktails-header">{{ filteredCocktails.length }} cocktails trouvés</h2>

        <div v-if="filteredCocktails.length === 0" class="text-center py-8 text-gray-500">
          Aucun cocktail trouvé avec ces critères
        </div>

        <!-- Grille de cocktails -->
        <div class="cocktails-grid">
          <CocktailCard
            v-for="cocktail in filteredCocktails"
              :cocktail="cocktail"
              :appMode="appMode"
              :currentProfile="currentProfile"
              :barInventory="barInventory"
              :favorites="favorites"
              :userRatings="userRatings"
              :userNotes="userNotes"
              :isHidden="hiddenCocktails.has(cocktail.id)"
              :onToggleFavorite="toggleFavorite"
              :onOrder="orderCocktail"
              :onToggleHidden="toggleHidden"
          />
        </div>
      </div>
      <!-- End of Cocktails List -->


    </div>

    <!-- Modals -->
    <ProfileModal
      v-if="showProfileModal"
      :profiles="profiles"
      :currentProfile="currentProfile"
      :isBartenderMode="appMode === 'bartender'"
      :isDrinkerMode="appMode === 'drinker'"
      :onClose="closeProfileModal"
      :onCreate="createProfile"
      :onSelect="selectProfile"
      :onDelete="deleteProfile"
    />

    <PasswordModal
      v-if="showPasswordModal"
      :onClose="closePasswordModal"
      :onSuccess="switchToBartenderMode"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Wine, Search, User, Filter, ChevronDown, X } from 'lucide-vue-next';
import { cocktailsData, spirit_categories, spirit_subcategories, seasons} from '@/Utils/sampleData';
import { Storage } from '@/Utils/storage';
import { useInventory } from '@/Utils/useInventory';

import ProfileModal from '@/Components/Modals/ProfileModal.vue';
import PasswordModal from '@/Components/Modals/PasswordModal.vue';
import FiltersModal from '@/Components/Modals/FiltersModal.vue';
import OrderQueueModal from '@/Components/Modals/OrderQueueModal.vue';
import InventoryManager from '@/Components/Modals/InventoryManager.vue';
import CocktailCard from '@/Components/CocktailCard.vue';

import { useOrders } from '@/composables/useOrders'
import { onUnmounted } from 'vue'

// States
const appMode = ref('drinker'); // Mode par défaut
const currentProfile = ref(null);
const profiles = ref([]);
const searchTerm = ref('');
const hiddenCocktails = ref(new Set());
// const barInventory = ref(new Set()); // Set d'ingrédients disponibles
// const allIngredients = ref([]);
const favorites = ref(new Set());
const userRatings = ref({});
const userNotes = ref({});
const orderHistory = ref([]);
const orders = ref([]);

// Gestion de l'affichage des filtres, cocktails
const cocktails = ref([]);
const selectedSpirits = ref([])
const selectedSubcategories = ref([])
const selectedSeasons = ref([])

// Variables pour les modales
const showFiltersModal = ref(false);
const showStatistics = ref(false);
const showOrderQueueModal = ref(false);
const showInventoryManager = ref(false);
const expandedCocktail = ref(null);
const showPasswordModal = ref(false);

// ----------------------- COMMAND / DATA BASE --------------------
const { 
  orders: dbOrders, 
  createOrder, 
  fetchPendingOrders, 
  completeOrder: completeDbOrder,
  subscribeToOrders 
} = useOrders()

let orderChannel = null

// Modifier onMounted
onMounted(async () => {
  profiles.value = Storage.getProfiles();
  
  const savedInventory = Storage.getBarInventory();
  barInventory.value = new Set(savedInventory);
  
  hiddenCocktails.value = Storage.getHiddenCocktails();

  const savedSeason = Storage.getSeasonFilter();
  if (savedSeason && savedSeason !== 'all') {
    selectedSeasons.value = [savedSeason];
  } else {
    selectedSeasons.value = [];
  }
  
  // Charger les commandes depuis Supabase
  await fetchPendingOrders()
  orders.value = dbOrders.value
  
  // S'abonner aux nouvelles commandes en temps réel
  orderChannel = subscribeToOrders((newOrder) => {
    // Notification sonore ou visuelle optionnelle
    console.log('🔔 Nouvelle commande:', newOrder)
  })
})

// Nettoyer l'abonnement au démontage
onUnmounted(() => {
  if (orderChannel) {
    orderChannel.unsubscribe()
  }
})

// Remplacer ta fonction orderCocktail
async function orderCocktail(cocktail) {
  if (!currentProfile.value) {
    alert('Veuillez sélectionner un profil')
    return
  }
  
  const profileData = currentProfileData.value
  
  const orderData = {
    cocktailId: cocktail.id,
    cocktailName: cocktail.Name,
    cocktail: cocktail,
    profileId: currentProfile.value,
    profileName: profileData.name
  }

  // Enregistrer dans Supabase
  const result = await createOrder(orderData)
  
  if (result.success) {
    // Ajouter aussi au localStorage pour backup
    orderHistory.value.unshift({
      cocktailId: cocktail.id,
      cocktailName: cocktail.Name,
      timestamp: result.data.created_at
    })
    
    alert(`✅ ${cocktail.Name} commandé !`)
  } else {
    alert(`❌ Erreur lors de la commande: ${result.error.message}`)
  }
}

// Modifier completeOrder
async function completeOrder(order) {
  const result = await completeDbOrder(order.id)
  
  if (result.success) {
    // Retirer de la liste locale
    orders.value = orders.value.filter(o => o.id !== order.id)
  } else {
    alert(`❌ Erreur: ${result.error.message}`)
  }
}

// ------------------------ BARTENDER MODE ------------------------
// Accéder à l'inventaire
const { barInventory } = useInventory();

const showOnlyMakeable = ref(false);

function isCocktailMakeable(cocktail) {
  // Vérifier que cocktail existe et a une Recipe
  if (!cocktail || !Array.isArray(cocktail.Recipe)) {
    return false;
  }
  
  // Si l'inventaire est vide, aucun cocktail n'est réalisable
  if (barInventory.value.size === 0) {
    return false;
  }
  
  return cocktail.Recipe.every(ing => {
    // Les garnitures ne comptent pas comme bloquantes
    if (ing.Type === 'garnish') return true;
    
    // Vérifier si l'ingrédient est dans l'inventaire
    return barInventory.value.has(ing.Ingredient);
  });
}

function getMissingIngredientsCount(cocktail) {
  if (!Array.isArray(cocktail.Recipe)) return 0;
  
  return cocktail.Recipe.filter(ing => {
    return ing.Type !== 'garnish' && !barInventory.value.has(ing.Ingredient);
  }).length;
}

// Récupérer tous les ingrédients uniques de tous les cocktails
const allIngredients = computed(() => {
  const ingredients = new Set();
  cocktails.value.forEach(cocktail => {
    cocktail.Recipe?.forEach(item => {
      if (item.Ingredient) {
        ingredients.add(item.Ingredient);
      }
    });
  });
  return Array.from(ingredients).sort();
});

const toggleIngredient = (ingredientKey) => {
  if (barInventory.value.has(ingredientKey)) {
    barInventory.value.delete(ingredientKey);
  } else {
    barInventory.value.add(ingredientKey);
  }
  // Forcer la réactivité
  barInventory.value = new Set(barInventory.value);
  // Sauvegarder
  Storage.setBarInventory(Array.from(barInventory.value));
};

const toggleOrderQueue = () => {
  showOrderQueueModal.value = !showOrderQueueModal.value
}

const toggleInventoryManager = () => {
  showInventoryManager.value = !showInventoryManager.value
}

// ------------------------ END OF BARTENDER MODE ------------------------

// ------------------------ COCKTAILS FILTERS ---------------------------------
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
}

// Appeler immédiatement au lieu d'attendre onMounted
loadCocktails(cocktailsData);

// Initialisation
onMounted(() => {
  profiles.value = Storage.getProfiles();
  
  // Charger l'inventaire du bar
  const savedInventory = Storage.getBarInventory();
  barInventory.value = new Set(savedInventory);
  
  hiddenCocktails.value = Storage.getHiddenCocktails();

  // Charger les filtres sauvegardés
  const savedSeason = Storage.getSeasonFilter();
  // Si une saison était sauvegardée, l'ajouter au tableau
  if (savedSeason && savedSeason !== 'all') {
    selectedSeasons.value = [savedSeason];
  } else {
    selectedSeasons.value = [];
  }
  orders.value = Storage.getOrderQueue();
});

const toggleFilter = (array, value) => {
  const index = array.indexOf(value)
  if (index > -1) {
    array.splice(index, 1)
  } else {
    array.push(value)
  }
}

// ------------------------ END COCKTAILS FILTERS ---------------------------------

// Computed
const currentProfileData = computed(() => 
  profiles.value.find(p => p.id === currentProfile.value)
);

// Fonction pour basculer le mode
function toggleMode() {
  if (appMode.value === 'drinker') {
    // Si on est en mode drinker, demander le mot de passe
    showPasswordModal.value = true;
  } else {
    // Si on est en mode bartender, passer directement en mode drinker
    appMode.value = 'drinker';
    showProfileModal.value = true
  }
}

// Fonction appelée après succès du mot de passe
function switchToBartenderMode() {
  appMode.value = 'bartender';
  currentProfile.value = null; // Optionnel : désélectionner le profil
}

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

// ------ END OF PROFILE HANDLER ------

// Filtre les sous-catégories en fonction des catégories sélectionnées
const filteredSubcategories = computed(() => {
  if (selectedSpirits.value.length === 0) return [];

  // Récupérer toutes les sous-catégories pour tous les spiritueux sélectionnés
  const allSubcategories = selectedSpirits.value.flatMap(spirit => {
    return spirit_subcategories[spirit] || [];
  });

  // Retirer les doublons (si deux spiritueux ont la même sous-catégorie)
  const uniqueSubcategories = allSubcategories.filter((sub, index, self) => 
    index === self.findIndex(s => s.key === sub.key)
  );

  return uniqueSubcategories;
});

// Nettoyer les sous-catégories sélectionnées quand on change les spiritueux
watch(selectedSpirits, (newSpirits) => {
  // Récupérer toutes les sous-catégories valides pour les spiritueux actuels
  const validSubcategoryKeys = new Set(
    newSpirits.flatMap(spirit => 
      (spirit_subcategories[spirit] || []).map(sub => sub.key)
    )
  );

  // Garder seulement les sous-catégories qui sont encore valides
  selectedSubcategories.value = selectedSubcategories.value.filter(subKey => 
    validSubcategoryKeys.has(subKey)
  );
}, { deep: true });

// Obtenir le label d'un spiritueux
function getSpiritLabel(key) {
  const spirit = spirit_categories.find(s => s.key === key);
  return spirit ? spirit.value : key;
}

// Obtenir le label d'une sous-catégorie
function getSubcategoryLabel(key) {
  // Parcourir toutes les sous-catégories
  for (const spirits of Object.values(spirit_subcategories)) {
    const sub = spirits.find(s => s.key === key);
    if (sub) return sub.value;
  }
  return key;
}

// Obtenir le label d'une saison
function getSeasonLabel(key) {
  const season = seasons.find(s => s.key === key);
  return season ? `${season.icon} ${season.value}` : key;
}

const hasActiveFilters = computed(() => 
  selectedSpirits.value.length > 0 || 
  selectedSubcategories.value.length > 0 || 
  selectedSeasons.value.length > 0
)

const clearAllFilters = () => {
  selectedSpirits.value = []
  selectedSubcategories.value = []
  selectedSeasons.value = []
}

// Cocktails disponibles (ceux qu'on peut faire avec l'inventaire)
const availableCocktailsCount = computed(() => {
  if (!Array.isArray(cocktails.value)) return 0;
  
  return cocktails.value.filter(cocktail => {
    if (!Array.isArray(cocktail.Recipe)) return false;
    return cocktail.Recipe.every(ing => 
      ing.Type === 'garnish' || barInventory.value.has(ing.Ingredient)
    );
  }).length;
});

// Filtrer les cocktails
const filteredCocktails = computed(() => {
  if (!Array.isArray(cocktails.value)) return [];
  
  let filtered = cocktails.value;

  // Filtre par recherche textuelle
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase().trim();
    filtered = filtered.filter(cocktail => {
      // Recherche dans le nom du cocktail
      const nameMatch = cocktail.Name.toLowerCase().includes(search);
      
      // Recherche dans les ingrédients
      const ingredientMatch = cocktail.Recipe?.some(ing => 
        ing.Ingredient.toLowerCase().includes(search)
      );

      const creatorMatch = cocktail.Creator?.toLowerCase().includes(search);

      const profileMatch = cocktail.Profile?.some(p => 
        p.toLowerCase().includes(search)
      );
      return nameMatch || ingredientMatch || creatorMatch || profileMatch;
    });
  }

  // Filtre par catégorie de spiritueux (mode OU : au moins un spiritueux sélectionné correspond)
  if (selectedSpirits.value.length > 0) {
    filtered = filtered.filter(cocktail => {
      return selectedSpirits.value.includes(cocktail.family);
    });
  }

  // Filtre par sous-catégorie (mode OU : au moins une sous-catégorie sélectionnée correspond)
  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(cocktail => {
      return selectedSubcategories.value.includes(cocktail.spiritType);
    });
  }

  // Filtre par saison (mode OU : au moins une saison sélectionnée correspond)
  if (selectedSeasons.value.length > 0) {
    filtered = filtered.filter(cocktail => {
      // Vérifier si Season est un tableau et contient au moins une des saisons sélectionnées
      if (Array.isArray(cocktail.Season)) {
        return cocktail.Season.some(season => selectedSeasons.value.includes(season));
      }
      // Si Season est une string, vérifier si elle fait partie des saisons sélectionnées
      return selectedSeasons.value.includes(cocktail.Season);
    });
  }

  // Filtre par disponibilité des ingrédients
  if (showOnlyMakeable.value && barInventory.value.size > 0) {
    filtered = filtered.filter(cocktail => isCocktailMakeable(cocktail));
  }

  // Masquer les cocktails cachés en mode drinker
  if (appMode.value === 'drinker') {
    filtered = filtered.filter(cocktail => !hiddenCocktails.value.has(cocktail.id));
  }

  return filtered;
});



// Nettoyer les sous-catégories sélectionnées quand on change les spiritueux
watch(selectedSpirits, (newSpirits) => {
  // Récupérer toutes les sous-catégories valides pour les spiritueux actuels
  const validSubcategoryKeys = new Set(
    newSpirits.flatMap(spirit => 
      (spirit_subcategories[spirit] || []).map(sub => sub.key)
    )
  );

  // Garder seulement les sous-catégories qui sont encore valides
  selectedSubcategories.value = selectedSubcategories.value.filter(subKey => 
    validSubcategoryKeys.has(subKey)
  );
}, { deep: true });

// Watch pour sauvegarder
watch(barInventory, (newVal) => {
  Storage.saveBarInventory(newVal);
}, { deep: true });

watch(hiddenCocktails, (newVal) => {
  Storage.saveHiddenCocktails(newVal);
}, { deep: true });

watch(orders, (newVal) => {
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

  orders.value.push(order);
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

function toggleFavorite(cocktailId) {
  if (!currentProfile.value) return;
  
  const newFavorites = new Set(favorites.value);
  if (newFavorites.has(cocktailId)) {
    newFavorites.delete(cocktailId);
  } else {
    newFavorites.add(cocktailId);
  }
  favorites.value = newFavorites;
}

function completeOrder(order) {
  orders.value = orders.value.filter(o => o.id !== order.id);
}

function logoutProfile() {
  currentProfile.value = null;
  showProfileModal.value = true;
}

// Fermer les modales
function closePasswordModal() {
  showPasswordModal.value = false;
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

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.count-badge {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.expand-actions-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.expand-actions-btn svg {
  transition: transform 0.25s ease;
}

.expand-actions-btn svg.rotated {
  transform: rotate(180deg);
}

</style>