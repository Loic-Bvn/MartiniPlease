<template>
  <div class="legal-page">
    <div class="legal-container">
      <button @click="$emit('back')" class="back-link">← {{ t.back }}</button>
      <h1 class="legal-title">{{ t.title }}</h1>

      <section>
        <h2>{{ t.noTracking }}</h2>
        <p>{{ t.noTrackingDesc }}</p>
      </section>

      <section>
        <h2>{{ t.localStorage }}</h2>
        <p>{{ t.localStorageDesc }}</p>
      </section>

      <section>
        <h2>{{ t.auth }}</h2>
        <p>{{ t.authDesc }}</p>
      </section>

      <section>
        <h2>{{ t.delete }}</h2>
        <p>{{ t.deleteDesc }}</p>
      </section>

      <p class="legal-contact">{{ t.questions }} : <a href="mailto:loic.bienvenu.pro@gmail.com">loic.bienvenu.pro@gmail.com</a></p>
      <p class="legal-date">{{ t.updated }} : {{ currentDate }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  locale: { type: String, default: 'fr' }
})

defineEmits(['back', 'navigate'])

const currentDate = computed(() =>
  new Date().toLocaleDateString(props.locale === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
)

const t = computed(() => props.locale === 'fr' ? {
  back: 'Retour',
  title: 'Cookies & données locales',
  noTracking: 'Pas de cookies de suivi',
  noTrackingDesc: "MartiniPlease n'utilise aucun cookie de tracking, aucune analytics tierce, aucune publicité. Zéro partage réseaux sociaux.",
  localStorage: 'localStorage uniquement',
  localStorageDesc: 'Le navigateur stocke localement vos préférences : thème clair/sombre, langue (FR/EN), unités de mesure (oz/ml), statut de consentement, bar sélectionné. Ces données restent sur votre appareil.',
  auth: 'Authentification',
  authDesc: "Les sessions bartender sont gérées par Supabase Auth via tokens sécurisés. Aucun mot de passe n'est stocké localement.",
  delete: 'Supprimer vos données locales',
  deleteDesc: "Via les paramètres de votre navigateur → Confidentialité → Effacer données de navigation → Cookies et données de site.\nLa plateforme fonctionne normalement sans localStorage (vos préférences ne seront simplement pas mémorisées).",
  questions: 'Questions',
  updated: 'Dernière mise à jour',
} : {
  back: 'Back',
  title: 'Cookies & Local Data',
  noTracking: 'No Tracking Cookies',
  noTrackingDesc: 'MartiniPlease uses no tracking cookies, no third-party analytics, no advertising. Zero social network sharing.',
  localStorage: 'localStorage Only',
  localStorageDesc: 'Your browser stores preferences locally: light/dark theme, language (FR/EN), units (oz/ml), consent status, selected bar. This data stays on your device.',
  auth: 'Authentication',
  authDesc: 'Bartender sessions are managed by Supabase Auth via secure tokens. No password is stored locally.',
  delete: 'Delete Your Local Data',
  deleteDesc: 'Via your browser settings → Privacy → Clear browsing data → Cookies and site data.\nThe platform works normally without localStorage (your preferences just won\'t be remembered).',
  questions: 'Questions',
  updated: 'Last updated',
})
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  padding: 3rem 0;
  background: var(--bg, #111827);
}
.legal-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 1.5rem;
  color: var(--text-muted, #9ca3af);
}
.back-link {
  display: inline-block;
  margin-bottom: 2rem;
  font-size: 0.85rem;
  color: var(--text-muted, #9ca3af);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}
.back-link:hover { color: var(--gold, #c9a84c); }
.legal-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text, #fff);
  margin-bottom: 2rem;
}
section {
  margin-bottom: 1.75rem;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid var(--border, #1f2937);
}
h2 {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gold, #c9a84c);
  margin-bottom: 0.6rem;
}
p { font-size: 0.875rem; line-height: 1.7; }
a {
  color: var(--gold, #c9a84c);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.legal-contact { font-size: 0.875rem; margin-top: 2rem; }
.legal-date {
  font-size: 0.75rem;
  color: var(--text-dim, #6b7280);
  margin-top: 0.5rem;
}
</style>