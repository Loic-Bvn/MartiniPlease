<template>
  <div class="section-card">
    <button @click="show = !show" class="expand-actions-btn">
      <ChevronDown :size="18" :class="{ rotated: show }" />
      <h2 class="section-title">👤 {{ drinkerPseudo }}</h2>
      <span></span>
    </button>
    <div v-if="show" class="filters-dropdown-content">

      <div class="auth-tabs" style="margin-bottom: 12px; border-bottom: 1px solid var(--color-border-tertiary);">
        <button :class="['auth-tab', { active: tab === 'favorites' }]" @click="tab = 'favorites'">
          ❤️ {{ locale === 'fr' ? 'Favoris' : 'Favorites' }}<span class="count-badge">{{ favorites.size }}</span>
        </button>
        <button :class="['auth-tab', { active: tab === 'history' }]" @click="tab = 'history'">
          🕐 {{ locale === 'fr' ? 'Historique' : 'History' }}<span class="count-badge">{{ history.length }}</span>
        </button>
      </div>

      <div v-if="tab === 'favorites'">
        <div v-if="favorites.size === 0" class="cards-empty">{{ locale === 'fr' ? 'Aucun favori pour l\'instant.' : 'No favorites yet.' }}</div>
        <div v-else class="cards-grid">
          <div v-for="cocktail in favoriteCocktails" :key="cocktail.id" class="menu-card-item">
            <span class="menu-card-name">{{ cocktail.name }}</span>
            <button @click="$emit('toggle-favorite', cocktail.id)" class="btn-icon btn-icon--delete">
              <Heart :size="14" fill="currentColor" style="color: #e05c6e" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="tab === 'history'">
        <div v-if="history.length === 0" class="cards-empty">{{ locale === 'fr' ? 'Aucune commande encore.' : 'No orders yet.' }}</div>
        <div v-else class="cards-grid">
          <div v-for="(entry, i) in history" :key="i" class="menu-card-item">
            <span class="menu-card-name">{{ getCocktailName(entry.cocktail_id) }}</span>
            <span class="menu-card-count">{{ formatDate(entry.ordered_at) }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronDown, Heart } from 'lucide-vue-next'

const show = ref(false)
const tab  = ref('favorites')

defineProps({
  locale: String, drinkerPseudo: String,
  favorites: Set, favoriteCocktails: Array,
  history: Array,
  getCocktailName: Function, formatDate: Function,
})
defineEmits(['toggle-favorite'])
</script>