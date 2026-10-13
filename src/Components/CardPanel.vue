<template>
  <div class="section-card">
    <button @click="$emit('toggle')" class="expand-actions-btn">
      <ChevronDown :size="18" :class="{ rotated: open }" />
      <h2 class="section-title"><component :is="lucideIcons.cards" :size="20" class="tile-ico" /><span class="tile-lbl">{{ t.cardsTitle }}</span><span class="count-badge">{{ menuCards.length }}</span></h2>
      <span></span>
    </button>
    <div v-if="open" class="cards-content">
      <div v-if="menuCards.length === 0 && !isLoggedIn" class="cards-empty">{{ t.noCard }}</div>
      <div v-else class="cards-grid">

        <div
          v-for="card in menuCards"
          :key="card.id"
          :class="['menu-card-item', { 'menu-card-item--hidden': card.is_visible === false }]"
          role="button"
          tabindex="0"
          @click="$emit('view-card', card)"
          @keydown.enter="$emit('view-card', card)"
        >
          <div class="menu-card-info">
            <span class="menu-card-name">{{ card.name }}</span>
            <span class="menu-card-meta">
              <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
              <span v-if="isLoggedIn && card.is_visible === false" class="menu-card-pill">
                <EyeOff :size="11" />{{ locale === 'fr' ? 'Masquée' : 'Hidden' }}
              </span>
            </span>
          </div>

          <div class="menu-card-actions" @click.stop>
            <!-- Pastille « Ouvrir » : montre clairement qu'un clic ouvre la carte -->
            <button type="button" :class="['menu-card-open', { 'menu-card-open--compact': isLoggedIn }]" @click="$emit('view-card', card)">
              <BookOpen :size="13" /><span>{{ locale === 'fr' ? 'Ouvrir' : 'Open' }}</span>
            </button>
            <template v-if="isLoggedIn">
              <button
                @click="$emit('toggle-card-visibility', card)"
                class="btn-icon btn-icon--visibility"
                :title="card.is_visible === false ? (locale === 'fr' ? 'Afficher aux drinkers' : 'Show to drinkers') : (locale === 'fr' ? 'Masquer aux drinkers' : 'Hide from drinkers')"
              >
                <EyeOff v-if="card.is_visible === false" :size="16" />
                <Eye v-else :size="16" />
              </button>
              <button @click="$emit('edit-card', card)"      class="btn-icon btn-icon--edit"   ><Pencil :size="16" /></button>
              <button @click="$emit('delete-card', card.id)" class="btn-icon btn-icon--delete"><Trash2 :size="16" /></button>
            </template>
          </div>
        </div>

        <!-- Tuile « nouvelle carte » : dernière case de la grille -->
        <button v-if="isLoggedIn" @click="$emit('new-card')" class="menu-card-new">
          <Plus :size="16" /><span>{{ t.newCard }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { lucideIcons } from '@/utils/lucideIcons'
import { ChevronDown, BookOpen, Eye, EyeOff, Pencil, Trash2, Plus } from 'lucide-vue-next'

defineProps({ open: { type: Boolean, default: false }, isLoggedIn: Boolean, menuCards: Array, locale: String, t: Object })
defineEmits(['toggle', 'view-card', 'edit-card', 'delete-card', 'new-card', 'toggle-card-visibility'])
</script>