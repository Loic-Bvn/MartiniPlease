import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

// Cache global pour éviter de re-fetch le même bar partout
const publicBarsCache = new Map()

export function useBarFeatures(publicBarId = null) {

  const { bar, session } = useAuth()
  const { toastError } = useToast()

  const loadedBar = ref(null)
  const loading = ref(false)

  /**
   * Le bar utilisé :
   * - si publicBarId fourni => menu public
   * - sinon => bartender connecté
   */
  const currentBar = computed(() => {

    if (publicBarId) {
      // Si le bartender consulte son propre bar (CocktailCard avec :bar-id),
      // on privilégie l'état live du singleton useAuth plutôt que le cache
      // public (publicBarsCache), qui n'est jamais invalidé par setFeature().
      // Sans ça, un toggle de feature (ex: showPrices) ne se reflète qu'après
      // un rechargement complet de la page.
      if (bar.value?.id === publicBarId) {
        return bar.value
      }
      return loadedBar.value
    }

    return bar.value
  })

  const features = computed(() => {
    return currentBar.value?.features ?? {}
  })

  async function fetchPublicBar(id) {

    if (!id) return

    // Cache
    if (publicBarsCache.has(id)) {
      loadedBar.value = publicBarsCache.get(id)
      return
    }


    loading.value = true

    const { data, error } = await supabase
      .from('bars')
      .select('id, features')
      .eq('id', id)
      .single()

    loading.value = false

    if (error) {
      console.error('❌ fetchPublicBar:', error)
      toastError(error.message)
      return
    }

    publicBarsCache.set(id, data)
    loadedBar.value = data
  }

  // Recharge quand activeBarId change
  watch(
    () => publicBarId,
    (id) => {
      if (id) {
        fetchPublicBar(id)
      }
    },
    {
      immediate: true
    }
  )

  function getFeature(key) {
    return features.value[key] === true
  }

  function isFeatureEnabled(key) {
    return features.value[key] === true
  }

  /**
   * Modification uniquement possible côté bartender
   */
  async function setFeature(key, value) {

    if (!bar.value || !session.value) {
      return {
        success: false,
        error: 'Non authentifié'
      }
    }

    const nextFeatures = {
      ...features.value,
      [key]: value
    }

    const { error } = await supabase
      .from('bars')
      .update({
        features: nextFeatures
      })
      .eq('id', bar.value.id)
      .eq('owner_id', session.value.user.id)

    if (error) {
      console.error('❌ setFeature:', error)
      toastError(error.message)
      return {
        success: false,
        error: error.message
      }
    }

    // Mise à jour locale bartender
    bar.value = {
      ...bar.value,
      features: nextFeatures
    }

    return {
      success: true
    }
  }

  return {
    currentBar,
    features,
    loading,
    getFeature,
    isFeatureEnabled,
    setFeature,
    fetchPublicBar,
  }
}