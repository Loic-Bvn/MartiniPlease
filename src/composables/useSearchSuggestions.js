import { ref, computed, customRef } from 'vue'

function debouncedRef(initialValue, delay = 200) {
  let timeout
  let _value = initialValue
  return customRef((track, trigger) => ({
    get() { track(); return _value },
    set(newVal) {
      clearTimeout(timeout)
      timeout = setTimeout(() => { _value = newVal; trigger() }, delay)
    }
  }))
}

export function useSearchSuggestions(cocktails) {
  const searchInput   = debouncedRef('', 200)
  const showSuggestions = ref(false)

  const suggestions = computed(() => {
    const query = searchInput.value.toLowerCase().trim()
    if (!query || query.length < 1) return []

    const filtered = cocktails.value.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.recipe && c.recipe.some(ing => ing.Type?.toLowerCase().includes(query)))
    )

    return filtered.slice(0, 8).map(c => ({
      type: 'cocktail',
      name: c.name,
      id: c.id,
    }))
  })

  function selectSuggestion(suggestion) {
    searchInput.value = suggestion.name
    showSuggestions.value = false
  }

  function clearSearch() {
    searchInput.value = ''
    showSuggestions.value = false
  }

  return {
    searchInput,
    showSuggestions,
    suggestions,
    selectSuggestion,
    clearSearch,
  }
}