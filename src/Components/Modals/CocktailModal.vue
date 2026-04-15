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

        <!-- ── Section : Infos générales ── -->
        <section class="form-section">
          <h3 class="form-section-title">Infos générales</h3>

          <div class="form-field">
            <label class="form-label">Nom <span class="form-required">*</span></label>
            <input v-model="form.name" type="text" class="form-input" placeholder="Ex: Old Fashioned" autofocus />
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
                <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Verre</label>
              <select v-model="form.glass" class="form-input">
                <option value="">-- Choisir --</option>
                <option v-for="glass in glassOptions" :key="glass.value" :value="glass.value">
                  {{ glass.label }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Méthode</label>
              <select v-model="form.method" class="form-input">
                <option value="">-- Choisir --</option>
                <option v-for="method in methodOptions" :key="method.value" :value="method.value">
                  {{ method.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Difficulté</label>
              <select v-model="form.difficulty" class="form-input">
                <option value="">--</option>
                <option value="easy">⭐ Easy</option>
                <option value="medium">⭐⭐ Medium</option>
                <option value="hard">⭐⭐⭐ Hard</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">ABV (%)</label>
              <input v-model.number="form.abv" type="number" min="0" max="100" step="0.5" class="form-input" placeholder="Ex: 32" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Createur</label>
              <input v-model="form.creator" type="text" class="form-input" placeholder="Ex: John Doe" />
            </div>
            <div class="form-field">
              <label class="form-label">Style de cocktail</label>
              <input v-model="form.cocktail_style" type="text" class="form-input" placeholder="Ex: Classic, Tiki, etc." />
            </div>
          </div>
        </section>

        <!-- ── Section : Profil gustatif ── -->
        <section class="form-section">
          <h3 class="form-section-title">Profil gustatif</h3>
          <div class="chips-container">
            <button
              v-for="p in profileOptions"
              :key="p.key"
              type="button"
              @click="toggleProfile(p.key)"
              :class="['chip', { active: form.profile.includes(p.key) }]"
            >
              {{ p.icon }} {{ p.label }}
            </button>
          </div>
        </section>

        <!-- ── Section : Saisons ── -->
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

        <!-- ── Section : Types de glaçons ── -->
        <section class="form-section">
          <h3 class="form-section-title">Types de glaçons</h3>
          <div class="chips-container">
            <button
              v-for="ice in iceOptions"
              :key="ice.key"
              type="button"
              @click="toggleIce(ice.key)"
              :class="['chip', { active: form.ice.includes(ice.key) }]"
            >
              {{ ice.icon }} {{ ice.label }}
            </button>
          </div>
        </section>

        <!-- ── Section : Recette ── -->
        <section class="form-section">
          <div class="form-section-header">
            <h3 class="form-section-title">Recette</h3>
            <div class="recipe-header-actions">
              <!-- Switch Oz / Ml -->
              <div class="unit-switch">
                <button
                  type="button"
                  :class="['unit-btn', { active: unit === 'oz' }]"
                  @click="unit = 'oz'"
                >oz</button>
                <button
                  type="button"
                  :class="['unit-btn', { active: unit === 'ml' }]"
                  @click="unit = 'ml'"
                >ml</button>
              </div>
              <button type="button" @click="addRecipeLine" class="btn-add-ingredient">
                <Plus :size="14" /> Ajouter
              </button>
            </div>
          </div>

          <!-- En-têtes colonnes -->
          <div class="recipe-columns-header">
            <span>Ingrédient</span>
            <span>Type</span>
            <span>{{ unit === 'oz' ? 'Oz' : 'Ml' }}</span>
            <span>Dash</span>
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
              <!-- Nom de l'ingrédient -->
              <input
                v-model="ing.Ingredient"
                type="text"
                class="form-input"
                placeholder="Ex: Bourbon"
              />

              <!-- Type (select depuis l'inventaire) -->
              <select v-model="ing.Type" class="form-input">
                <option value="">--</option>
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

              <!-- Quantité (Oz ou Ml selon le switch) -->
              <input
                v-if="unit === 'oz'"
                v-model="ing.Oz"
                type="text"
                class="form-input"
                placeholder="2"
              />
              <input
                v-else
                v-model="ing.Ml"
                type="text"
                class="form-input"
                placeholder="60"
              />

              <!-- Dashes -->
              <input
                v-model.number="ing.Dashes"
                type="number"
                min="0"
                class="form-input"
                placeholder="—"
              />

              <!-- Supprimer -->
              <button type="button" @click="removeRecipeLine(idx)" class="btn-remove-ingredient">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>
        </section>

        <!-- ── Section : Description & Image ── -->
        <section class="form-section">
          <h3 class="form-section-title">Description & Image</h3>
          <div class="form-field">
            <label class="form-label">Description / Notes</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="Conseils de préparation, anecdotes, accords..."></textarea>
          </div>
          <div class="form-field">
            <label class="form-label">Image (URL)</label>
            <div class="image-field-row">
              <input v-model="form.image" type="text" class="form-input" placeholder="https://..." />
              <div v-if="form.image" class="image-preview">
                <img :src="form.image" alt="preview" @error="form.image = ''" />
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-modal-secondary">Annuler</button>
        <button @click="handleSave" class="btn-modal-primary" :disabled="!form.name.trim()">
          {{ isNew ? '✨ Créer' : '💾 Enregistrer' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X, Trash2, Plus } from 'lucide-vue-next'
import { useInventory } from '@/composables/useInventory'
import { validateCocktail } from '@/composables/useDataValidator'
import { getGlassesAsOptions, getMethodsAsOptions, getCocktailCategoriesAsOptions } from '@/lib/cocktail-constants'

const props = defineProps({ 
  cocktail: Object,
    barId:{ type: String, default: '' },
})
const emit  = defineEmits(['save', 'close'])

const { ingredients } = useInventory()

// ── Unité active (oz ou ml) ──────────────────────
const unit = ref('oz')

// ── Ingrédients groupés par catégorie ────────────
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

// ── Options depuis constantes centralisées ───────
const glassOptions = computed(() => getGlassesAsOptions())
const methodOptions = computed(() => getMethodsAsOptions())
const categoryOptions = computed(() => getCocktailCategoriesAsOptions())

// ── Computed ─────────────────────────────────────
const isNew = computed(() => !props.cocktail?.id)

// ── Mapping: Spirit de base -> Catégorie réelle ──────────────────────────────
const spiritToCategoryMap = {
  // Whiskey Family
  'bourbon': 'Whiskey',
  'rye': 'Whiskey',
  'scotch': 'Whiskey',
  'irish_whiskey': 'Whiskey',
  'peated_whisky': 'Whiskey',
  'whiskey': 'Whiskey',
  
  // Rum
  'rum': 'Rum',
  'rum_agricol': 'Rum',
  'rum_jamaican': 'Rum',
  'rum_cuban': 'Rum',
  'rum_overproof': 'Rum',
  'cachaca': 'Rum',
  
  // Agave
  'tequila': 'Agave',
  'tequila_reposado': 'Agave',
  'mezcal': 'Agave',
  
  // Gin
  'gin': 'Gin',
  'gin_dry': 'Gin',
  'gin_navy': 'Gin',
  'genever': 'Gin',
  
  // Vodka
  'vodka': 'Vodka',
  
  // Brandy Family
  'cognac': 'Brandy',
  'brandy': 'Brandy',
  'calvados': 'Brandy',
  'pisco': 'Brandy',
  'grappa': 'Brandy',
  
  // Absinthe
  'absinthe': 'Absinthe',
  'pastis': 'Absinthe',
  'aquavit': 'Aquavit',
}

// ── Catégories listées pour le dropdown Spirit ──────────────────────────────
const categories = [
  {
    key: 'Whiskey_Family', label: '🥃 Whiskey',
    spirits: [
      { key: 'bourbon', label: 'Bourbon' },
      { key: 'rye',     label: 'Rye' },
      { key: 'scotch',  label: 'Scotch' },
      { key: 'irish_whiskey', label: 'Irish Whiskey' },
      { key: 'peated_whisky', label: 'Islay / Peated' },
      { key: 'whiskey', label: 'Whiskey (autre)' },
    ]
  },
  {
    key: 'Rum_Family', label: '🍹 Rhum',
    spirits: [
      { key: 'rum',          label: 'Rum blanc' },
      { key: 'rum_agricol',  label: 'Rhum Agricole' },
      { key: 'rum_jamaican', label: 'Rhum Jamaïcain' },
      { key: 'rum_cuban',    label: 'Rhum Cubain' },
      { key: 'rum_overproof',label: 'Overproof' },
      { key: 'cachaca',      label: 'Cachaça' },
    ]
  },
  {
    key: 'Agave_Family', label: '🌵 Agave',
    spirits: [
      { key: 'tequila',          label: 'Tequila Blanco' },
      { key: 'tequila_reposado', label: 'Tequila Reposado' },
      { key: 'mezcal',           label: 'Mezcal' },
    ]
  },
  {
    key: 'Gin', label: '🌿 Gin',
    spirits: [
      { key: 'gin',      label: 'Gin' },
      { key: 'gin_dry',  label: 'Dry Gin' },
      { key: 'gin_navy', label: 'Navy Strength' },
      { key: 'genever',  label: 'Genièvre' },
    ]
  },
  {
    key: 'Vodka', label: '❄️ Vodka',
    spirits: [{ key: 'vodka', label: 'Vodka' }]
  },
  {
    key: 'Brandy_Family', label: '🍇 Brandy',
    spirits: [
      { key: 'cognac',   label: 'Cognac' },
      { key: 'brandy',   label: 'Brandy' },
      { key: 'calvados', label: 'Calvados' },
      { key: 'pisco',    label: 'Pisco' },
      { key: 'grappa',   label: 'Grappa' },
    ]
  },
  {
    key: 'Absinthe', label: '🌱 Absinthe / Pastis',
    spirits: [
      { key: 'absinthe', label: 'Absinthe' },
      { key: 'pastis',   label: 'Pastis' },
      { key: 'aquavit',  label: 'Aquavit' },
    ]
  },
]

function autoFillCategory() {
  const spirit = form.value.base_spirit
  if (!spirit) {
    form.value.category = ''
    return
  }
  // Utiliser le mapping pour obtenir la vraie valeur de catégorie
  const categoryValue = spiritToCategoryMap[spirit]
  if (categoryValue) {
    form.value.category = categoryValue
  }
}

// ── Options chips ─────────────────────────────────
const seasonOptions = [
  { key: 'spring', icon: '🌸', label: 'Printemps' },
  { key: 'summer', icon: '☀️', label: 'Été' },
  { key: 'fall',   icon: '🍂', label: 'Automne' },
  { key: 'winter', icon: '❄️', label: 'Hiver' },
]

const profileOptions = [
  { key: 'Citrus',     icon: '🍋', label: 'Agrume' },
  { key: 'Fruity',     icon: '🍒', label: 'Fruité' },
  { key: 'Tropical',   icon: '🌴', label: 'Tropical' },
  { key: 'Herbal',     icon: '🌿', label: 'Herbacé' },
  { key: 'Floral',     icon: '🌸', label: 'Floral' },
  { key: 'Spicy',      icon: '🌶️', label: 'Épicé' },
  { key: 'Smoky',      icon: '🔥', label: 'Fumé' },
  { key: 'Bitter',     icon: '😬', label: 'Amer' },
  { key: 'Sour',       icon: '😮', label: 'Acidulé' },
  { key: 'Sweet',      icon: '🍯', label: 'Sucré' },
  { key: 'Dry',        icon: '🏜️', label: 'Sec' },
  { key: 'Refreshing', icon: '💧', label: 'Frais' },
  { key: 'Rich',       icon: '✨', label: 'Riche' },
  { key: 'Creamy',     icon: '🥛', label: 'Crémeux' },
  { key: 'Nutty',      icon: '🌰', label: 'Noisetté' },
  { key: 'Boozy',      icon: '💥', label: 'Corsé' },
]

const iceOptions = [
  { key: 'cubed',      icon: '🧊', label: 'Glaçons cubiques' },
  { key: 'crushed',    icon: '🧊', label: 'Glaçons concassés' },
  { key: 'cracked',    icon: '🧊', label: 'Glaçons fissurés' },
  { key: 'spear',      icon: '🧊', label: 'Glaçons en pics' },
  { key: 'block',      icon: '🧊', label: 'Bloc de glaçon' },
  { key: 'no_ice',     icon: '🌡️', label: 'Sans glaçons' },
]

// ── Formulaire ────────────────────────────────────
const form = ref({
  id:            props.cocktail?.id          ?? null,
  name:          props.cocktail?.name        ?? '',
  base_spirit:   props.cocktail?.base_spirit ?? '',
  category:      props.cocktail?.category    ?? '',
  glass:         props.cocktail?.glass       ?? '',
  method:        props.cocktail?.method      ?? '',
  difficulty:    props.cocktail?.difficulty  ?? '',
  abv:           props.cocktail?.abv         ?? 0,
  description:   props.cocktail?.description ?? '',
  image:         props.cocktail?.image       ?? '',
  creator:       props.cocktail?.creator     ?? '',
  cocktail_style: props.cocktail?.cocktail_style ?? '',
  season:    [...(props.cocktail?.season  ?? [])],
  profile:   [...(props.cocktail?.profile ?? [])],
  tags:      [...(props.cocktail?.tags    ?? [])],
  ice:       [...(props.cocktail?.ice     ?? [])],
  recipe: (props.cocktail?.recipe ?? [])
    .filter(i => i.Ingredient?.trim())
    .map(i => ({
      Ingredient: i.Ingredient ?? '',
      Type:       i.Type       ?? '',
      Oz:         i.Oz         ?? '',
      Ml:         i.Ml         ?? '',
      Dashes:     i.Dashes     ?? null,
    })),
})

// Détecter l'unité des données existantes
if (props.cocktail?.recipe?.some(i => i.Ml)) unit.value = 'ml'

// ── Helpers ───────────────────────────────────────
function toggleSeason(key) {
  const idx = form.value.season.indexOf(key)
  if (idx > -1) form.value.season.splice(idx, 1)
  else          form.value.season.push(key)
}

function toggleProfile(key) {
  const idx = form.value.profile.indexOf(key)
  if (idx > -1) form.value.profile.splice(idx, 1)
  else          form.value.profile.push(key)
}

function toggleIce(key) {
  const idx = form.value.ice.indexOf(key)
  if (idx > -1) form.value.ice.splice(idx, 1)
  else          form.value.ice.push(key)
}

function addRecipeLine() {
  form.value.recipe.push({ Ingredient: '', Type: '', Oz: '', Ml: '', Dashes: null })
}

function removeRecipeLine(idx) {
  form.value.recipe.splice(idx, 1)
}

function handleSave() {
  try {
    const validated = validateCocktail(form.value)

    if (!props.barId) {
      throw new Error('barId manquant')
    }

    emit('save', {
      ...validated,
      bar_id: props.barId
    })

  } catch (err) {
    alert(`❌ ${err.message}`)
  }
}
</script>