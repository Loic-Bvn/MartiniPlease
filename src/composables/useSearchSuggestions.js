import { ref, computed } from 'vue'

export function useSearchSuggestions(cocktails) {
  const searchInput = ref('')
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
