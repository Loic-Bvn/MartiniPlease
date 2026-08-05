// composables/useBarFeatures.js
// Feature toggles par bar (Commander / Partager / futures features).
// Stockées dans bars.features (jsonb), éditables par le bartender,
// lues par le front drinker pour afficher/masquer les actions.

import { computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

// Défauts si une clé n'existe pas encore en base (bar créé avant la migration,
// ou nouvelle feature ajoutée plus tard sans backfill).
const FEATURE_DEFAULTS = {
  order: true,
  showPrices: false,
}

// Libellés pour l'UI de settings du bartender.
export const FEATURE_LABELS = {
  order: 'Autoriser les commandes',
  showPrices: 'Afficher les prix sur les cartes',
}

export function useBarFeatures() {
  const { bar, session } = useAuth()
  const { toastError } = useToast()

  const features = computed(() => ({
    ...FEATURE_DEFAULTS,
    ...(bar.value?.features ?? {}),
  }))

  function isFeatureEnabled(key) {
    return features.value[key] ?? FEATURE_DEFAULTS[key] ?? false
  }

  /**
   * Active/désactive une feature pour le bar courant.
   * @param {string} key - ex: 'order', 'showPrices'
   * @param {boolean} value
   */
  async function setFeature(key, value) {
    if (!bar.value || !session.value) return { success: false }

    const nextFeatures = { ...features.value, [key]: value }

    const { error } = await supabase
      .from('bars')
      .update({ features: nextFeatures })
      .eq('id', bar.value.id)
      .eq('owner_id', session.value.user.id)

    if (error) {
      console.error('❌ setFeature:', error)
      toastError(error.message)
      return { success: false, error: error.message }
    }

    // Mutation locale pour refléter le changement immédiatement dans l'UI
    bar.value = { ...bar.value, features: nextFeatures }
    return { success: true }
  }

  return {
    features,
    isFeatureEnabled,
    setFeature,
  }
}
