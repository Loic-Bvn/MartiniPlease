<template>
  <div class="legal-page">
    <div class="legal-container">
      <button @click="$emit('back')" class="back-link">← {{ t.back }}</button>
      <h1 class="legal-title">{{ t.title }}</h1>

      <section>
        <h2>{{ t.controller }}</h2>
        <p><strong>Loïc B.</strong> — <a href="mailto:loic.bienvenu.pro@gmail.com">loic.bienvenu.pro@gmail.com</a></p>
      </section>

      <section>
        <h2>{{ t.dataCollected }}</h2>
        <p>
          <strong>{{ t.bartenders }}</strong> {{ t.bartendersDesc }}<br>
          <strong>{{ t.drinkers }}</strong> {{ t.drinkersDesc }}<br>
          <strong>{{ t.automatically }}</strong> {{ t.automaticallyDesc }}
        </p>
      </section>

      <section>
        <h2>{{ t.purposes }}</h2>
        <p>{{ t.purposesDesc }}</p>
      </section>

      <section>
        <h2>{{ t.sharing }}</h2>
        <p>{{ t.sharingDesc }}</p>
      </section>

      <section>
        <h2>{{ t.retention }}</h2>
        <p>{{ t.retentionDesc }}</p>
      </section>

      <section>
        <h2>{{ t.rights }}</h2>
        <p>{{ t.rightsDesc }} <a href="mailto:loic.bienvenu.pro@gmail.com">loic.bienvenu.pro@gmail.com</a><br>
        {{ t.rightsCnil }} <a href="https://www.cnil.fr" target="_blank">CNIL</a>.</p>
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
  title: 'Politique de confidentialité',
  controller: 'Responsable du traitement',
  dataCollected: 'Données collectées',
  bartenders: 'Bartenders :',
  bartendersDesc: 'email, mot de passe (hashé par Supabase), configuration des bars et recettes créées.',
  drinkers: 'Drinkers :',
  drinkersDesc: 'pseudo optionnel, cocktails favoris, historique de commandes. Aucune authentification requise.',
  automatically: 'Automatiquement :',
  automaticallyDesc: 'adresse IP, navigateur, pages visitées (journaux serveur standards).',
  purposes: 'Finalités',
  purposesDesc: "Gestion des comptes, traitement des commandes, amélioration du service, prévention des fraudes, respect des obligations légales.",
  sharing: 'Partage des données',
  sharingDesc: 'Données partagées uniquement avec Supabase (stockage/auth) et OVH Cloud (hébergement), et si requis par la loi. Vos données ne sont jamais vendues ni partagées commercialement.',
  retention: 'Conservation',
  retentionDesc: 'Données de compte : durée d\'activité + 2 ans. Données de transaction : 5 ans. Logs : 13 mois.',
  rights: 'Vos droits (RGPD)',
  rightsDesc: 'Accès, rectification, suppression, limitation, portabilité, opposition. Pour exercer ces droits :',
  rightsCnil: 'Réclamation possible auprès de la',
  updated: 'Dernière mise à jour',
} : {
  back: 'Back',
  title: 'Privacy Policy',
  controller: 'Data Controller',
  dataCollected: 'Data Collected',
  bartenders: 'Bartenders:',
  bartendersDesc: 'email, password (hashed by Supabase), bar configuration and created recipes.',
  drinkers: 'Drinkers:',
  drinkersDesc: 'optional username, favourite cocktails, order history. No authentication required.',
  automatically: 'Automatically:',
  automaticallyDesc: 'IP address, browser, pages visited (standard server logs).',
  purposes: 'Purposes',
  purposesDesc: 'Account management, order processing, service improvement, fraud prevention, legal compliance.',
  sharing: 'Data Sharing',
  sharingDesc: 'Data shared only with Supabase (storage/auth) and OVH Cloud (hosting), and when required by law. Your data is never sold or shared commercially.',
  retention: 'Retention',
  retentionDesc: 'Account data: activity period + 2 years. Transaction data: 5 years. Logs: 13 months.',
  rights: 'Your Rights (GDPR)',
  rightsDesc: 'Access, rectification, deletion, restriction, portability, objection. To exercise these rights:',
  rightsCnil: 'You may also lodge a complaint with the',
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
.legal-date {
  font-size: 0.75rem;
  color: var(--text-dim, #6b7280);
  margin-top: 2rem;
}
</style>