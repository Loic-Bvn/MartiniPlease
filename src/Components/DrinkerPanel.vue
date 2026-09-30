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

      <div class="loyalty-panel">
        <div class="loyalty-panel-header">
          <span class="loyalty-panel-title">{{ locale === 'fr' ? 'Carte de fidélité' : 'Loyalty card' }}</span>
          <strong>{{ Math.min(history.length, loyaltyTarget) }} / {{ loyaltyTarget }}</strong>
        </div>
        <div class="engagement-progress-track" role="progressbar" :aria-valuenow="Math.min(history.length, loyaltyTarget)" aria-valuemin="0" :aria-valuemax="loyaltyTarget">
          <span :style="{ width: `${loyaltyPercent}%` }"></span>
        </div>
        <p v-if="history.length >= loyaltyTarget" class="loyalty-reward">
          {{ locale === 'fr' ? 'Récompense atteinte : demande ton avantage au bartender.' : 'Reward unlocked: ask the bartender about your perk.' }}
        </p>
        <p v-else class="loyalty-hint">
          {{ locale === 'fr' ? `Encore ${loyaltyTarget - history.length} commande${loyaltyTarget - history.length > 1 ? 's' : ''} pour atteindre la récompense.` : `${loyaltyTarget - history.length} more order${loyaltyTarget - history.length > 1 ? 's' : ''} to unlock the reward.` }}
        </p>
      </div>

      <div v-if="tab === 'favorites'">
        <button v-if="favorites.size" type="button" class="share-favorites-button" @click="$emit('share-favorites')">
          <Share2 :size="15" />
          {{ locale === 'fr' ? 'Partager ma liste' : 'Share my list' }}
        </button>
        <div v-if="favorites.size === 0" class="cards-empty">{{ locale === 'fr' ? 'Aucun favori pour l\'instant.' : 'No favorites yet.' }}</div>
        <div v-else class="cards-grid">
          <div v-for="cocktail in favoriteCocktails" :key="cocktail.id" class="menu-card-item">
            <span class="menu-card-name">{{ cocktail.name }}</span>
            <button @click="$emit('toggle-favorite', cocktail.id)" class="btn-icon btn-icon--delete">
              <Heart :size="14" fill="currentColor" style="color: #e05c6e" />
            </button>
          </div>
        </div>
        <div v-if="recommendations.length" class="recommendations-block">
          <h3 class="recommendations-title">{{ locale === 'fr' ? 'Vous pourriez aimer' : 'You might like' }}</h3>
          <button
            v-for="cocktail in recommendations"
            :key="cocktail.id"
            type="button"
            class="recommendation-item"
            @click="$emit('open-cocktail', cocktail)"
          >
            <span>{{ cocktail.name }}</span>
            <span class="recommendation-reason">{{ cocktail.base_spirit || cocktail.profile?.[0] || '' }}</span>
          </button>
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
import { ref, computed } from 'vue'
import { ChevronDown, Heart, Share2 } from 'lucide-vue-next'

const show = ref(false)
const tab  = ref('favorites')

const props = defineProps({
  locale: String, drinkerPseudo: String,
  favorites: Set, favoriteCocktails: Array,
  recommendations: { type: Array, default: () => [] },
  inviteCode: { type: String, default: '' },
  loyaltyTarget: { type: Number, default: 5 },
  history: Array,
  getCocktailName: Function, formatDate: Function,
})
defineEmits(['toggle-favorite', 'open-cocktail', 'share-favorites'])

const loyaltyPercent = computed(() => Math.min(100, Math.round((props.history.length / props.loyaltyTarget) * 100)))
</script>