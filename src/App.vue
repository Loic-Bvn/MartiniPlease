<template>
  <!-- Le composant principal du menu des cocktails -->
  <CocktailMenuApp />
</template>

<script setup>
import CocktailMenuApp from './CocktailMenuApp.vue';
import { useOrders } from '@/composables/useOrders'

const { 
  orders: dbOrders, 
  createOrder, 
  fetchPendingOrders, 
  completeOrder: completeDbOrder,
  subscribeToOrders 
} = useOrders()
</script>