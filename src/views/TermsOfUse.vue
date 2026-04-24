<template>
  <div class="legal-page">
    <div class="legal-container">
      <button @click="$emit('back')" class="back-link">← {{ t.back }}</button>
      <h1 class="legal-title">{{ t.title }}</h1>

      <section>
        <h2>{{ t.acceptance }}</h2>
        <p>{{ t.acceptanceDesc }}</p>
      </section>

      <section>
        <h2>{{ t.usage }}</h2>
        <p>{{ t.usageDesc }}</p>
      </section>

      <section>
        <h2>{{ t.account }}</h2>
        <p>{{ t.accountDesc }}</p>
      </section>

      <section>
        <h2>{{ t.liability }}</h2>
        <p>{{ t.liabilityDesc }}</p>
      </section>

      <section>
        <h2>{{ t.ip }}</h2>
        <p>{{ t.ipDesc }}</p>
      </section>

      <section>
        <h2>{{ t.termination }}</h2>
        <p>{{ t.terminationDesc }}</p>
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

defineEmits(['back'])

const currentDate = computed(() =>
  new Date().toLocaleDateString(props.locale === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
)

const t = computed(() => props.locale === 'fr' ? {
  back: 'Retour',
  title: "Conditions d'utilisation",
  acceptance: 'Acceptation',
  acceptanceDesc: "En utilisant MartiniPlease, vous acceptez ces conditions. Le site est réservé aux personnes majeures (18+ ou âge légal de votre pays).",
  usage: 'Utilisation',
  usageDesc: "Vous vous engagez à ne pas utiliser le site à des fins illégales, à ne pas contourner les mesures de sécurité, ne pas scraper le contenu, et à respecter les droits d'auteur.",
  account: 'Compte utilisateur',
  accountDesc: "Vous êtes responsable de la confidentialité de votre compte et de toutes les activités qui s'y déroulent. Informez-nous immédiatement de toute utilisation non autorisée.",
  liability: 'Responsabilité',
  liabilityDesc: 'Le site est fourni "en l\'état" sans garantie. MartiniPlease n\'est pas responsable des dommages indirects liés à l\'utilisation de la plateforme ni de l\'utilisation des recettes proposées.',
  ip: 'Propriété intellectuelle',
  ipDesc: "Tout contenu du site (design, textes, logos) est la propriété de MartiniPlease. Toute reproduction sans permission écrite est interdite.",
  termination: 'Résiliation & droit applicable',
  terminationDesc: "MartiniPlease peut suspendre tout compte en cas de violation. Ces conditions sont régies par le droit français, juridiction compétente en France.",
  questions: 'Questions',
  updated: 'Dernière mise à jour',
} : {
  back: 'Back',
  title: 'Terms of Use',
  acceptance: 'Acceptance',
  acceptanceDesc: 'By using MartiniPlease, you agree to these terms. The site is intended for adults (18+ or the legal age in your country).',
  usage: 'Usage',
  usageDesc: 'You agree not to use the site for illegal purposes, not to circumvent security measures, not to scrape content, and to respect intellectual property rights.',
  account: 'User Account',
  accountDesc: 'You are responsible for the confidentiality of your account and all activities that occur under it. Notify us immediately of any unauthorized use.',
  liability: 'Liability',
  liabilityDesc: 'The site is provided "as is" without warranty. MartiniPlease is not liable for indirect damages related to use of the platform or the recipes provided.',
  ip: 'Intellectual Property',
  ipDesc: 'All site content (design, text, logos) is the property of MartiniPlease. Any reproduction without written permission is prohibited.',
  termination: 'Termination & Governing Law',
  terminationDesc: 'MartiniPlease may suspend any account in the event of a violation. These terms are governed by French law, with jurisdiction in France.',
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