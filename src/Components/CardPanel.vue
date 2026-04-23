<template>
  <div class="section-card">
    <button @click="show = !show" class="expand-actions-btn">
      <ChevronDown :size="18" :class="{ rotated: show }" />
      <h2 class="section-title">{{ t.cardsTitle }}<span class="count-badge">{{ menuCards.length }}</span></h2>
      <span></span>
    </button>
    <div v-if="show" class="cards-content">
      <div v-if="menuCards.length === 0" class="cards-empty">{{ t.noCard }}</div>
      <div v-else class="cards-grid">
        <div v-for="card in menuCards" :key="card.id" class="menu-card-item" @click="$emit('view-card', card)" style="cursor: pointer;">
          <div class="menu-card-info">
            <span class="menu-card-name">{{ card.name }}</span>
            <span class="menu-card-count">{{ card.cocktail_ids?.length || 0 }} cocktail{{ (card.cocktail_ids?.length || 0) > 1 ? 's' : '' }}</span>
          </div>
          <div class="menu-card-actions" @click.stop>
            <button class="btn-icon btn-icon--view" style="pointer-events: none;"><Eye :size="16" /></button>
            <template v-if="isLoggedIn">
              <button @click="$emit('edit-card', card)"    class="btn-icon btn-icon--edit"   ><Pencil :size="16" /></button>
              <button @click="$emit('delete-card', card.id)" class="btn-icon btn-icon--delete"><Trash2 :size="16" /></button>
            </template>
          </div>
        </div>
      </div>
      <button v-if="isLoggedIn" @click="$emit('new-card')" class="btn-new-card">
        <Plus :size="15" /><span class="btn-label-hide"> {{ t.newCard }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronDown, Eye, Pencil, Trash2, Plus } from 'lucide-vue-next'

const show = ref(false)
defineProps({ isLoggedIn: Boolean, menuCards: Array, locale: String, t: Object })
defineEmits(['view-card', 'edit-card', 'delete-card', 'new-card'])
</script>