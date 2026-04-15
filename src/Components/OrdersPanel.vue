<template>
  <div class="orders-panel">

    <!-- =========================
         TABS
    ========================= -->
    <div class="orders-tabs">
      <button
        @click="activeTab = 'pending'"
        :class="['tab-btn', { 'tab-btn--active': activeTab === 'pending' }]"
      >
        <span v-if="activeTab === 'pending'" class="tab-icon">⏳</span>
        {{ locale === 'fr' ? 'En attente' : 'Pending' }}
        <span v-if="orders.length > 0" class="tab-count">
          {{ orders.length }}
        </span>
      </button>

      <button
        @click="activeTab = 'completed'"
        :class="['tab-btn', { 'tab-btn--active': activeTab === 'completed' }]"
      >
        <span v-if="activeTab === 'completed'" class="tab-icon">✅</span>
        {{ locale === 'fr' ? 'Complétées' : 'Completed' }}
        <span v-if="completedOrders.length > 0" class="tab-count">
          {{ completedOrders.length }}
        </span>
      </button>
    </div>

    <!-- =========================
         CONTROLS (COMPLETED)
    ========================= -->
    <div
      v-if="activeTab === 'completed' && completedOrders.length > 0"
      class="orders-controls"
    >
      <div class="sort-controls">
        <label class="sort-label">
          {{ locale === 'fr' ? 'Trier par:' : 'Sort by:' }}
        </label>

        <select v-model="sortBy" class="sort-select">
          <option value="completed">
            {{ locale === 'fr' ? 'Plus récent' : 'Most recent' }}
          </option>
          <option value="completed-asc">
            {{ locale === 'fr' ? 'Plus ancien' : 'Oldest' }}
          </option>
          <option value="drinker">Drinker</option>
          <option value="cocktail">Cocktail</option>
        </select>
      </div>
    </div>

    <!-- =========================
         PENDING
    ========================= -->
    <div v-if="activeTab === 'pending'" class="orders-content">

      <div v-if="orders.length === 0" class="orders-empty">
        <p>{{ locale === 'fr' ? 'Aucune commande en attente' : 'No pending orders' }}</p>
      </div>

      <div v-else class="orders-list orders-list--pending">

        <div
          v-for="(group, idx) in groupedPendingOrders"
          :key="idx"
          class="order-card"
        >

          <!-- HEADER: Titre + Count -->
          <div class="order-card-header">
            <div class="order-card-title">
              <GlassWater :size="16" />
              <span>{{ getCocktailName(group.cocktail_id) }}</span>
            </div>
            
            <!-- CHIPS (Méthode + Glace) -->
            <div v-if="getCocktail(group.cocktail_id)" class="recipe-chips">
                <div v-if="group.orders.length > 1" class="chip chip-small">
                ×{{ group.orders.length }}
                </div>
                <span v-if="isValidChip(getCocktail(group.cocktail_id).method)" class="chip chip-small">
                    {{ getCocktail(group.cocktail_id).method }}
                </span>
                <span v-if="isValidChip(getCocktail(group.cocktail_id).ice)" class="chip chip-small">
                    🧊 {{ getCocktail(group.cocktail_id).ice }}
                </span>
                <span v-if="isValidChip(getCocktail(group.cocktail_id).glass)" class="chip chip-small">
                    🍸 {{ getCocktail(group.cocktail_id).glass }}
                </span>
            </div>
          </div>

          <!-- RECETTE + INFO (grouped) -->
          <div class="order-card-content">
            
            <!-- RECETTE -->
            <div
              v-if="getCocktail(group.cocktail_id)?.recipe?.length"
              class="recipe-compact"
            >
              <div
                v-for="(ing, idx) in getRecipeWithQty(group.cocktail_id)"
                :key="idx"
                class="recipe-line"
              >
                <div class="ingredient-info">
                <span>
                    {{ getTypeLabel(ing.Type, locale) }}
                </span>
                </div>
                <span class="ingredient-quantity">
                  {{ ing._qty }}
                </span>
              </div>
            </div>



          </div>

          <!-- COMMANDES -->
          <div class="order-card-orders">

            <div
              v-for="order in group.orders"
              :key="order.id"
              class="order-item order-item--pending"
            >
              <div class="order-info">

                <div class="order-drinker">
                  <User :size="14" />
                  <span>{{ order.drinker_profiles?.pseudo || 'Unknown' }}</span>
                </div>

                <div class="order-time">
                  <Clock :size="12" />
                  <span>{{ formatTime(order.created_at) }}</span>
                </div>

              </div>

              <div class="order-actions">
                <button
                  @click="handleComplete(order.id)"
                  class="order-btn order-btn--complete"
                >
                  <Check :size="16" />
                </button>

                <button
                  @click="handleCancel(order.id)"
                  class="order-btn order-btn--cancel"
                >
                  <X :size="16" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- =========================
         COMPLETED
    ========================= -->
    <div v-if="activeTab === 'completed'" class="orders-content">

      <div v-if="completedOrders.length === 0" class="orders-empty">
        <p>{{ locale === 'fr' ? 'Aucune commande complétée' : 'No completed orders' }}</p>
      </div>

      <div v-else class="orders-list orders-list--completed">

        <div
          v-for="order in sortedCompletedOrders"
          :key="order.id"
          class="order-item order-item--completed"
        >

          <div class="order-info">

            <div class="order-drinker">
              <User :size="14" />
              <span class="order-drinker-name">
                {{ order.drinker_profiles?.pseudo || 'Unknown' }}
              </span>
            </div>

            <div class="order-cocktail">
              <GlassWater :size="14" />
              <span class="order-cocktail-name">
                {{ getCocktailName(order.cocktail_id) }}
              </span>
            </div>

            <div class="order-time">
              <Clock :size="12" />
              <span class="order-time-text">
                {{ formatCompletedTime(order.completed_at) }}
              </span>
            </div>

          </div>

          <div class="order-actions-completed">

            <div class="order-badge">
              <Check :size="16" class="check-icon" />
              <span>{{ locale === 'fr' ? 'Complétée' : 'Completed' }}</span>
            </div>

            <button
              @click="handleDeleteCompleted(order.id)"
              :disabled="completingId === order.id"
              class="order-btn order-btn--delete"
              :title="locale === 'fr' ? 'Supprimer' : 'Delete'"
            >
              <X :size="16" />
            </button>

          </div>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { User, GlassWater, Clock, Check, X, Loader2 } from 'lucide-vue-next'
import { useOrders } from '@/composables/useOrders'
import { useCocktails } from '@/composables/useCocktails'
import { getTypeLabel } from '../constants/typeLabels.js'

const props = defineProps({
  locale: { type: String, default: 'fr' },
  unit: { type: String, default: 'oz' },
})

const { orders, completedOrders, completeOrder, cancelOrder } = useOrders()
const { cocktails } = useCocktails()
const completingId = ref(null)
const activeTab = ref('pending')
const sortBy = ref('completed')

const getCocktailName = computed(() => (cocktailId) => {
  const cocktail = cocktails.value.find(c => c.id === cocktailId)
  return cocktail?.name || 'Unknown'
})

const getCocktail = computed(() => (cocktailId) => {
  return cocktails.value.find(c => c.id === cocktailId)
})

const groupedPendingOrders = computed(() => {
  const map = new Map()

  for (const order of orders.value) {
    const key = order.cocktail_id

    if (!map.has(key)) {
      map.set(key, {
        cocktail_id: key,
        orders: [],
        created_at: order.created_at,
      })
    }

    const group = map.get(key)
    group.orders.push(order)

    // garder la plus ancienne date du groupe (logique POS)
    group.created_at = new Date(
      Math.min(new Date(group.created_at), new Date(order.created_at))
    )
  }

  return Array.from(map.values()).sort((a, b) => {
    // priorité : volume puis ancienneté
    if (b.orders.length !== a.orders.length) {
      return b.orders.length - a.orders.length
    }
    return new Date(a.created_at) - new Date(b.created_at)
  })
})

// Tri des commandes complétées
const sortedCompletedOrders = computed(() => {
  const sorted = [...completedOrders.value]
  
  switch (sortBy.value) {
    case 'completed':
      return sorted.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    case 'completed-asc':
      return sorted.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    case 'drinker':
      return sorted.sort((a, b) => (a.drinker_profiles?.pseudo || '').localeCompare(b.drinker_profiles?.pseudo || ''))
    case 'cocktail': {
      return sorted.sort((a, b) => {
        const nameA = getCocktailName.value(a.cocktail_id)
        const nameB = getCocktailName.value(b.cocktail_id)
        return nameA.localeCompare(nameB)
      })
    }
    default:
      return sorted
  }
})

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return props.locale === 'fr' ? 'à l\'instant' : 'now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  return date.toLocaleDateString()
}

function formatCompletedTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const time = date.toLocaleTimeString(props.locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateStr = date.toLocaleDateString(props.locale === 'fr' ? 'fr-FR' : 'en-US')
  return `${dateStr} ${time}`
}

// function convertQuantity(amount, originalUnit) {
//   if (!amount) return ''
  
//   // Conversion ml <-> oz
//   // 1 oz = 29.5735 ml (on arrondit à 30 pour simplifier)
//   const ML_PER_OZ = 30
  
//   let displayAmount = amount
//   let displayUnit = originalUnit
  
//   // Si on veut afficher en oz et c'est en ml
//   if (props.unit === 'oz' && originalUnit === 'ml') {
//     displayAmount = (amount / ML_PER_OZ).toFixed(1)
//     displayUnit = 'oz'
//   }
//   // Si on veut afficher en ml et c'est en oz
//   else if (props.unit === 'ml' && originalUnit === 'oz') {
//     displayAmount = Math.round(amount * ML_PER_OZ)
//     displayUnit = 'ml'
//   }
  
//   return `${displayAmount}${displayUnit}`
// }

function convertUnit(unit) {
  // Juste convertir l'unité affichée
  if (props.unit === 'oz' && unit === 'ml') return 'oz'
  if (props.unit === 'ml' && unit === 'oz') return 'ml'
  return unit
}

async function handleComplete(orderId) {
  completingId.value = orderId
  const result = await completeOrder(orderId)
  completingId.value = null

  if (result.success && props.locale === 'fr') {
    // Optionnel : afficher une notification
  }
}

async function handleCancel(orderId) {
  completingId.value = orderId
  const result = await cancelOrder(orderId)
  completingId.value = null

  if (result.success && props.locale === 'fr') {
    // Optionnel : afficher une notification
  }
}

async function handleDeleteCompleted(orderId) {
  completingId.value = orderId
  const result = await cancelOrder(orderId)
  completingId.value = null

  if (result.success && props.locale === 'fr') {
    // Optionnel : afficher une notification
  }
}

function getQty(ing, count, unit) {
  if (!ing) return ''

  // Garnish (optionnel si tu veux les afficher différemment)
  if (ing.IsGarnish) return ''

  // Dashes
  if (ing.Dashes) {
    const total = ing.Dashes * count
    return `${total} dash${total > 1 ? 'es' : ''}`
  }

  let amount = 0
  let label = unit

  if (unit === 'ml' && ing.Ml) {
    amount = ing.Ml * count
    label = 'ml'
  } else if (unit === 'oz' && ing.Oz) {
    amount = ing.Oz * count
    label = 'oz'
  } else {
    return ''
  }

  return `${amount}${label}`
}

function isValidChip(value) {
  if (!value) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value !== '[]' && value !== '' && value !== '{}'
  return true
}

function getRecipeWithQty(cocktailId) {
  const cocktail = cocktails.value.find(c => c.id === cocktailId)
  if (!cocktail?.recipe) return []

  const group = groupedPendingOrders.value.find(g => g.cocktail_id === cocktailId)
  const count = group?.orders.length || 1

  return cocktail.recipe.map(ing => ({
    ...ing,
    _qty: getQty(ing, count, props.unit),
  }))
}

</script>