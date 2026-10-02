// composables/usePreparations.js
// Compteur de cocktails préparés (côté bartender uniquement).
// Table Supabase : preparation_log (id, bar_id, cocktail_id, card_id, quantity, prepared_at)
//
// ⚠️  Indépendant de useOrders : une commande numérique d'un drinker ne
//     compte jamais ici. Seul le bouton "préparé" du bartender écrit dans
//     preparation_log.
//
// ⚠️  SINGLETON : `lastEntry` est au niveau module → partagé entre la card,
//     la modal de détail et le toast d'annulation (PreparationUndoToast).

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/composables/useToast'

const UNDO_DELAY_MS = 6000

// Dernière préparation enregistrée, annulable pendant UNDO_DELAY_MS.
// { id, cocktailName, quantity } | null
const lastEntry = ref(null)
let _undoTimer = null

export function usePreparations() {
  const { toastError } = useToast()

  function clearUndo() {
    if (_undoTimer) clearTimeout(_undoTimer)
    _undoTimer = null
    lastEntry.value = null
  }

  /**
   * Enregistre une préparation.
   * @param {{ barId: string, cocktailId: string, cocktailName?: string,
   *           cardId?: string|null, quantity?: number }} p
   */
  async function logPreparation({ barId, cocktailId, cocktailName = '', cardId = null, quantity = 1 }) {
    if (!barId || !cocktailId) return { success: false, error: 'Missing bar or cocktail' }

    const qty = Math.min(50, Math.max(1, Math.floor(Number(quantity)) || 1))

    try {
      const { data, error } = await supabase
        .from('preparation_log')
        .insert({ bar_id: barId, cocktail_id: cocktailId, card_id: cardId, quantity: qty })
        .select('id')
        .single()

      if (error) throw error

      if (_undoTimer) clearTimeout(_undoTimer)
      lastEntry.value = { id: data.id, cocktailName, quantity: qty }
      _undoTimer = setTimeout(clearUndo, UNDO_DELAY_MS)

      return { success: true, id: data.id }
    } catch (err) {
      console.error('❌ logPreparation:', err)
      toastError(`Impossible d'enregistrer la préparation : ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  /** Annule la dernière préparation (bouton "Annuler" du toast). */
  async function undoLast() {
    const entry = lastEntry.value
    if (!entry) return { success: false }
    clearUndo()
    return deleteEntry(entry.id)
  }

  async function deleteEntry(id) {
    if (!id) return { success: false }
    try {
      const { error } = await supabase.from('preparation_log').delete().eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('❌ deleteEntry:', err)
      toastError(`Impossible de supprimer l'entrée : ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  /**
   * Stats sur une période (RPC get_preparation_stats).
   * @param {string} barId
  * @param {{ from?: Date|null, to?: Date|null, cardId?: string|null, uncardedOnly?: boolean, cocktailId?: string|null, profile?: string|null, baseSpirits?: string[]|null }} opts
   * @returns {Promise<{ total: number, by_cocktail: Array, by_card: Array }>}
   */
  async function getStats(barId, { from = null, to = null, cardId = null, uncardedOnly = false, cocktailId = null, profile = null, baseSpirits = null } = {}) {
    const empty = { total: 0, by_cocktail: [], by_card: [] }
    if (!barId) return empty
    try {
      const { data, error } = await supabase.rpc('get_preparation_stats', {
        p_bar_id:        barId,
        p_from:          from ? from.toISOString() : null,
        p_to:            to   ? to.toISOString()   : null,
        p_card_id:       cardId,
        p_uncarded_only: uncardedOnly,
        p_cocktail_id:   cocktailId,
        p_profile:       profile,
        p_base_spirits:  baseSpirits,
      })
      if (error) throw error
      return { ...empty, ...(data || {}) }
    } catch (err) {
      console.error('❌ get_preparation_stats:', err)
      toastError(`Erreur chargement statistiques : ${err.message}`)
      return empty
    }
  }

  /** Dernières entrées (pour corriger une erreur au-delà du délai d'annulation). */
  async function getRecent(barId, limit = 8) {
    if (!barId) return []
    try {
      const { data, error } = await supabase
        .from('preparation_log')
        .select('id, quantity, prepared_at, card_id, bar_cocktails(name)')
        .eq('bar_id', barId)
        .order('prepared_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ getRecent preparations:', err)
      return []
    }
  }

  return { lastEntry, logPreparation, undoLast, deleteEntry, getStats, getRecent }
}