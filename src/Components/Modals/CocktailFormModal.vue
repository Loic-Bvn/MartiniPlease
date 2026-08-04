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
                <optgroup v-for="cat in categories" :key="cat.key" :label="cat.label">
                  <option v-for="spirit in cat.spirits" :key="spirit.key" :value="spirit.key">
                    {{ spirit.label }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Catégorie</label>
              <select v-model="form.category" class="form-input" :disabled=true>
                <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Verre</label>
              <select v-model="form.glass" class="form-input">
                <option v-for="glass in glassOptions" :key="glass.value" :value="glass.value">
                  {{ glass.label }}
                </option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Méthode</label>
              <select v-model="form.method" class="form-input">
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
                  <option
                    v-for="(opt, key) in iceOptions"
                    :key="key"
                    :value="key"
                  >
                    {{ opt.emoji + " " + getDetailledIceLabel(opt.name, locale) }}
                  </option>
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

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Année de création</label>
              <input v-model="form.creation_year" type="text" class="form-input" placeholder="Ex: 1920" />
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
            <span>Catégorie</span>
            <span>Ingrédient</span>
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
        
          <div class="form-row form-row--pricing">
            <div class="form-field">
              <label class="form-label">Prix de vente</label>
              <input v-model.number="form.price" type="number" step="0.5" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Coût matière</label>
              <span v-if="cost.total > 0">{{ cost.total.toFixed(2) }}€</span>
              <span v-else class="form-hint">
                Aucun coût calculable — vérifie les prix des ingrédients dans le stock
              </span>
            </div>
            <div class="form-field">
              <label class="form-label">Marge</label>
              <span v-if="currentMargin">
                {{ currentMargin.absolute.toFixed(2) }}€
                ({{ currentMargin.percent.toFixed(0) }}%)
              </span>
              <span v-else class="form-hint">
                {{ cost.total > 0 ? 'Renseigne un prix de vente pour voir la marge' : 'Renseigne un coût pour voir la marge' }}
              </span>
            </div>
          </div>
        </section>

        <!-- ── Section : Description & Image ── -->
        <section class="form-section">
          <h3 class="form-section-title">Description & Image</h3>
          <div class="form-field">
            <label class="form-label">Description ({{ locale.toUpperCase() }})</label>
            <textarea v-model="descriptionForLocale" class="form-input form-textarea" placeholder="Conseils de préparation, anecdotes, accords..."></textarea>
          </div>

          <div class="form-field">
            <label class="form-label">Image</label>

            <!-- Bascule Lien / Upload -->
            <div class="unit-switch image-mode-switch">
              <button
                type="button"
                :class="['unit-btn', { active: imageMode === 'url' }]"
                @click="imageMode = 'url'"
              >Lien</button>
              <button
                type="button"
                :class="['unit-btn', { active: imageMode === 'upload' }]"
                @click="imageMode = 'upload'"
              >Uploader</button>
            </div>

            <div class="image-field-row">
              <!-- Mode URL -->
              <input
                v-if="imageMode === 'url'"
                v-model="form.image"
                type="text"
                class="form-input"
                placeholder="https://..."
              />

              <!-- Mode Upload -->
              <template v-else>
                <input
                  type="file"
                  accept="image/*"
                  class="form-input"
                  @change="handleFileUpload"
                  :disabled="uploadingImage"
                />
                <p v-if="uploadingImage" class="upload-hint">Upload en cours…</p>
                <p v-if="uploadError" class="add-error">{{ uploadError }}</p>
              </template>

              <!-- Aperçu, commun aux deux modes -->
              <div v-if="form.image" class="image-preview">
                <img
                  v-if="!imagePreviewError"
                  :src="form.image"
                  alt="preview"
                  @error="imagePreviewError = true"
                />
                <div v-else class="image-preview-broken">
                  Image introuvable — vérifie le lien ou réessaie l'upload
                </div>
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
import { ref, computed, reactive, watch } from 'vue'
import { X, Trash2, Plus } from 'lucide-vue-next'
import { validateCocktail } from '@/composables/useDataValidator'
import { supabase, supabaseImageBucket } from '@/lib/supabase'
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
import { getDetailledIceLabel } from '../../constants/typeLabels'
import { useCocktailCost } from '@/composables/useCostCalculator'
import { useInventory } from '@/composables/useInventory'

const { ingredients } = useInventory()
const { cost, margin } = useCocktailCost(
  computed(() => form.value.recipe),
  ingredients
)
const currentMargin = computed(() => margin(form.value.price))

const categories = getBaseSpiritGroups()
const spiritToCategoryMap = getSpiritToCategoryMap()

const INGREDIENTS_MAP = getAllIngredients()
const INGREDIENTS_BY_CATEGORY = getIngredientsByCategory()

const props = defineProps({ 
  cocktail: Object,
  locale: { type: String, default: 'fr' },
  barId: { type: String, default: '' },
})
const emit = defineEmits(['save', 'close'])

// ── Unité active (oz ou ml) ──────────────────────
const unit = ref('oz')

// ── ABV auto/manuel ───────────────────────────────
const abvAuto = ref(true)

// ── Image : lien ou upload ───────────────────────
const imageMode = ref('url')
const imagePreviewError = ref(false)
const uploadingImage = ref(false)
const uploadError = ref('')

// Réinitialise l'état "image cassée" à chaque changement de source,
// pour laisser une nouvelle URL/upload une vraie chance de charger
// (c'est l'absence de ce reset couplé à un @error qui vidait le champ
// avant : il ne fallait JAMAIS toucher form.image depuis le handler d'erreur).
watch(() => props.cocktail, () => {}, { immediate: false })

async function handleFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return

  uploadError.value = ''
  uploadingImage.value = true

  try {
    const ext = file.name.split('.').pop()
    const path = `${props.barId || 'shared'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: storageErr } = await supabase.storage
      .from(supabaseImageBucket)
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (storageErr) throw storageErr

    const { data } = supabase.storage.from(supabaseImageBucket).getPublicUrl(path)
    form.value.image = data.publicUrl
    imagePreviewError.value = false
  } catch (err) {
    const message = err?.message || err?.error_description || JSON.stringify(err)
    uploadError.value = `Échec de l'upload : ${message}. Vérifie que le bucket "${supabaseImageBucket}" existe et que le stockage Supabase est configuré.`
  } finally {
    uploadingImage.value = false
    e.target.value = '' // permet de re-sélectionner le même fichier si besoin
  }
}

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
const form = ref({
  id:             props.cocktail?.id             ?? null,
  name:           props.cocktail?.name           ?? '',
  base_spirit:    props.cocktail?.base_spirit    ?? '',
  category:       props.cocktail?.category       ?? '',
  glass:          props.cocktail?.glass          ?? '',
  method:         props.cocktail?.method         ?? '',
  abv:            props.cocktail?.abv            ?? 0,
  description_fr: props.cocktail?.description_fr ?? '',
  description_en: props.cocktail?.description_en ?? '',
  creator:        props.cocktail?.creator        ?? '',
  creation_year: props.cocktail?.creation_year   ?? '',
  cocktail_style: props.cocktail?.cocktail_style ?? '',
  ice:            props.cocktail?.ice            ?? '',
  season:  [...(props.cocktail?.season  ?? [])],
  profile: [...(props.cocktail?.profile ?? [])],
  tags:    [...(props.cocktail?.tags    ?? [])],
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

// Réinitialise l'aperçu cassé à chaque fois que l'image change
// (nouvelle URL tapée, upload terminé, ou changement de mode)
watch(() => form.value.image, () => {
  imagePreviewError.value = false
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
    // const iceArr = form.value.ice ? [form.value.ice] : []

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

    var validated = validateCocktail({
      ...form.value,
      recipe: cleanedRecipe,
      abv: abvFinal,
      ice: form.value.ice,
      price: form.value.price,
    },{
      forBar: true
    })

    if (!props.barId) {
      throw new Error('barId manquant')
    }

    emit('save', {
      ...validated,
      bar_id: props.barId
    })

  } catch (err) {
    console.error('❌ Save failed:', err)
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

const descriptionForLocale = computed({
  get: () => props.locale === 'fr' ? form.value.description_fr : form.value.description_en,
  set: (val) => {
    if (props.locale === 'fr') form.value.description_fr = val
    else form.value.description_en = val
  }
})
</script>

<style scoped>
.form-hint {
  display: block;
  font-size: 0.78rem;
  color: var(--text-dim);
  margin-top: 0.3rem;
}

.image-mode-switch {
  margin-bottom: 0.5rem;
  width: fit-content;
}

.upload-hint {
  font-size: 0.78rem;
  color: var(--text-dim);
  margin: 0.4rem 0 0;
}

.image-preview-broken {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 0.75rem;
  background: var(--bg-input);
  border: 1px dashed var(--border-mid);
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  font-size: 0.78rem;
  text-align: center;
}
</style>