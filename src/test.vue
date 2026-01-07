<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const cocktails = ref([])
const loading = ref(true)

onMounted(async () => {
  const { data, error } = await supabase
    .from('cocktails')
    .select('*')
  
  if (error) {
    console.error('Erreur:', error)
  } else {
    cocktails.value = data
  }
  loading.value = false
})
</script>

<template>
  <div>
    <h2>Cocktails disponibles</h2>
    <p v-if="loading">Chargement...</p>
    <ul v-else>
      <li v-for="cocktail in cocktails" :key="cocktail.id">
        {{ cocktail.nom }} - {{ cocktail.prix }}€
      </li>
    </ul>
  </div>
</template>