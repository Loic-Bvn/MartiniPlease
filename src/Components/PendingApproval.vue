<!--
  PendingApproval.vue
  Affiché à la place de l'appli bartender tant que bar.status !== 'approved'.
  Voir INTEGRATION_GUIDE.md pour le point de branchement dans CocktailMenuApp.vue.
-->
<template>
  <div class="pending-approval">
    <div class="pending-card">
      <template v-if="status === 'pending'">
        <div class="icon">⏳</div>
        <h2>Ton bar est en cours de validation</h2>
        <p>
          Merci pour ton inscription ! Pour limiter les créations abusives,
          chaque nouveau bar est vérifié manuellement avant activation.
        </p>
        <p class="sub">
          Tu recevras l'accès dès que ce sera validé — généralement sous 24 à 48h.
        </p>
      </template>

      <template v-else-if="status === 'rejected'">
        <div class="icon">✖️</div>
        <h2>Inscription refusée</h2>
        <p>
          Ton inscription n'a pas pu être validée. Si tu penses qu'il s'agit
          d'une erreur, contacte-nous.
        </p>
      </template>

      <button class="btn-signout" @click="signOut">Se déconnecter</button>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

const { barStatus: status, signOut } = useAuth()
</script>

<style scoped>
.pending-approval {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.pending-card {
  max-width: 420px;
  text-align: center;
  padding: 40px 28px;
  border-radius: 16px;
  background: var(--surface, #fff);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.icon {
  font-size: 40px;
  margin-bottom: 16px;
}

h2 {
  margin: 0 0 12px;
  font-size: 1.25rem;
}

p {
  margin: 0 0 8px;
  color: var(--text-secondary, #666);
  line-height: 1.5;
}

.sub {
  font-size: 0.9rem;
}

.btn-signout {
  margin-top: 24px;
  padding: 10px 20px;
  border: 1px solid var(--border, #ddd);
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
}

.btn-signout:hover {
  background: var(--surface-hover, #f5f5f5);
}
</style>
