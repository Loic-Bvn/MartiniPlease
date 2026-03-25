<template>
  <div class="add-ing-overlay" @click.self="$emit('close')">
    <div class="add-ing-content">

      <!-- Header -->
      <div class="add-ing-header">
        <h2 class="add-ing-title">
          <span class="add-ing-icon">{{ categoryIcon }}</span>
          Ajouter un ingrédient
        </h2>
        <button @click="$emit('close')" class="add-ing-close" aria-label="Fermer">
          <X :size="18" />
        </button>
      </div>

      <p class="add-ing-subtitle">Catégorie : <strong>{{ categoryLabel }}</strong></p>

      <!-- Champs -->
      <div class="add-ing-form">

        <!-- Nom -->
        <div class="add-ing-field">
          <label class="add-ing-label">Nom <span class="required">*</span></label>
          <input
            ref="nameInput"
            v-model="form.name"
            type="text"
            placeholder="ex : Hendrick's Gin"
            class="add-ing-input"
            @input="autoSlug"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- Type (slug) -->
        <div class="add-ing-field">
          <label class="add-ing-label">
            Type / identifiant
            <span class="add-ing-hint">généré automatiquement</span>
          </label>
          <input
            v-model="form.type"
            type="text"
            placeholder="ex : hendricks_gin"
            class="add-ing-input add-ing-input--mono"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- Family + ABV sur la même ligne -->
        <div class="add-ing-row">
          <div class="add-ing-field">
            <label class="add-ing-label">Famille</label>
            <input
              v-model="form.family"
              type="text"
              placeholder="ex : Gin"
              class="add-ing-input"
              @keyup.enter="handleSubmit"
            />
          </div>
          <div class="add-ing-field add-ing-field--abv">
            <label class="add-ing-label">ABV (%)</label>
            <input
              v-model.number="form.abv"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="41.4"
              class="add-ing-input"
              @keyup.enter="handleSubmit"
            />
          </div>
        </div>

        <!-- Disponible -->
        <label class="add-ing-checkbox-row">
          <input type="checkbox" v-model="form.available" class="add-ing-checkbox" />
          <span>Marquer comme disponible dans mon bar</span>
        </label>

        <!-- Erreur -->
        <p v-if="error" class="add-ing-error">{{ error }}</p>
      </div>

      <!-- Actions -->
      <div class="add-ing-actions">
        <button @click="$emit('close')" class="add-ing-btn-cancel">Annuler</button>
        <button
          @click="handleSubmit"
          class="add-ing-btn-submit"
          :disabled="!form.name.trim() || saving"
        >
          <Loader2 v-if="saving" :size="14" class="spin" />
          <Plus v-else :size="14" />
          {{ saving ? 'Ajout…' : 'Ajouter' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Plus, Loader2 } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'

const props = defineProps({
  categoryKey:   { type: String, required: true },
  categoryLabel: { type: String, required: true },
  categoryIcon:  { type: String, default: '📦' },
})

const emit = defineEmits(['close', 'added'])

const { addIngredient } = useInventory()

const nameInput = ref(null)
const saving    = ref(false)
const error     = ref('')

const form = ref({
  name:      '',
  type:      '',
  family:    '',
  abv:       null,
  available: true,
})

onMounted(() => nameInput.value?.focus())

function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // retire les accents
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function autoSlug() {
  form.value.type = toSlug(form.value.name)
}

async function handleSubmit() {
  error.value = ''
  const name = form.value.name.trim()
  if (!name) { error.value = 'Le nom est obligatoire.'; return }

  const type = form.value.type.trim() || toSlug(name)
  saving.value = true
  try {
    await addIngredient({
      name,
      type,
      category:  props.categoryKey,
      family:    form.value.family.trim() || null,
      abv:       form.value.abv ?? null,
      available: form.value.available,
    })
    emit('added')
    emit('close')
  } catch (err) {
    error.value = err?.message?.includes('duplicate')
      ? 'Un ingrédient avec cet identifiant existe déjà.'
      : 'Erreur lors de l\'ajout. Vérifie les champs.'
  } finally {
    saving.value = false
  }
}
</script>