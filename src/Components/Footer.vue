<template>
  <footer class="footer-martini">
    <div class="footer-shell">
      <div class="footer-row">
        <p class="footer-text">
          🍸 <span class="footer-brand">MartiniPlease</span> · © {{ currentYear }} Loïc B.
          <span class="footer-version" :title="`Version ${appVersion}`">{{ appVersion }}</span>
        </p>
        <nav class="footer-nav" aria-label="Navigation du footer">
          <a @click="navigateTo('legal-notice')" class="footer-link">{{ t.legal }}</a>
          <span class="footer-sep">·</span>
          <a @click="navigateTo('privacy-policy')" class="footer-link">{{ t.privacy }}</a>
          <span class="footer-sep">·</span>
          <a @click="navigateTo('terms-of-use')" class="footer-link">{{ t.terms }}</a>
          <span class="footer-sep">·</span>
          <a @click="navigateTo('cookies-policy')" class="footer-link">{{ t.cookies }}</a>
          <span class="footer-sep">·</span>
          <button @click="openConsent" class="footer-link" :title="t.manageData">⚙️</button>
        </nav>
      </div>

      <!--
        Mention sanitaire obligatoire (loi Évin, art. L3323-4 CSP).
        Placée dans le footer existant, visible sur toutes les pages où
        Footer.vue est monté. Taille et contraste alignés sur les autres
        mentions du footer (font-weight renforcé pour rester bien lisible,
        comme l'exige le texte de loi).
      -->
      <p class="footer-sanitary">
        {{ t.sanitary }}
      </p>
    </div>

    <CookieConsentBanner
      v-if="showCookieConsent"
      :force-show="true"
      :locale="locale"
      @close="showCookieConsent = false"
    />
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'
import CookieConsentBanner from './CookieConsentBanner.vue'
import pkg from '../../package.json'

const props = defineProps({
  locale: { type: String, default: 'fr' }
})

const currentYear = new Date().getFullYear()
const showCookieConsent = ref(false)

// En prod, injectée par le workflow de déploiement à partir du tag git poussé
// (VITE_APP_VERSION=github.ref_name, ex. "v1.4.0") — voir .github/workflows/deploy.yml
// et `npm run release`. En dev local (pas de build taggé), fallback sur la
// version de package.json avec un suffixe explicite.
const appVersion = import.meta.env.VITE_APP_VERSION || `v${pkg.version}-dev`

const emit = defineEmits(['navigate-to-legal'])

const t = computed(() => props.locale === 'fr' ? {
  legal: 'Mentions légales',
  privacy: 'Confidentialité',
  terms: 'CGU',
  cookies: 'Cookies',
  manageData: 'Gérer les données',
  sanitary: "L'abus d'alcool est dangereux pour la santé, à consommer avec modération.",
} : {
  legal: 'Legal Notice',
  privacy: 'Privacy',
  terms: 'Terms',
  cookies: 'Cookies',
  manageData: 'Manage data',
  sanitary: 'Excessive alcohol consumption is dangerous for your health, please drink responsibly.',
})

function navigateTo(page) {
  emit('navigate-to-legal', page)
  window.scrollTo(0, 0)
}

function openConsent() {
  showCookieConsent.value = false
  setTimeout(() => { showCookieConsent.value = true }, 0)
}
</script>

<style scoped>
.footer-martini {
  background: linear-gradient(to bottom, var(--bg), var(--bg-raised));
  border-top: 1px solid var(--border);
}
.dark .footer-martini {
  background: linear-gradient(135deg, rgba(34,31,26,0.8), rgba(26,24,20,0.9));
  border-color: var(--border-mid);
}
.footer-shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 1rem 1.5rem;
}
.footer-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.footer-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.35rem 0.75rem;
}
.footer-brand {
  font-weight: 600;
  color: var(--text);
}
.dark .footer-brand { color: var(--gold); }
.footer-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
}
.dark .footer-text { color: var(--text-dim); }
.footer-link {
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 0.2s ease;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
}
.footer-link:hover { color: var(--gold); }
.dark .footer-link { color: var(--text-dim); }
.dark .footer-link:hover { color: var(--gold); }
.footer-sep {
  color: var(--border);
  font-size: 0.75rem;
  user-select: none;
}
.footer-version {
  margin-left: 6px;
  font-size: 0.7rem;
  color: var(--text-dim, var(--text-muted));
  opacity: 0.7;
}

/* Mention sanitaire — même taille que footer-text mais plus contrastée
   (font-weight + couleur pleine, pas muted) pour rester "lisible" au sens
   de la loi même si elle est en bas de page. */
.footer-sanitary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text);
}
.dark .footer-sanitary {
  color: var(--text);
  border-color: var(--border-mid);
}

@media (min-width: 768px) {
  .footer-row {
    flex-direction: row;
  }
}
</style>
