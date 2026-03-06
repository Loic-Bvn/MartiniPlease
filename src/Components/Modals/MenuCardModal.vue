<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">

      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          {{ isEditing ? '✏️ Modifier la carte' : '🗂️ Nouvelle carte' }}
        </h2>
        <button @click="$emit('close')" class="btn-icon text-gray-400 hover:text-gray-600">
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
          <span class="count-badge">{{ selectedIds.length }}</span>
        </label>
        <div class="search-wrapper">
          <Search :size="14" class="search-icon-sm" />
          <input
            v-model="searchTerm"
            type="text"
            class="field-input pl-7"
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
        <button @click="$emit('close')" class="btn-secondary">Annuler</button>
        <button
          @click="save"
          :disabled="!cardName.trim() || saving"
          class="btn-primary"
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

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.field-group {
  padding: 1rem 1.5rem 0;
  flex-shrink: 0;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.field-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #f59e0b;
}

.search-wrapper {
  position: relative;
}

.search-icon-sm {
  position: absolute;
  left: 0.55rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.pl-7 { padding-left: 1.75rem; }

.count-badge {
  background: #f59e0b;
  color: white;
  border-radius: 9999px;
  padding: 0.05rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Cocktail list */
.cocktail-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.list-section {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
}

.list-section-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  padding-left: 0.25rem;
}

.cocktail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.1s;
  border: 1px solid transparent;
}

.cocktail-row:hover {
  background: #fef9ee;
}

.cocktail-row.selected {
  background: #fffbeb;
  border-color: #fde68a;
}

.row-check {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1.5px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.row-check.checked {
  background: #f59e0b;
  border-color: #f59e0b;
}

.row-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.row-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-meta {
  font-size: 0.75rem;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 2rem 0;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.btn-primary {
  padding: 0.55rem 1.25rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #d97706; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  padding: 0.55rem 1.25rem;
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary:hover { background: #f9fafb; }
</style>