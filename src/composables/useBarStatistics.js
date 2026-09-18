import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

export function useBarStatistics() {
  const { bar, bars } = useAuth()

  // Fonction pour récupérer les stats d'un bar — lues directement depuis
  // bars.statistics (colonne jsonb maintenue par trigger DB, voir migration
  // 20260812090000_bar_statistics.sql), déjà en mémoire via useAuth.bar/bars.
  // Donc "immédiat" : pas de requête réseau dans le cas normal.
  async function getBarStats(barId) {
    const known = (bar.value?.id === barId ? bar.value : null)
                  ?? bars.value.find(b => b.id === barId)

    if (known?.statistics) {
      return {
        cocktails: known.statistics.cocktails ?? 0,
        cards:     known.statistics.cards ?? 0,
      }
    }

    // Filet de sécurité : bar créé avant la migration / statistics pas
    // encore backfillée. On recalcule à la volée comme avant.
    try {
      const { count: cocktailCount, error: cocktailError } = await supabase
        .from('bar_cocktails')
        .select('*', { count: 'exact', head: true })
        .eq('bar_id', barId)
      if (cocktailError) throw cocktailError

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
