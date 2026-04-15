// composables/useOrders.js
// Gère les commandes en attente des drinkers pour le bartender
// - Table Supabase : orders (id, bar_id, drinker_id, cocktail_id, status, created_at, completed_at)
// - Realtime : écoute les nouvelles commandes en temps réel

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const orders = ref([])
const completedOrders = ref([])
const subscription = ref(null)

export function useOrders() {
  const pendingOrdersCount = computed(() => orders.value.filter(o => o.status === 'pending').length)
  const completedOrdersCount = computed(() => completedOrders.value.length)

  // Initialise l'écoute des commandes en temps réel
  async function initOrdersListener(barId) {
    if (!barId) return

    // Récupère les commandes en attente et complétées actuelles
    await fetchPendingOrders(barId)
    await fetchCompletedOrders(barId)

    // Souscrit aux changements en temps réel
    if (subscription.value) {
      subscription.value.unsubscribe()
    }

    subscription.value = supabase
      .channel(`orders:bar_id=eq.${barId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `bar_id=eq.${barId}`,
        },
        (payload) => {
          handleOrderChange(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Listening to orders for bar:', barId)
        }
      })
  }

  // Récupère les commandes en attente
  async function fetchPendingOrders(barId) {
    if (!barId) return

    const { data, error } = await supabase
      .from('orders')
      .select('id, bar_id, drinker_id, cocktail_id, status, created_at, completed_at, drinker_profiles(pseudo)')
      .eq('bar_id', barId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ fetchPendingOrders:', error)
      return
    }

    orders.value = data || []
  }

  // Récupère les commandes complétées
  async function fetchCompletedOrders(barId) {
    if (!barId) return

    const { data, error } = await supabase
      .from('orders')
      .select('id, bar_id, drinker_id, cocktail_id, status, created_at, completed_at, drinker_profiles(pseudo)')
      .eq('bar_id', barId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ fetchCompletedOrders:', error)
      return
    }

    completedOrders.value = data || []
  }

  // Gère les changements en temps réel
  function handleOrderChange(payload) {
    if (payload.eventType === 'INSERT') {
      // Nouvelle commande
      orders.value.push(payload.new)
    } else if (payload.eventType === 'UPDATE') {
      // Mise à jour du statut
      const idx = orders.value.findIndex(o => o.id === payload.new.id)
      if (idx !== -1) {
        if (payload.new.status === 'pending') {
          orders.value[idx] = payload.new
        } else {
          // Retirer des commandes pending
          orders.value.splice(idx, 1)
          // Ajouter aux commandes complétées
          completedOrders.value.unshift(payload.new)
        }
      }
    } else if (payload.eventType === 'DELETE') {
      // Suppression
      orders.value = orders.value.filter(o => o.id !== payload.old.id)
      completedOrders.value = completedOrders.value.filter(o => o.id !== payload.old.id)
    }
  }

  // Crée une nouvelle commande
  async function addOrder(drinkerData, cocktailId, barId) {
    console.log('📝 addOrder called with:', { drinkerData, cocktailId, barId })
    
    if (!drinkerData?.id) {
      console.error('❌ Missing drinker ID:', drinkerData)
      return { success: false, error: 'Missing drinker data' }
    }
    if (!cocktailId) {
      console.error('❌ Missing cocktailId')
      return { success: false, error: 'Missing cocktail ID' }
    }
    if (!barId) {
      console.error('❌ Missing barId')
      return { success: false, error: 'Missing bar ID' }
    }

    try {
      console.log('🍸 Creating order via RPC function...')
      const { data, error } = await supabase
        .rpc('create_order_for_drinker', {
          p_bar_id: barId,
          p_drinker_id: drinkerData.id,
          p_cocktail_id: cocktailId,
        })

      if (error) {
        console.error('❌ RPC error:', error)
        throw error
      }

      if (!data || !data[0]?.success) {
        console.error('❌ RPC function failed:', data?.[0]?.message)
        throw new Error(data?.[0]?.message || 'Order creation failed')
      }

      console.log('✅ Order created:', data[0])

      // Ajouter à l'historique du drinker via RPC
      const { data: historyData, error: historyError } = await supabase
        .rpc('add_to_drink_history', {
          p_drinker_id: drinkerData.id,
          p_cocktail_id: cocktailId,
          p_bar_id: barId,
        })

      if (historyError) {
        console.warn('⚠️ History RPC error:', historyError)
      } else if (historyData && !historyData[0]?.success) {
        console.warn('⚠️ History RPC failed:', historyData[0]?.message)
      } else {
        console.log('✅ Drink added to history')
      }

      return { success: true, data }
    } catch (err) {
      console.error('❌ addOrder error:', err)
      return { success: false, error: err.message || 'Unknown error' }
    }
  }

  // Complète une commande (bartender)
  async function completeOrder(orderId) {
    if (!orderId) return

    try {
      // Récupérer l'ordre mis à jour avec le timestamp completed_at
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id, bar_id, drinker_id, cocktail_id, status, created_at, completed_at, drinker_profiles(pseudo)')
        .single()

      if (error) throw error

      // Retirer immédiatement de pending (pas d'attente Realtime)
      orders.value = orders.value.filter(o => o.id !== orderId)
      
      // Ajouter immédiatement aux complétées
      if (data) {
        completedOrders.value.unshift(data)
      }
      
      return { success: true }
    } catch (err) {
      console.error('❌ completeOrder:', err)
      return { success: false, error: err.message }
    }
  }

  // Annule une commande
  async function cancelOrder(orderId) {
    if (!orderId) return

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      // Retirer des deux listes (pending et completed)
      orders.value = orders.value.filter(o => o.id !== orderId)
      completedOrders.value = completedOrders.value.filter(o => o.id !== orderId)
      return { success: true }
    } catch (err) {
      console.error('❌ cancelOrder:', err)
      return { success: false, error: err.message }
    }
  }

  // Arrête l'écoute
  function stopOrdersListener() {
    if (subscription.value) {
      subscription.value.unsubscribe()
      subscription.value = null
    }
  }

  return {
    orders,
    completedOrders,
    pendingOrdersCount,
    completedOrdersCount,
    initOrdersListener,
    fetchPendingOrders,
    fetchCompletedOrders,
    addOrder,
    completeOrder,
    cancelOrder,
    stopOrdersListener,
  }
}
