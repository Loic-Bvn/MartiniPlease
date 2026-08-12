// composables/useTrends.js
// Tendances cocktails (commandes + favoris) sur une fenêtre configurable.
// Agrégation faite côté DB (RPC get_cocktail_trends), voir migration
// 20260812100000_cocktail_trends.sql.

import { supabase } from '@/lib/supabase'

export function useTrends() {
  // days = null → depuis toujours
  async function getTrends(barId, { days = 7, limit = 10 } = {}) {
    try {
      const { data, error } = await supabase.rpc('get_cocktail_trends', {
        p_bar_id: barId,
        p_days: days,
        p_limit: limit,
      })
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ Erreur get_cocktail_trends:', err)
      return []
    }
  }

  return { getTrends }
}
