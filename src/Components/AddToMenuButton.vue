<template>
  <button
    ref="btnEl"
    type="button"
    class="btn-icon btn-icon--add-to-menu"
    :class="{ 'btn-icon--add-to-menu-active': isInAnyMenu }"
    :title="t.title"
    :aria-label="t.title"
    aria-haspopup="menu"
    :aria-expanded="open"
    @click.stop="toggle"
  >
    <BookPlus :size="18" />
  </button>

  <!-- Teleporté dans body : évite d'être coupé par la card (overflow / will-change) -->
  <Teleport to="body">
    <div
      v-if="open"
      ref="popEl"
      class="atm-popover"
      role="menu"
      :style="popStyle"
      @click.stop
    >
      <p class="atm-title">{{ t.heading }}</p>

      <p v-if="menuCards.length === 0" class="atm-empty">{{ t.noMenu }}</p>

      <button
        v-for="card in menuCards"
        :key="card.id"
        type="button"
        role="menuitemcheckbox"
        :aria-checked="isIn(card)"
        class="atm-item"
        :class="{ 'atm-item--in': isIn(card) }"
        :disabled="pendingId === card.id"
        @click="onToggle(card)"
      >
        <span class="atm-check"><Check v-if="isIn(card)" :size="12" /></span>
        <span class="atm-name">{{ card.name }}</span>
        <EyeOff
          v-if="card.is_visible === false"
          :size="12"
          class="atm-hidden"
          :title="t.hidden"
        />
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { BookPlus, Check, EyeOff } from 'lucide-vue-next'
import { useMenuCards } from '@/composables/useMenuCards'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  cocktailId:   { type: String, required: true },
  cocktailName: { type: String, default: '' },
  locale:       { type: String, default: 'fr' },
})

const { menuCards, toggleCocktailInMenuCard } = useMenuCards()
const { showToast } = useToast()

const btnEl     = ref(null)
const popEl     = ref(null)
const open      = ref(false)
const pendingId = ref(null)
const popStyle  = ref({})

const t = computed(() => props.locale === 'fr'
  ? {
      title:   'Ajouter à un menu',
      heading: 'Ajouter à un menu',
      noMenu:  "Aucun menu pour l'instant. Crée une carte depuis la section « Cartes ».",
      hidden:  'Masqué aux drinkers',
      added:   'ajouté à',
      removed: 'retiré de',
      error:   'Impossible de modifier le menu',
    }
  : {
      title:   'Add to a menu',
      heading: 'Add to a menu',
      noMenu:  'No menu yet. Create one from the “Cards” section.',
      hidden:  'Hidden from drinkers',
      added:   'added to',
      removed: 'removed from',
      error:   'Could not update the menu',
    }
)

const isIn = card => (card.cocktail_ids || []).includes(props.cocktailId)
const isInAnyMenu = computed(() => menuCards.value.some(isIn))

// ── Positionnement ────────────────────────────────────────────────────────────
const POP_WIDTH = 240
const MARGIN    = 8

function place() {
  const btn = btnEl.value
  if (!btn) return
  const r = btn.getBoundingClientRect()
  const popH = popEl.value?.offsetHeight ?? 0

  // Aligné à droite du bouton, borné à la fenêtre
  let left = r.right - POP_WIDTH
  left = Math.max(MARGIN, Math.min(left, window.innerWidth - POP_WIDTH - MARGIN))

  // En dessous par défaut, au-dessus s'il n'y a pas la place
  const spaceBelow = window.innerHeight - r.bottom - MARGIN
  const openUp = popH > spaceBelow && r.top > spaceBelow
  const top = openUp
    ? Math.max(MARGIN, r.top - popH - 4)
    : r.bottom + 4

  popStyle.value = { top: `${top}px`, left: `${left}px`, width: `${POP_WIDTH}px` }
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    place()
    await nextTick()
    place() // 2e passe : la hauteur réelle est connue
  }
}

function close() { open.value = false }

// ── Actions ───────────────────────────────────────────────────────────────────
async function onToggle(card) {
  if (pendingId.value) return
  pendingId.value = card.id
  const result = await toggleCocktailInMenuCard(card.id, props.cocktailId)
  pendingId.value = null

  if (result.success) {
    const verb = result.added ? t.value.added : t.value.removed
    showToast(`🍸 ${props.cocktailName} ${verb} « ${card.name} »`)
  } else {
    showToast(`❌ ${t.value.error}`, 'error')
  }
  // Le popover reste ouvert : on peut cocher plusieurs menus d'affilée
}

// ── Fermeture (clic extérieur, Échap, scroll, resize) ─────────────────────────
function onPointerDown(e) {
  if (popEl.value?.contains(e.target) || btnEl.value?.contains(e.target)) return
  close()
}

function onKeydown(e) {
  if (e.key !== 'Escape') return
  // Empêche la modale de détail (qui écoute aussi Échap) de se fermer en même temps
  e.stopImmediatePropagation()
  close()
}

function onScrollOrResize(e) {
  // Ignorer le scroll interne du popover
  if (e.type === 'scroll' && popEl.value?.contains(e.target)) return
  close()
}

function bind() {
  document.addEventListener('pointerdown', onPointerDown, true)
  window.addEventListener('keydown', onKeydown, true)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
}
function unbind() {
  document.removeEventListener('pointerdown', onPointerDown, true)
  window.removeEventListener('keydown', onKeydown, true)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
}

watch(open, v => (v ? bind() : unbind()))
onBeforeUnmount(unbind)
</script>

<style scoped>
.btn-icon--add-to-menu:hover { color: var(--gold); }
.btn-icon--add-to-menu-active { color: var(--gold-dim); }

.atm-popover {
  position: fixed;
  z-index: 300; /* > modal-overlay (50) et burger-dropdown (200) */
  max-height: min(320px, 60vh);
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 6px;
}

.atm-title {
  margin: 0;
  padding: 4px 8px 6px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.atm-empty {
  margin: 0;
  padding: 6px 8px 8px;
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--text-muted);
}

.atm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.atm-item:hover:not(:disabled) { background: var(--bg-raised); }
.atm-item:disabled { opacity: 0.55; cursor: progress; }

.atm-check {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-mid);
  border-radius: 4px;
  color: var(--bg);
}
.atm-item--in .atm-check {
  background: var(--gold);
  border-color: var(--gold);
}

.atm-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.atm-hidden { flex: none; color: var(--text-dim); }
</style>