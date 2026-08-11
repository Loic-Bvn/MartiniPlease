<template>
  <footer class="footer-martini border-t">
    <div class="max-w-7xl mx-auto px-4 py-5">
      <div class="flex flex-col md:flex-row justify-between items-center gap-3">
        <p class="footer-text">
          🍸 <span class="footer-brand">MartiniPlease</span> · © {{ currentYear }} Loïc B.
        </p>
        <nav class="flex flex-wrap gap-x-3 gap-y-1 items-center justify-center">
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

const props = defineProps({
  locale: { type: String, default: 'fr' }
})

const currentYear = new Date().getFullYear()
const showCookieConsent = ref(false)

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
  border-color: var(--border);
}
.dark .footer-martini {
  background: linear-gradient(135deg, rgba(34,31,26,0.8), rgba(26,24,20,0.9));
  border-color: var(--border-mid);
}
.footer-brand {
  font-weight: 600;
  color: var(--text);
}
.dark .footer-brand { color: var(--gold); }
.footer-text {
  color: var(--text-muted);
  font-size: 0.8rem;
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
</style>
