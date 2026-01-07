import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useOrders() {
  const orders = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Créer une nouvelle commande
  async function createOrder(orderData) {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('commandes')
        .insert({
          cocktail_id: orderData.cocktailId,
          cocktail_name: orderData.cocktailName,
          cocktail_data: orderData.cocktail, // Stocker toute la recette
          user_id: orderData.profileId, // ID utilisateur Supabase Auth
          profile_name: orderData.profileName,
          statut: 'en_attente',
          notes: orderData.notes || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (supabaseError) throw supabaseError

      console.log('✅ Commande créée:', data)
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur création commande:', err)
      error.value = err.message
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  // Récupérer toutes les commandes en attente
  async function fetchPendingOrders() {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('commandes')
        .select('*')
        .in('statut', ['en_attente', 'en_preparation'])
        .order('created_at', { ascending: true })

      if (supabaseError) throw supabaseError

      orders.value = data
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur récupération commandes:', err)
      error.value = err.message
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  // Marquer une commande comme terminée
  async function completeOrder(orderId) {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('commandes')
        .update({ 
          statut: 'prete',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      console.log('✅ Commande complétée:', data)
      
      // Retirer de la liste locale
      orders.value = orders.value.filter(o => o.id !== orderId)
      
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erreur completion commande:', err)
      error.value = err.message
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }

  // S'abonner aux nouvelles commandes en temps réel
  function subscribeToOrders(callback) {
    const channel = supabase
      .channel('commandes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'commandes',
          filter: 'statut=eq.en_attente'
        },
        (payload) => {
          console.log('🔔 Nouvelle commande reçue:', payload.new)
          orders.value.unshift(payload.new)
          if (callback) callback(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'commandes'
        },
        (payload) => {
          console.log('🔄 Commande mise à jour:', payload.new)
          const index = orders.value.findIndex(o => o.id === payload.new.id)
          if (index !== -1) {
            if (payload.new.statut === 'prete') {
              orders.value.splice(index, 1)
            } else {
              orders.value[index] = payload.new
            }
          }
        }
      )
      .subscribe()

    return channel
  }
  
  async function fetchOrderHistory(profileId = null) {
  const query = supabase
    .from('commandes')
    .select('*')
    .eq('statut', 'prete')
    .order('updated_at', { ascending: false })
    .limit(50)
  
  if (profileId) {
    query.eq('user_id', profileId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Erreur historique:', error)
    return []
  }
  
  return data
}

  return {
    orders,
    loading,
    error,
    createOrder,
    fetchPendingOrders,
    completeOrder,
    subscribeToOrders
  }
}