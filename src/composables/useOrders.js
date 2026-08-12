// composables/useOrders.js
// Gère les commandes en attente des drinkers pour le bartender.
// Table Supabase : orders (id, bar_id, drinker_id, cocktail_id, status, created_at, completed_at)
// Realtime : écoute les nouvelles commandes via un channel Supabase.
//
// ⚠️  SINGLETON : `orders`, `completedOrders` et `subscription` sont au niveau
//     module → partagés entre tous les appels à useOrders().
//     Conséquence : un seul listener actif à la fois, ce qui est exactement
//     le comportement voulu (un bartender = un bar = un channel).
//     Si tu avais besoin d'écouter plusieurs bars simultanément, déplace ces
//     ref à l'intérieur de la fonction et gère plusieurs subscriptions.

import { ref, computed } from 'vue'
import { supabase }      from '@/lib/supabase'
import { useToast }      from '@/composables/useToast'
import { track }         from '@/lib/analytics'

// ── État singleton ────────────────────────────────────────────────────────────
const orders           = ref([])
const completedOrders  = ref([])
const subscription     = ref(null)

export function useOrders() {
  const { toastError } = useToast()

  const pendingOrdersCount   = computed(() => orders.value.filter(o => o.status === 'pending').length)
  const completedOrdersCount = computed(() => completedOrders.value.length)

  // ── Initialisation du listener temps réel ──────────────────────────────────

  async function initOrdersListener(barId) {
    if (!barId) return

    await Promise.all([
      fetchPendingOrders(barId),
      fetchCompletedOrders(barId),
    ])

    // Éviter les subscriptions dupliquées
    if (subscription.value) {
      subscription.value.unsubscribe()
    }

    subscription.value = supabase
      .channel(`orders:bar_id=eq.${barId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `bar_id=eq.${barId}` },
        (payload) => handleOrderChange(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Listening to orders for bar:', barId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Orders channel error for bar:', barId)
          toastError('Connexion temps réel perdue. Recharge la page.')
        }
      })
  }

  // ── Fetch ───────────────────────────────────────────────────────────────────

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
      toastError(`Erreur chargement commandes : ${error.message}`)
      return
    }

    orders.value = data || []
  }

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
      toastError(`Erreur chargement historique : ${error.message}`)
      return
    }

    completedOrders.value = data || []
  }

  // ── Gestion des événements Realtime ─────────────────────────────────────────

  async function handleOrderChange(payload) {
    if (payload.eventType === 'INSERT') {
      // payload.new ne contient pas le join drinker_profiles — on fetch l'ordre complet
      const { data } = await supabase
        .from('orders')
        .select('id, bar_id, drinker_id, cocktail_id, status, created_at, completed_at, drinker_profiles(pseudo)')
        .eq('id', payload.new.id)
        .single()
      if (data) orders.value.push(data)
      else orders.value.push(payload.new) // fallback sans pseudo

    } else if (payload.eventType === 'UPDATE') {
      const idx = orders.value.findIndex(o => o.id === payload.new.id)
      if (idx !== -1) {
        if (payload.new.status === 'pending') {
          orders.value[idx] = payload.new
        } else {
          orders.value.splice(idx, 1)
          completedOrders.value.unshift(payload.new)
        }
      }

    } else if (payload.eventType === 'DELETE') {
      orders.value          = orders.value.filter(o => o.id !== payload.old.id)
      completedOrders.value = completedOrders.value.filter(o => o.id !== payload.old.id)
    }
  }

  // ── Création d'une commande ─────────────────────────────────────────────────

  async function addOrder(drinkerData, cocktailId, barId) {
    if (!drinkerData?.id)  return { success: false, error: 'Missing drinker data' }
    if (!cocktailId)       return { success: false, error: 'Missing cocktail ID'  }
    if (!barId)            return { success: false, error: 'Missing bar ID'       }

    try {
      const { data, error } = await supabase.rpc('create_order_for_drinker', {
        p_bar_id:      barId,
        p_drinker_id:  drinkerData.id,
        p_cocktail_id: cocktailId,
      })

      if (error) throw error

      if (!data?.[0]?.success) {
        throw new Error(data?.[0]?.message || 'Order creation failed')
      }

      // Historique drinker
      const { data: histData, error: histError } = await supabase.rpc('add_to_drink_history', {
        p_drinker_id:  drinkerData.id,
        p_cocktail_id: cocktailId,
        p_bar_id:      barId,
      })

      if (histError) {
        console.warn('⚠️ History RPC error:', histError)
      } else if (histData && !histData[0]?.success) {
        console.warn('⚠️ History RPC failed:', histData[0]?.message)
      }

      track('order_placed', { barId })

      return { success: true, data }
    } catch (err) {
      console.error('❌ addOrder error:', err)
      toastError(`Impossible de passer la commande : ${err.message}`)
      return { success: false, error: err.message || 'Unknown error' }
    }
  }

  // ── Validation d'une commande ───────────────────────────────────────────────

  async function completeOrder(orderId) {
    if (!orderId) return { success: false }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id, bar_id, drinker_id, cocktail_id, status, created_at, completed_at, drinker_profiles(pseudo)')
        .single()

      if (error) throw error

      // Mise à jour locale immédiate (sans attendre Realtime)
      orders.value = orders.value.filter(o => o.id !== orderId)
      if (data) completedOrders.value.unshift(data)

      return { success: true }
    } catch (err) {
      console.error('❌ completeOrder:', err)
      toastError(`Erreur validation commande : ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  // ── Annulation d'une commande ───────────────────────────────────────────────

  async function cancelOrder(orderId) {
    if (!orderId) return { success: false }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      orders.value          = orders.value.filter(o => o.id !== orderId)
      completedOrders.value = completedOrders.value.filter(o => o.id !== orderId)
      return { success: true }
    } catch (err) {
      console.error('❌ cancelOrder:', err)
      toastError(`Erreur annulation commande : ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  // ── Arrêt du listener ───────────────────────────────────────────────────────

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