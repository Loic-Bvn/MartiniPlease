<template>
  <div class="legal-page">
    <div class="legal-container">
      <button @click="$emit('back')" class="back-link">← {{ t.back }}</button>
      <h1 class="legal-title">{{ t.title }}</h1>

      <section>
        <h2>{{ t.editor }}</h2>
        <p>MartiniPlease {{ t.editorDesc }} <strong>Loïc B.</strong>.<br>
        {{ t.contact }} : <a href="mailto:loic.bienvenu.pro@gmail.com">loic.bienvenu.pro@gmail.com</a></p>
      </section>

      <section>
        <h2>{{ t.hosting }}</h2>
        <p>Front-end : <strong>OVH Cloud</strong> — <a href="https://www.ovh.com" target="_blank">www.ovh.com</a><br>
        {{ t.hostingDesc }}</p>
      </section>

      <section>
        <h2>{{ t.ip }}</h2>
        <p>{{ t.ipDesc }}</p>
      </section>

      <section>
        <h2>{{ t.liability }}</h2>
        <p>{{ t.liabilityDesc }}</p>
      </section>

      <section>
        <h2>{{ t.gdpr }}</h2>
        <p>{{ t.gdprDesc }} <a href="https://www.cnil.fr" target="_blank">www.cnil.fr</a><br>
        {{ t.gdprSee }} <a @click="$emit('navigate', 'privacy-policy')" class="inner-link">{{ t.privacyLink }}</a>.</p>
      </section>

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
  title: 'Mentions légales',
  editor: 'Éditeur',
  editorDesc: 'est un projet personnel développé et maintenu par',
  contact: 'Contact',
  hosting: 'Hébergement',
  hostingDesc: 'Base de données & authentification : Supabase (PostgreSQL)',
  ip: 'Propriété intellectuelle',
  ipDesc: "L'ensemble du contenu du site est la propriété de MartiniPlease ou de ses partenaires. Toute reproduction sans autorisation est interdite. Les recettes sont inspirées de classiques librement disponibles.",
  liability: 'Responsabilité',
  liabilityDesc: 'Le site est fourni "en l\'état". MartiniPlease décline toute responsabilité en cas d\'erreur, d\'interruption ou d\'utilisation inappropriée des informations fournies.',
  gdpr: 'Données personnelles & CNIL',
  gdprDesc: 'Les données sont traitées conformément au RGPD. Pour toute réclamation :',
  gdprSee: 'Voir notre',
  privacyLink: 'Politique de confidentialité',
  updated: 'Dernière mise à jour',
} : {
  back: 'Back',
  title: 'Legal Notice',
  editor: 'Publisher',
  editorDesc: 'is a personal project developed and maintained by',
  contact: 'Contact',
  hosting: 'Hosting',
  hostingDesc: 'Database & authentication: Supabase (PostgreSQL)',
  ip: 'Intellectual Property',
  ipDesc: 'All site content is the property of MartiniPlease or its partners. Any reproduction without authorization is prohibited. Recipes are inspired by freely available classics.',
  liability: 'Liability',
  liabilityDesc: 'The site is provided "as is". MartiniPlease disclaims any liability for errors, interruptions, or inappropriate use of the information provided.',
  gdpr: 'Personal Data & GDPR',
  gdprDesc: 'Data is processed in accordance with the GDPR. To file a complaint:',
  gdprSee: 'See our',
  privacyLink: 'Privacy Policy',
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
.inner-link { cursor: pointer; }
.legal-date {
  font-size: 0.75rem;
  color: var(--text-dim, #6b7280);
  margin-top: 2rem;
}
</style>