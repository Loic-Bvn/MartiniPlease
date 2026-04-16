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
              <select v-model="form.category" class="form-input" :disabled="!!form.base_spirit">
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
              <label class="form-label">
                ABV (%)
                <button type="button" @click="abvAuto = !abvAuto" class="btn-toggle-auto">
                  {{ abvAuto ? '🔄 Auto' : '✏️ Manuel' }}
                </button>
              </label>
              <input
                v-if="abvAuto"
                :value="computedAbv"
                type="number"
                class="form-input"
                readonly
                style="opacity:0.65; cursor:not-allowed;"
                placeholder="Calculé depuis la recette"
              />
              <input
                v-else
                v-model.number="form.abv"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="form-input"
                placeholder="Ex: 32"
              />
            </div>
            <div class="form-field">
              <label class="form-label">Type de glace</label>
              <select v-model="form.ice" class="form-input">
                <option value="">-- Aucun --</option>
                <option v-for="opt in iceOptions" :key="opt.name" :value="opt.name">{{opt.emoji + " " +  opt.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Createur</label>
              <input v-model="form.creator" type="text" class="form-input" placeholder="Ex: John Doe" />
            </div>
            <div class="form-field">
              <label class="form-label">Style de cocktail</label>
              <select v-model="form.cocktail_style" class="form-input">
                <option value="">-- Choisir --</option>
                <option v-for="s in cocktailStyleOptions" :key="s" :value="s">{{ s }}</option>
              </select>
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
            <span>Catégorie</span>
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
              <!-- categorie l'ingrédient -->
              <select v-model="ing.Category" @change="onCategoryChange(ing)" class="form-input">
                <option value="">-- Catégorie --</option>
                <option
                  v-for="(_, catKey) in INGREDIENTS_BY_CATEGORY"
                  :key="catKey"
                  :value="catKey"
                >
                  {{ CATEGORY_LABELS[catKey] ?? catKey }}
                </option>
              </select>

              <!-- Nom de l'ingrédient -->
              <select v-model="ing.Type" @change="onIngredientChange(ing)" class="form-input">
                <option value="">-- Ingrédient --</option>
                <option
                  v-for="(item, typeKey) in getTypesByCategory(ing.Category)"
                  :key="typeKey"
                  :value="typeKey"
                >
                  {{ item.name }}
                </option>
              </select>

              <!-- Quantité -->
              <!-- OZ -->
              <input
                v-if="unit === 'oz'"
                v-model="ing.Oz"
                @input="onOzChange(ing)"
                type="number"
                min="0"
                class="form-input"
                placeholder="—"
              />

              <!-- ML -->
              <input
                v-else
                v-model="ing.Ml"
                @input="onMlChange(ing)"
                type="number"
                min="0"
                class="form-input"
                placeholder="—"
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
import { ref, computed, reactive } from 'vue'
import { X, Trash2, Plus } from 'lucide-vue-next'
import { validateCocktail } from '@/composables/useDataValidator'
import { getGlassesAsOptions,
  getMethodsAsOptions,
  getCocktailCategoriesAsOptions,
  getCocktailStyles,
  getAllIngredients,
  getIngredientsByCategory,
  getIceTypes,
  getBaseSpiritGroups,
  getSpiritToCategoryMap,
  getProfileOptions } from '@/lib/cocktail-constants'

const categories = getBaseSpiritGroups()
const spiritToCategoryMap = getSpiritToCategoryMap()

const INGREDIENTS_MAP = getAllIngredients()
const INGREDIENTS_BY_CATEGORY = getIngredientsByCategory()

const props = defineProps({ 
  cocktail: Object,
  barId: { type: String, default: '' },
})
const emit = defineEmits(['save', 'close'])

// ── Unité active (oz ou ml) ──────────────────────
const unit = ref('oz')

// ── ABV auto/manuel ───────────────────────────────
const abvAuto = ref(true)

// ── Catégories pour filtre recette ───────────────
const recipeCategoryFilter = reactive({})

const CATEGORY_LABELS = {
  spirits:   '🥃 Spiritueux',
  licors:    '🍷 Liqueurs',
  modifiers: '🍸 Modificateurs',
  juices:    '🍊 Jus',
  syrups:    '🍯 Sirops',
  bitters:   '💧 Bitters',
  mixers:    '🥤 Mixers',
  garnish:   '🍋 Garniture',
  others:    '📦 Autres',
}

// ── Options depuis constantes centralisées ───────
const glassOptions = computed(() => getGlassesAsOptions())
const iceOptions = computed(() => getIceTypes())
const methodOptions = computed(() => getMethodsAsOptions())
const categoryOptions = computed(() => getCocktailCategoriesAsOptions())
const cocktailStyleOptions = computed(() => getCocktailStyles())

// ── Computed ─────────────────────────────────────
const isNew = computed(() => !props.cocktail?.id)

// ── ABV calculé automatiquement depuis la recette ──
const computedAbv = computed(() => {
  let totalMl = 0
  let totalAlcMl = 0
  form.value.recipe.forEach(ing => {
    const ml = parseFloat(ing.Ml) || (parseFloat(ing.Oz) || 0) * 29.5735
    if (!ml) return
    const matched = INGREDIENTS_MAP[ing.Type]
    const abv = matched?.abv ?? 0
    totalMl += ml
    totalAlcMl += (ml * abv) / 100
  })
  if (totalMl === 0) return 0
  return Math.round((totalAlcMl / totalMl) * 100 * 10) / 10
})

function autoFillCategory() {
  const spirit = form.value.base_spirit
  form.value.category = spirit ? (spiritToCategoryMap[spirit] ?? '') : ''
}
const profileOptions = getProfileOptions()

// ── Formulaire ────────────────────────────────────
// ice: string (une seule valeur) au lieu d'array
const iceInitial = (() => {
  const raw = props.cocktail?.ice
  if (Array.isArray(raw) && raw.length > 0) return raw[0]
  if (typeof raw === 'string') return raw
  return ''
})()

const form = ref({
  id:             props.cocktail?.id             ?? null,
  name:           props.cocktail?.name           ?? '',
  base_spirit:    props.cocktail?.base_spirit    ?? '',
  category:       props.cocktail?.category       ?? '',
  glass:          props.cocktail?.glass          ?? '',
  method:         props.cocktail?.method         ?? '',
  abv:            props.cocktail?.abv            ?? 0,
  description:    props.cocktail?.description    ?? '',
  image:          props.cocktail?.image          ?? '',
  creator:        props.cocktail?.creator        ?? '',
  cocktail_style: props.cocktail?.cocktail_style ?? '',
  season:  [...(props.cocktail?.season  ?? [])],
  profile: [...(props.cocktail?.profile ?? [])],
  tags:    [...(props.cocktail?.tags    ?? [])],
  ice:     iceInitial,
  recipe: (props.cocktail?.recipe ?? [])
    .filter(i => i.Ingredient?.trim())
    .map(i => {
      const type = i.Type ?? ''
      return {
        Ingredient: i.Ingredient ?? '',
        Type: type,
        Category: findCategoryFromType(type), // 💥 clé du fix
        Oz: i.Oz ?? '',
        Ml: i.Ml ?? '',
        Dashes: i.Dashes ?? null,
      }
    }),
})

// Détecter l'unité des données existantes
if (props.cocktail?.recipe?.some(i => i.Ml)) unit.value = 'ml'

// ── Helpers ───────────────────────────────────────
function toggleProfile(key) {
  const idx = form.value.profile.indexOf(key)
  if (idx > -1) form.value.profile.splice(idx, 1)
  else          form.value.profile.push(key)
}

function addRecipeLine() {
  form.value.recipe.push({
    Category: '',
    Type: '',
    Ingredient: '',
    Oz: '',
    Ml: '',
    Dashes: null
  })
}

function removeRecipeLine(idx) {
  form.value.recipe.splice(idx, 1)
  delete recipeCategoryFilter[idx]
}

function handleSave() {
  try {
    const abvFinal = abvAuto.value ? computedAbv.value : form.value.abv
    const iceArr = form.value.ice ? [form.value.ice] : []

    const cleanedRecipe = form.value.recipe
      .filter(ing => ing.Type)
      .map(({ Category, ...rest }) => ({
        Ingredient: rest.Ingredient,
        Type: rest.Type,
        IsGarnish: Category === 'garnish',
        Oz: normalizeNumber(rest.Oz),
        Ml: normalizeNumber(rest.Ml),
        Dashes: normalizeNumber(rest.Dashes),
      }))

    const validated = validateCocktail({
      ...form.value,
      recipe: cleanedRecipe,
      abv: abvFinal,
      ice: iceArr,
    })

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

function onCategoryChange(ing) {
  ing.Type = ''
  ing.Ingredient = ''
}

function onIngredientChange(ing) {
  const meta = INGREDIENTS_MAP[ing.Type]
  if (meta) {
    ing.Ingredient = meta.name
  }
}

function findCategoryFromType(type) {
  for (const [catKey, items] of Object.entries(INGREDIENTS_BY_CATEGORY)) {
    if (items[type]) return catKey
  }
  return ''
}

function getTypesByCategory(cat) {
  const raw = INGREDIENTS_BY_CATEGORY[cat] || {}
  return Object.fromEntries(
    Object.entries(raw).sort(([, a], [, b]) => a.name.localeCompare(b.name, 'fr'))
  )
}

function ozToMl(oz) {
  const val = parseFloat(oz)
  if (isNaN(val)) return ''
  return Math.round(val * 30)
}

function mlToOz(ml) {
  const val = parseFloat(ml)
  if (isNaN(val)) return ''
  return (val / 30).toFixed(2)
}

function onOzChange(ing) {
  if (!ing.Oz && ing.Oz !== 0) {
    ing.Ml = null
    return
  }
  ing.Ml = ozToMl(ing.Oz)
}

function onMlChange(ing) {
  if (!ing.Ml && ing.Ml !== 0) {
    ing.Oz = null
    return
  }
  ing.Oz = mlToOz(ing.Ml)
}

function normalizeNumber(val) {
  if (val === '' || val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}
</script>