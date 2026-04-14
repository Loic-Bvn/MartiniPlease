import { computed } from 'vue'
import { supabase } from '@/lib/supabase'

export function useBarStatistics() {
  // Fonction pour récupérer les stats d'un bar
  async function getBarStats(barId) {
    try {
      // Nombre de cocktails
      const { count: cocktailCount, error: cocktailError } = await supabase
        .from('cocktails')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId)

      if (cocktailError) throw cocktailError

      // Nombre de cartes de menu
      const { count: cardCount, error: cardError } = await supabase
        .from('menu_cards')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId)

      if (cardError) throw cardError

      return {
        cocktails: cocktailCount || 0,
        cards: cardCount || 0,
      }
    } catch (err) {
      console.error('Error fetching bar stats:', err)
      return { cocktails: 0, cards: 0 }
    }
  }

  return {
    getBarStats,
  }
}
