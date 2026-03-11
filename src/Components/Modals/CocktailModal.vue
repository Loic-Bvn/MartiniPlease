<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--cocktail">

      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          {{ isNew ? '✨ Nouveau cocktail' : '✏️ Modifier le cocktail' }}
        </h2>
        <button @click="$emit('close')" class="modal-close-btn">
          <X :size="20" />
        </button>
      </div>

      <!-- Contenu scrollable -->
      <div class="modal-body">

        <!-- Section : Infos générales -->
        <section class="form-section">
          <h3 class="form-section-title">Infos générales</h3>

          <div class="form-field">
            <label class="form-label">Nom *</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="Ex: Old Fashioned" />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Spirit de base</label>
              <select v-model="form.base_spirit" @change="autoFillCategory" class="form-input">
                <option value="">-- Choisir --</option>
                <optgroup v-for="cat in categories" :key="cat.key" :label="cat.label">
                  <option v-for="spirit in cat.spirits" :key="spirit.key" :value="spirit.key">
                    {{ spirit.label }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Catégorie</label>
              <select v-model="form.category" class="form-input">
                <option value="">-- Choisir --</option>
                <option v-for="cat in categories" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Verre</label>
              <select v-model="form.glass" class="form-input">
                <option value="">-- Choisir --</option>
                <option value="rocks">Rocks (Old Fashioned)</option>
                <option value="coupe">Coupe</option>
                <option value="martini">Martini / Cocktail</option>
                <option value="highball">Highball</option>
                <option value="collins">Collins</option>
                <option value="nick_nora">Nick & Nora</option>
                <option value="champagne_flute">Flûte à Champagne</option>
                <option value="wine">Verre à vin</option>
                <option value="shot">Shot</option>
                <option value="tiki">Tiki</option>
                <option value="hurricane">Hurricane</option>
                <option value="copper_mug">Copper Mug</option>
                <option value="snifter">Snifter / Ballon</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Méthode</label>
              <select v-model="form.method" class="form-input">
                <option value="">-- Choisir --</option>
                <option value="stirred">Stirred (remué)</option>
                <option value="shaken">Shaken (secoué)</option>
                <option value="built">Built (construit)</option>
                <option value="blended">Blended (mixé)</option>
                <option value="thrown">Thrown (versé en hauteur)</option>
                <option value="rolled">Rolled</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Difficulté</label>
              <select v-model="form.difficulty" class="form-input">
                <option value="">--</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">ABV (%)</label>
              <input v-model.number="form.abv" type="number" class="form-input" placeholder="Ex: 32" />
            </div>
          </div>
        </section>

        <!-- Section : Saisons -->
        <section class="form-section">
          <h3 class="form-section-title">Saisons</h3>
          <div class="chips-container">
            <button
              v-for="s in seasonOptions"
              :key="s.key"
              type="button"
              @click="toggleSeason(s.key)"
              :class="['chip', { active: form.season.includes(s.key) }]"
            >
              {{ s.icon }} {{ s.label }}
            </button>
          </div>
        </section>

        <!-- Section : Description & Image -->
        <section class="form-section">
          <h3 class="form-section-title">Description & Image</h3>
          <div class="form-field">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="Notes sur le cocktail..."></textarea>
          </div>
          <div class="form-field">
            <label class="form-label">Image (URL)</label>
            <input v-model="form.image" type="text" class="form-input" placeholder="https://..." />
          </div>
        </section>

        <!-- Section : Recette -->
        <section class="form-section">
          <div class="form-section-header">
            <h3 class="form-section-title">Recette</h3>
            <button type="button" @click="addIngredient" class="btn-add-ingredient">
              <Plus :size="14" /> Ajouter
            </button>
          </div>

          <!-- En-têtes colonnes -->
          <div class="recipe-columns-header">
            <span>Ingrédient</span>
            <span>Type</span>
            <span>Oz</span>
            <span></span>
          </div>

          <div class="recipe-rows">
            <div v-if="form.recipe.length === 0" class="recipe-empty">
              Aucun ingrédient — cliquez sur Ajouter
            </div>
            <div
              v-for="(ing, idx) in form.recipe"
              :key="idx"
              class="recipe-row"
            >
              <input v-model="ing.Ingredient" type="text" class="form-input" placeholder="Ex: Bourbon" />
              <select v-model="ing.Type" class="form-input">
                <option value="garnish">🍋 Garniture</option>
                <optgroup
                  v-for="(ings, catKey) in ingredientsByCategory"
                  :key="catKey"
                  :label="categoryLabels[catKey] || catKey"
                >
                  <option v-for="i in ings" :key="i.type" :value="i.type">
                    {{ i.name }}
                  </option>
                </optgroup>
              </select>
              <input v-model="ing.Oz" type="text" class="form-input" placeholder="2" />
              <button type="button" @click="removeIngredient(idx)" class="btn-remove-ingredient">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>
        </section>

      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-modal-secondary">Annuler</button>
        <button @click="handleSave" class="btn-modal-primary" :disabled="!form.name.trim()">
          {{ isNew ? 'Créer' : 'Enregistrer' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X, Trash2, Plus } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'

const props = defineProps({ cocktail: Object })
const emit = defineEmits(['save', 'close'])

// Récupérer les ingrédients depuis Supabase pour le select Type
const { ingredients } = useInventory()

// Ingrédients groupés par catégorie pour le select Type
const ingredientsByCategory = computed(() => {
  const groups = {}
  ingredients.value.forEach(ing => {
    if (!groups[ing.category]) groups[ing.category] = []
    groups[ing.category].push(ing)
  })
  return groups
})

const categoryLabels = {
  spirits:   '🥃 Spiritueux',
  liqueurs:  '🍷 Liqueurs',
  modifiers: '🍸 Modificateurs',
  juices:    '🍊 Jus',
  syrups:    '🍯 Sirops',
  bitters:   '💧 Bitters',
  mixers:    '🥤 Mixers',
  others:    '📦 Autres',
}

const isNew = computed(() => !props.cocktail?.id)

// Catégories avec leurs spirits — utilisé pour le select Spirit de base
// et pour auto-remplir la Catégorie
const categories = [
  {
    key: 'Whiskey_Family', label: '🥃 Whiskey',
    spirits: [
      { key: 'bourbon', label: 'Bourbon' },
      { key: 'rye',     label: 'Rye' },
      { key: 'scotch',  label: 'Scotch' },
      { key: 'whiskey', label: 'Whiskey (autre)' },
    ]
  },
  {
    key: 'Rum_Family', label: '🍹 Rhum',
    spirits: [
      { key: 'rum',     label: 'Rum' },
      { key: 'cachaca', label: 'Cachaça' },
    ]
  },
  {
    key: 'Agave_Family', label: '🌵 Agave',
    spirits: [
      { key: 'tequila', label: 'Tequila' },
      { key: 'mezcal',  label: 'Mezcal' },
    ]
  },
  {
    key: 'Gin', label: '🌿 Gin',
    spirits: [
      { key: 'gin', label: 'Gin' },
    ]
  },
  {
    key: 'Vodka', label: '❄️ Vodka',
    spirits: [
      { key: 'vodka', label: 'Vodka' },
    ]
  },
  {
    key: 'Brandy_Family', label: '🍇 Brandy',
    spirits: [
      { key: 'cognac',   label: 'Cognac' },
      { key: 'brandy',   label: 'Brandy' },
      { key: 'calvados', label: 'Calvados' },
    ]
  },
  {
    key: 'Pisco', label: '🫙 Pisco',
    spirits: [
      { key: 'pisco', label: 'Pisco' },
    ]
  },
  {
    key: 'Absinthe', label: '🌱 Absinthe',
    spirits: [
      { key: 'absinthe', label: 'Absinthe' },
    ]
  },
  {
    key: 'Other', label: '✨ Autre',
    spirits: []
  },
]

// Quand on choisit un spirit, on auto-remplit la catégorie
function autoFillCategory() {
  const spirit = form.value.base_spirit
  if (!spirit) return
  const cat = categories.find(c => c.spirits.some(s => s.key === spirit))
  if (cat) form.value.category = cat.key
}

const seasonOptions = [
  { key: 'spring', icon: '🌸', label: 'Printemps' },
  { key: 'summer', icon: '☀️', label: 'Été' },
  { key: 'fall',   icon: '🍂', label: 'Automne' },
  { key: 'winter', icon: '❄️', label: 'Hiver' },
]

const form = ref({
  id:          props.cocktail?.id          ?? null,
  name:        props.cocktail?.name        ?? '',
  base_spirit: props.cocktail?.base_spirit ?? '',
  category:    props.cocktail?.category    ?? '',
  glass:       props.cocktail?.glass       ?? '',
  method:      props.cocktail?.method      ?? '',
  difficulty:  props.cocktail?.difficulty  ?? '',
  abv:         props.cocktail?.abv         ?? null,
  description: props.cocktail?.description ?? '',
  image:       props.cocktail?.image       ?? '',
  season:      [...(props.cocktail?.season  ?? [])],
  profile:     [...(props.cocktail?.profile ?? [])],
  tags:        [...(props.cocktail?.tags    ?? [])],
  // Filtrer les lignes sans ingrédient au chargement
  recipe: (props.cocktail?.recipe ?? [])
    .filter(i => i.Ingredient?.trim())
    .map(i => ({ Ingredient: i.Ingredient, Type: i.Type ?? '', Oz: i.Oz ?? '' })),
})

function toggleSeason(key) {
  const idx = form.value.season.indexOf(key)
  if (idx > -1) form.value.season.splice(idx, 1)
  else form.value.season.push(key)
}

function addIngredient() {
  form.value.recipe.push({ Ingredient: '', Type: '', Oz: '' })
}

function removeIngredient(idx) {
  form.value.recipe.splice(idx, 1)
}

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
}
</script>
