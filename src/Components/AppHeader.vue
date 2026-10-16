<template>
  <div class="header">
    <div class="header-container">
      <div class="header-top">
        <div class="header-brand" @click="$emit('logo-click')" style="cursor: pointer;">
          <img v-if="randomLogo" :src="randomLogo" alt="/margarita_square.png" class="header-logo" />
          <h1 class="header-title">{{ activeBarName }}</h1>
        </div>
        <div class="header-right" style="display:flex; align-items:center; gap:0.5rem;">
          <div class="header-actions">

            <!-- Bartender connecté -->
            <template v-if="activeBarId && isLoggedIn && !showBarsSelection">
              <button @click="$emit('open-new-cocktail')" class="btn-new-cocktail">
                <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCocktail }}</span>
              </button>
            </template>

            <!-- Drinker (not signed in) -->
            <button
              v-if="activeBarId && !isLoggedIn && !hasDrinker && !showBarsSelection"
              type="button"
              class="btn-new-cocktail btn-login-header"
              :title="t.login"
              :aria-label="t.login"
              @click="$emit('open-drinker-login')"
            >
              <LogIn :size="15" /><span class="btn-label-hide"> {{ t.login }}</span>
            </button>

            <!-- Drinker (signed in) -->
            <button
              v-if="activeBarId && !isLoggedIn && hasDrinker && !showBarsSelection"
              type="button"
              class="btn-new-cocktail btn-logout-header"
              :title="t.logout"
              :aria-label="t.logout"
              @click="$emit('drinker-sign-out')"
            >
              <LogOut :size="15" /><span class="btn-label-hide"> {{ t.logout }}</span>
            </button>

            <!-- Langue / unité / thème : dans le header, sauf en écran étroit (→ menu burger) -->
            <SettingsSwitches
              v-if="!isNarrow"
              :locale="locale"
              :unit="unit"
              :show-unit="!!activeBarId && !showBarsSelection"
              @set-locale="$emit('set-locale', $event)"
              @set-unit="$emit('set-unit', $event)"
            />
          </div>

        <div v-if="toastMessage" class="toast">
          {{ toastMessage }}
        </div>

          <!-- Menu burger tout à droite (bartender, ou tout le monde en écran étroit) -->
          <div v-if="isLoggedIn || isNarrow" class="burger-wrapper">
            <button 
              @click="burgerOpen = !burgerOpen" 
              class="btn-mode btn-mode-inactive burger-button"
              title="Plus d'options"
            >
              <Menu :size="16" />
            </button>

            <transition name="fade-slide">
              <div v-if="burgerOpen" class="burger-dropdown" @click.stop>

                <!-- Réglages (écran étroit uniquement) -->
                <template v-if="isNarrow">
                  <SettingsSwitches
                    layout="stacked"
                    :locale="locale"
                    :unit="unit"
                    :show-unit="!!activeBarId && !showBarsSelection"
                    @set-locale="$emit('set-locale', $event)"
                    @set-unit="$emit('set-unit', $event)"
                  />
                  <div v-if="isLoggedIn" class="burger-divider" />
                </template>

                <template v-if="isLoggedIn">
                <div v-if="activeBarId && !showBarsSelection" class="burger-header">
                  <span class="burger-title">
                    <Martini :size="16" />
                    {{ activeBarName }}
                  </span>

                  <span class="burger-subtitle">
                    <Key :size="14" />
                    {{ inviteCode }}
                  </span>
                </div>
                <div v-if="activeBarId && !showBarsSelection" class="burger-divider" />

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

                <div v-if="activeBarId && !showBarsSelection" class="burger-divider" />

                <button
                  v-if="activeBarId && !showBarsSelection"
                  @click="setFeature('order', !isFeatureEnabled('order'))"
                  class="burger-item burger-item--toggle"
                >
                  <HandPlatter :size="15" />

                  <span>{{ locale === 'fr' ? 'Autoriser commandes' : 'Allow orders' }}</span>

                  <!-- Toggle -->
                  <div class="toggle-switch" :class="{ 'on': isFeatureEnabled('order') }">
                    <div class="toggle-knob"></div>
                  </div>
                </button>


                <button
                  v-if="activeBarId && !showBarsSelection"
                  @click="setFeature('showPrices', !isFeatureEnabled('showPrices'))"
                  class="burger-item burger-item--toggle"
                >
                  <Euro :size="15" />

                  <span>{{ locale === 'fr' ? 'Afficher prix' : 'Show prices' }}</span>

                  <!-- Toggle -->
                  <div class="toggle-switch" :class="{ 'on': isFeatureEnabled('showPrices') }">
                    <div class="toggle-knob"></div>
                  </div>
                </button>

                <button
                  v-if="activeBarId && !showBarsSelection"
                  @click="setFeature('preparationCounter', !isFeatureEnabled('preparationCounter'))"
                  class="burger-item burger-item--toggle"
                >
                  <GlassWater :size="15" />
                  <span>{{ locale === 'fr' ? 'Compteur de préparations' : 'Preparation counter' }}</span>
                  <div class="toggle-switch" :class="{ 'on': isFeatureEnabled('preparationCounter') }">
                    <div class="toggle-knob"></div>
                  </div>
                </button>

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

                <div v-if="activeBarId && !showBarsSelection" class="burger-divider" />

                <!-- SECTION : CATALOG -->
                <button 
                  v-if="activeBarId && !showBarsSelection" 
                  @click="$emit('open-catalog')" 
                  class="burger-item"
                >
                  <Library :size="15" />
                  {{ locale === 'fr' ? 'Catalogue de recettes' : 'Recipe Catalog' }}
                </button> 

                <button
                  v-if="activeBarId && !showBarsSelection && isFeatureEnabled('preparationCounter')"
                  class="burger-item"
                  @click="$emit('open-preparation-stats'); burgerOpen = false"
                >
                  <ChartNoAxesCombined :size="15" />
                  {{ locale === 'fr' ? 'Statistiques des préparations' : 'Preparation statistics' }}
                </button>

                <div v-if="activeBarId && !showBarsSelection" class="burger-divider" />

                <!-- SECTION : DISCONNECT -->
                <button 
                  @click="$emit('sign-out')" 
                  class="burger-item burger-item--danger"
                >
                  <LogOut :size="15" />
                  {{ locale === 'fr' ? 'Se déconnecter' : 'Sign out' }}
                </button>
                </template>

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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Plus, Library, Lock, Unlock, LogIn, LogOut, Menu, Link, Folder, Martini, Key, HandPlatter, Euro, ChartNoAxesCombined, GlassWater} from 'lucide-vue-next'
import SettingsSwitches from '@/Components/SettingsSwitches.vue'
import { useBarFeatures } from '@/composables/useBarFeatures'

const { isFeatureEnabled, setFeature } = useBarFeatures()

const props = defineProps({
  isLoggedIn: Boolean,
  hasDrinker: Boolean,
  activeBarId: String,
  activeBarName: String,
  isBarPublic: Boolean,
  inviteCode: String,
  bars: Array,
  showBarsSelection: Boolean,
  locale: String,
  unit: String,
  toastMessage: String,
  randomLogo: String,
})

const emit = defineEmits([
  'logo-click',
  'open-new-cocktail',
  'open-drinker-login',
  'drinker-sign-out',
  'set-locale',
  'set-unit',
  'invite',
  'open-bars-selection',
  'toggle-public',
  'open-catalog',
  'open-preparation-stats',
  'sign-out'
])

const burgerOpen = ref(false)

// Écran étroit : langue / unité / thème passent dans le menu burger
// (libère la place pour le nom du bar actif)
const NARROW_QUERY = '(max-width: 600px)'
const isNarrow = ref(false)
let mql = null
const syncNarrow = (e) => { isNarrow.value = e.matches }
onMounted(() => {
  mql = window.matchMedia(NARROW_QUERY)
  isNarrow.value = mql.matches
  mql.addEventListener('change', syncNarrow)
})
onBeforeUnmount(() => mql?.removeEventListener('change', syncNarrow))

const t = computed(() => ({
  newCocktail: props.locale === 'fr' ? 'Nouveau cocktail' : 'New cocktail',
  login: props.locale === 'fr' ? 'Se connecter' : 'Sign in',
  logout: props.locale === 'fr' ? 'Se déconnecter' : 'Sign out',
}))
</script>

<style>
/* Menu burger : version compacte une fois déployé */
.header .burger-dropdown {
  width: min(240px, calc(100vw - 24px));
  min-width: 0;
  padding: 4px;
  border-radius: 10px;
}
.header .burger-dropdown .burger-item {
  gap: 7px;
  padding: 6px 9px;
  font-size: 0.76rem;
}
.header .burger-dropdown .burger-header { padding: 6px 9px; gap: 1px; }
.header .burger-dropdown .burger-title { font-size: 0.82rem; }
.header .burger-dropdown .burger-subtitle { font-size: 0.7rem; }
.header .burger-dropdown .burger-divider { margin: 3px 0; }
</style>