<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--menucard">

      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          {{ isEditing ? '✏️ Modifier la carte' : '🗂️ Nouvelle carte' }}
        </h2>
        <button @click="$emit('close')" class="btn-icon btn-icon--close">
          <X :size="20" />
        </button>
      </div>

      <!-- Nom de la carte -->
      <div class="field-group">
        <label class="field-label">Nom de la carte</label>
        <input
          v-model="cardName"
          type="text"
          class="field-input"
          placeholder="Ex: Carte d'été, Carte du soir..."
          autofocus
        />
      </div>

      <!-- Recherche cocktails -->
      <div class="field-group">
        <label class="field-label">
          Cocktails sélectionnés
          <span class="modal-count-badge">{{ selectedIds.length }}</span>
        </label>
        <div class="search-wrapper">
          <Search :size="14" class="search-icon-sm" />
          <input
            v-model="searchTerm"
            type="text"
            class="field-input field-input--search"
            placeholder="Rechercher un cocktail..."
          />
        </div>
      </div>

      <!-- Liste cocktails -->
      <div class="cocktail-list">
        <!-- Sélectionnés en premier -->
        <div v-if="selectedCocktails.length" class="list-section">
          <p class="list-section-label">✓ Sélectionnés</p>
          <div
            v-for="c in selectedCocktails"
            :key="c.id"
            class="cocktail-row selected"
            @click="toggle(c.id)"
          >
            <div class="row-check checked">
              <Check :size="12" />
            </div>
            <div class="row-info">
              <span class="row-name">{{ c.name }}</span>
              <span class="row-meta">{{ c.base_spirit }} · {{ seasonIcon(c.season) }}</span>
            </div>
          </div>
        </div>

        <!-- Non sélectionnés -->
        <div v-if="unselectedFiltered.length" class="list-section">
          <p v-if="selectedCocktails.length" class="list-section-label">Tous les cocktails</p>
          <div
            v-for="c in unselectedFiltered"
            :key="c.id"
            class="cocktail-row"
            @click="toggle(c.id)"
          >
            <div class="row-check">
              <Check :size="12" class="opacity-0" />
            </div>
            <div class="row-info">
              <span class="row-name">{{ c.name }}</span>
              <span class="row-meta">{{ c.base_spirit }} · {{ seasonIcon(c.season) }}</span>
            </div>
          </div>
        </div>

        <p v-if="!selectedCocktails.length && !unselectedFiltered.length" class="empty-state">
          Aucun cocktail trouvé
        </p>
      </div>

      <!-- Footer actions -->
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-modal-secondary">Annuler</button>
        <button
          @click="save"
          :disabled="!cardName.trim() || saving"
          class="btn-modal-primary"
        >
          {{ saving ? 'Enregistrement...' : (isEditing ? 'Sauvegarder' : 'Créer la carte') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X, Search, Check } from 'lucide-vue-next'

const props = defineProps({
  card:      { type: Object, default: null },  // null = création
  cocktails: { type: Array,  default: () => [] },
})

const emit = defineEmits(['save', 'close'])

const isEditing  = computed(() => !!props.card)
const cardName   = ref(props.card?.name || '')
const selectedIds = ref([...(props.card?.cocktail_ids || [])])
const searchTerm = ref('')
const saving     = ref(false)

// Split cocktails : sélectionnés vs reste, les deux filtrés par searchTerm
const matchesSearch = c => {
  const s = searchTerm.value.toLowerCase().trim()
  if (!s) return true
  return c.name?.toLowerCase().includes(s) || c.base_spirit?.toLowerCase().includes(s)
}

const selectedCocktails = computed(() =>
  props.cocktails.filter(c => selectedIds.value.includes(c.id) && matchesSearch(c))
)

const unselectedFiltered = computed(() =>
  props.cocktails.filter(c => !selectedIds.value.includes(c.id) && matchesSearch(c))
)

function toggle(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function seasonIcon(season) {
  const icons = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️' }
  const s = Array.isArray(season) ? season : [season]
  return s.map(k => icons[k] || k).join(' ')
}

async function save() {
  if (!cardName.value.trim()) return
  saving.value = true
  emit('save', {
    id:           props.card?.id,
    name:         cardName.value.trim(),
    cocktail_ids: selectedIds.value,
  })
}
</script>
