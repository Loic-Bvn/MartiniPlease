<template>
  <Teleport to="body">
    <div class="add-ing-overlay" @click.self="$emit('close')">
      <div ref="dialogRef" class="add-ing-content" role="dialog" aria-modal="true" aria-labelledby="add-ing-title">

      <!-- Header -->
      <div class="add-ing-header">
        <h2 id="add-ing-title" class="add-ing-title">
          <component :is="categoryIcon || Package" :size="18" class="add-ing-icon" />
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
            placeholder="ex : Tequila Reposado"
            class="add-ing-input"
            @input="autoSlug"
            @keyup.enter="handleSubmit"
          />
        </div>

        <!-- Family + ABV sur la même ligne -->
        <div class="add-ing-row">
          <div v-if="familyOptions.length" class="add-ing-field">
            <label class="add-ing-label">
              Famille
              <span class="add-ing-hint">pour grouper tes bouteilles</span>
            </label>
            <select v-model="form.family" class="add-ing-input">
              <option value="">—</option>
              <option v-for="opt in familyOptions" :key="opt.key" :value="opt.key">
                {{ opt.label }}
              </option>
            </select>
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
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Plus, Loader2, Package } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import { useIngredientFamilies } from '@/composables/useIngredientFamilies'
import { useModalAccessibility } from '@/composables/useModalAccessibility'
import { toIngredientSlug } from '@/utils/ingredientSlug'

const props = defineProps({
  categoryKey:   { type: String, required: true },
  categoryLabel: { type: String, required: true },
  categoryIcon:  { type: [Object, Function], default: null },
  locale:        { type: String, default: 'fr' },
})

// Famille n'a de sens que pour spirits/licors/modifiers/bitters — vide
// (donc champ masqué) pour juices/syrups/mixers/garnish/others.
const { getFamilyOptions, fetchIngredientFamilies } = useIngredientFamilies()
const familyOptions = computed(() => getFamilyOptions(props.categoryKey, props.locale))

const emit = defineEmits(['close', 'added'])

const { addIngredient } = useInventory()

onMounted(() => {
  fetchIngredientFamilies().catch(err => {
    console.error('❌ Impossible de charger les familles d’ingrédients:', err)
  })
})

const nameInput = ref(null)
const dialogRef = ref(null)
const saving    = ref(false)
const error     = ref('')
useModalAccessibility(dialogRef, () => emit('close'), true, nameInput)

const form = ref({
  name:      '',
  type:      '',
  family:    '',
  abv:       null,
  available: true,
})

function autoSlug() {
  form.value.type = toIngredientSlug(form.value.name)
}

async function handleSubmit() {
  error.value = ''
  const name = form.value.name.trim()
  if (!name) { error.value = 'Le nom est obligatoire.'; return }

  const type = toIngredientSlug(form.value.type || name)
  if (!type) {
    error.value = 'Le nom est invalide pour créer un identifiant unique.'
    return
  }

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
    const message = String(err?.message || '')
    console.error('❌ Erreur ajout ingrédient:', err)

    if (message.includes('duplicate')) {
      error.value = 'Un ingrédient avec ce nom existe déjà dans ce bar.'
      return
    }

    if (message.includes('barId') || message.includes('empty') || message.includes('slug')) {
      error.value = 'Les données envoyées sont incomplètes.'
      return
    }

    error.value = 'Erreur lors de l’ajout. Vérifie les champs.'
  } finally {
    saving.value = false
  }
}
</script>