<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container modal-container--cocktail cocktail-view-enter">
      <div class="modal-header">
        <h2 class="modal-title">{{ cocktail.name }}</h2>
        <button @click="$emit('close')" class="modal-close-btn">✖</button>
      </div>

      <div class="modal-body">
        <section class="form-section cocktail-hero-section">
          <div class="cocktail-detail-grid">
            <div class="cocktail-detail-image">
              <div v-if="cocktail.image" class="image-preview-large">
                <img :src="cocktail.image" alt="cocktail image" @error="imageError = true" v-if="!imageError" />
                <div v-else class="image-missing">Image introuvable</div>
              </div>
              <div v-else class="image-missing">Pas d'image</div>
            </div>

            <div class="cocktail-detail-content">
              <div class="cocktail-badges">
                <span v-if="cocktail.abv != null" class="cocktail-badge cocktail-badge--abv">ABV {{ cocktail.abv }}%</span>
                <span v-if="cocktail.cocktail_style" class="cocktail-badge">{{ cocktail.cocktail_style }}</span>
                <span v-if="cocktail.difficulty" class="cocktail-badge">{{ cocktail.difficulty }}</span>
              </div>

              <p v-if="cocktail.description" class="cocktail-description">{{ cocktail.description }}</p>
              <p v-else class="cocktail-description cocktail-description--empty">Aucune description disponible pour ce cocktail.</p>

              <div class="cocktail-meta-grid">
                <div v-if="cocktail.base_spirit" class="meta-item"><span class="meta-label">Spirit</span><span>{{ cocktail.base_spirit }}</span></div>
                <div v-if="cocktail.category" class="meta-item"><span class="meta-label">Catégorie</span><span>{{ cocktail.category }}</span></div>
                <div v-if="cocktail.method" class="meta-item"><span class="meta-label">Méthode</span><span>{{ cocktail.method }}</span></div>
                <div v-if="cocktail.glass" class="meta-item"><span class="meta-label">Verre</span><span>{{ cocktail.glass }}</span></div>
                <div v-if="cocktail.creator" class="meta-item"><span class="meta-label">Createur</span><span>{{ cocktail.creator }}</span></div>
                <div v-if="cocktail.profile?.length" class="meta-item meta-item--wide"><span class="meta-label">Profil</span><span>{{ formatProfiles(cocktail.profile) }}</span></div>
                <div v-if="cocktail.ice?.length" class="meta-item"><span class="meta-label">Glace</span><span>{{ formatList(cocktail.ice) }}</span></div>
                <div v-if="cocktail.season?.length" class="meta-item"><span class="meta-label">Saison</span><span>{{ formatList(cocktail.season) }}</span></div>
                <div v-if="cocktail.tags?.length" class="meta-item meta-item--wide"><span class="meta-label">Tags</span><span>{{ formatList(cocktail.tags) }}</span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3 class="form-section-title">Recette</h3>
          <div class="recipe-rows">
            <div v-if="(cocktail.recipe || []).length === 0">Aucun ingrédient</div>
            <div v-for="(ing, idx) in cocktail.recipe" :key="idx" class="recipe-row recipe-row--premium">
              <div class="recipe-row-left">
                <div class="ingredient-name">{{ getTypeLabel(ing.Type, locale) }}</div>
                <div class="ingredient-note" v-if="ing.IsGarnish">Garnish</div>
              </div>
              <div class="recipe-row-right">{{ formatQty(ing) }}</div>
            </div>
          </div>
        </section>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-modal-primary">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getTypeLabel, getProfileLabel } from '@/constants/typeLabels.js'

const props = defineProps({
  cocktail: Object,
  locale: { type: String, default: 'fr' },
})
const imageError = ref(false)

function formatQty(ing) {
  if (!ing) return ''
  if (ing.Ml) return `${ing.Ml}ml`
  if (ing.Oz) return `${ing.Oz}oz`
  if (ing.Dashes) return `${ing.Dashes} dash${ing.Dashes > 1 ? 'es' : ''}`
  return ''
}

function formatProfiles(value = []) {
  if (!Array.isArray(value)) return ''
  return value.map(item => getProfileLabel(item, props.locale)).join(', ')
}

function formatList(value = []) {
  if (!Array.isArray(value)) return ''
  return value.map(item => typeof item === 'string' ? item : item?.name || item?.label || '').filter(Boolean).join(', ')
}
</script>

<style scoped>
.modal-overlay {
  animation: overlayFadeIn 0.28s ease-out;
}

.cocktail-view-enter {
  animation: cardFlipZoom 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transform-origin: center;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cardFlipZoom {
  0% {
    opacity: 0;
    transform: perspective(1200px) rotateY(-90deg) scale(0.82);
  }
  60% {
    opacity: 1;
    transform: perspective(1200px) rotateY(8deg) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: perspective(1200px) rotateY(0deg) scale(1);
  }
}

.cocktail-hero-section {
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid var(--border, rgba(255,255,255,0.12));
}

.cocktail-detail-grid {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 1.25rem;
  align-items: start;
}

.cocktail-detail-image .image-preview-large {
  border-radius: 18px;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  background: rgba(255,255,255,0.05);
}

.cocktail-detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cocktail-detail-content {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.cocktail-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cocktail-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  font-size: 0.82rem;
  font-weight: 600;
}

.cocktail-badge--abv {
  background: rgba(196, 136, 31, 0.18);
  border-color: rgba(196, 136, 31, 0.35);
}

.cocktail-description {
  margin: 0;
  color: var(--text, #f7f7f7);
  line-height: 1.6;
}

.cocktail-description--empty {
  color: var(--text-dim, #9ca3af);
  font-style: italic;
}

.cocktail-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
}

.meta-item--wide {
  grid-column: 1 / -1;
}

.meta-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim, #9ca3af);
}

.recipe-row--premium {
  padding: 0.85rem 0.95rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
}

@media (max-width: 768px) {
  .cocktail-detail-grid {
    grid-template-columns: 1fr;
  }

  .cocktail-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
