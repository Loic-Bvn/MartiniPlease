<template>
  <div class="header">
    <div class="header-container">
      <div class="header-top">
        <div class="header-brand" @click="$emit('logo-click')" style="cursor: pointer;">
          <img v-if="randomLogo" :src="randomLogo" alt="/margarita_square.png" class="header-logo" />
          <h1 class="header-title">{{ activeBarName }}</h1>
        </div>
        <!-- Barre de recherche masquée sur l'écran d'accueil -->
        <div v-if="activeBarId" class="search-wrapper header-search-inline">
          <Search class="search-icon" :size="16" />
          <input 
            type="text" 
            :placeholder="t.searchPlaceholder" 
            :value="searchTerm"
            @input="$emit('update:searchTerm', $event.target.value)"
            class="search-input"
            @focus="showSearchSuggestions = searchTerm.length > 0"
            @blur="setTimeout(() => showSearchSuggestions = false, 150)"
          />
          <transition name="fade">
            <div v-if="showSearchSuggestions && suggestions.length > 0" class="search-suggestions" @click.stop>
              <div v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item" @click="$emit('scroll-to-cocktail', suggestion.id)">
                <span class="suggestion-type">🍹</span>
                <span class="suggestion-name">{{ suggestion.name }}</span>
              </div>
            </div>
          </transition>
        </div>
        <div class="header-right" style="display:flex; align-items:center; gap:0.5rem;">
          <div class="header-actions">

            <!-- Bartender connecté -->
            <template v-if="activeBarId && isLoggedIn && !showBarsSelection">
              <button @click="$emit('open-new-cocktail')" class="btn-new-cocktail">
                <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCocktail }}</span>
              </button>
            </template>

            <button @click="$emit('toggle-locale')" class="btn-mode btn-mode-inactive">
              {{ locale === 'fr' ? '🇬🇧' : '🇫🇷' }}
            </button>
            <button v-if="activeBarId && !showBarsSelection" @click="$emit('toggle-unit')" class="btn-mode btn-mode-inactive" :title="unit === 'oz' ? 'Passer en ml' : 'Switch to oz'">
              {{ unit === 'oz' ? 'ml' : 'oz' }}
            </button>
          </div>
          <ThemeToggle />

        <div v-if="toastMessage" class="toast">
          {{ toastMessage }}
        </div>

          <!-- Menu burger tout à droite (bartender uniquement) --><!-- Menu burger tout à droite -->
          <div v-if="isLoggedIn" class="burger-wrapper">
            <button 
              @click="burgerOpen = !burgerOpen" 
              class="btn-mode btn-mode-inactive burger-button"
              title="Plus d'options"
            >
              <Menu :size="16" />
            </button>

            <transition name="fade-slide">
              <div v-if="burgerOpen" class="burger-dropdown" @click.stop>

                <div v-if="activeBarId" class="burger-header">
                  <span class="burger-title">
                    <Martini :size="16" />
                    {{ activeBarName }}
                  </span>

                  <span class="burger-subtitle">
                    <Key :size="14" />
                    {{ inviteCode }}
                  </span>
                </div>
                <div v-if="activeBarId" class="burger-divider" />

                <button 
                  v-if="activeBarId && !showBarsSelection" 
                  @click="$emit('invite')" 
                  class="burger-item burger-item--primary"
                >
                  <Link :size="15" />
                  {{ locale === 'fr' ? 'Inviter au bar' : 'Invite to bar' }}
                </button>

                <!-- SECTION : GESTION -->
                <div v-if="bars.length >= 1 && !showBarsSelection && activeBarId">
                  <button 
                    @click="$emit('open-bars-selection')"
                    class="burger-item"
                  >
                    <Folder :size="16" />
                    {{ locale === 'fr' ? 'Gérer mes bars' : 'Manage bars' }}
                  </button>
                </div>


                <button 
                  v-if="activeBarId && !showBarsSelection" 
                  @click="$emit('toggle-public')" 
                  class="burger-item burger-item--toggle"
                >
                  <!-- Icône dynamique -->
                  <component 
                    :is="isBarPublic ? Unlock : Lock" 
                    :size="15" 
                  />

                  <span>
                    {{ isBarPublic 
                      ? (locale === 'fr' ? 'Bar public' : 'Public bar') 
                      : (locale === 'fr' ? 'Bar privé' : 'Private bar') 
                    }}
                  </span>

                  <!-- Toggle -->
                  <div class="toggle-switch" :class="{ 'on': isBarPublic }">
                    <div class="toggle-knob"></div>
                  </div>
                </button>

                <div v-if="activeBarId" class="burger-divider" />

                <!-- SECTION : CATALOG -->
                <button 
                  v-if="activeBarId && !showBarsSelection" 
                  @click="$emit('open-catalog')" 
                  class="burger-item"
                >
                  <Library :size="15" />
                  {{ locale === 'fr' ? 'Catalogue de recettes' : 'Recipe Catalog' }}
                </button> 

                <div v-if="activeBarId" class="burger-divider" />

                <!-- SECTION : DISCONNECT -->
                <button 
                  @click="$emit('sign-out')" 
                  class="burger-item burger-item--danger"
                >
                  <LogOut :size="15" />
                  {{ locale === 'fr' ? 'Se déconnecter' : 'Sign out' }}
                </button>

              </div>
            </transition>

            <div 
              v-if="burgerOpen" 
              class="burger-overlay" 
              @click="burgerOpen = false" 
            />
          </div>
        </div>
      </div>
      <!-- Barre de recherche mobile masquée sur l'écran d'accueil -->
      <div v-if="activeBarId" class="header-search-row">
        <div class="search-container">
          <Search class="search-icon" :size="16" />
          <input type="text" :placeholder="t.searchPlaceholderShort" :value="searchTerm" @input="$emit('update:searchTerm', $event.target.value)" class="search-input" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, ChevronDown, X, Plus, BookOpen, Library, Pencil, Trash2, Eye, Lock, Unlock, LogOut, Heart, Menu, Globe, EyeOff, Link, Check, Folder, Martini, Key} from 'lucide-vue-next'

import ThemeToggle from '@/Components/ThemeToggle.vue'

const props = defineProps({
  isLoggedIn: Boolean,
  activeBarId: String,
  activeBarName: String,
  isBarPublic: Boolean,
  inviteCode: String,
  bars: Array,
  showBarsSelection: Boolean,
  locale: String,
  unit: String,
  toastMessage: String,
  searchTerm: String,
  showSearchSuggestions: Boolean,
  suggestions: Array,
  randomLogo: String,
})

const emit = defineEmits([
  'logo-click',
  'open-new-cocktail',
  'toggle-locale',
  'toggle-unit',
  'scroll-to-cocktail',
  'invite',
  'open-bars-selection',
  'toggle-public',
  'open-catalog',
  'sign-out',
  'update:searchTerm'
])

const burgerOpen = ref(false)

const t = computed(() => ({
  newCocktail: props.locale === 'fr' ? 'Nouveau cocktail' : 'New cocktail',
  searchPlaceholder: props.locale === 'fr' ? 'Rechercher un cocktail ou un ingrédient...' : 'Search a cocktail or ingredient...',
  searchPlaceholderShort: props.locale === 'fr' ? 'Rechercher...' : 'Search...',
}))
</script>