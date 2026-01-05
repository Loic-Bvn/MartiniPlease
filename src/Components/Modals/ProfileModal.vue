<!-- PROFILE HANDLER POP UP -->
<template>
  <div 
    class="profile-modal-overlay"
    @click.self="onClose"
  >
    <div class="profile-modal-content">
      <!-- Header -->
      <div class="profile-modal-header">
        <h2 class="profile-modal-title">
          <Users :size="24" />
          Gestion des profils
        </h2>
        <button 
          @click="onClose" 
          class="profile-modal-close"
          aria-label="Fermer"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Création de profil -->
      <div class="profile-create-section">
        <input
          v-if="!isBartenderMode"
          type="text"
          v-model="newProfileName"
          @keypress.enter="handleCreate"
          placeholder="Nom du nouveau profil..."
          class="profile-form-input"
        />
        <button
          v-if="!isBartenderMode"
          @click="handleCreate"
          class="profile-btn-add"
          :disabled="!newProfileName.trim()"
        >
          <UserPlus :size="20" />
        </button>
      </div>

      <!-- Liste des profils -->
      <div>
        <h3 class="profile-list-title">Profils existants</h3>
        
        <div v-if="profiles && profiles.length > 0" class="profile-list">
          <div
            v-for="profile in profiles"
            :key="profile.id"
            class="profile-item"
          >
            <div class="profile-info">
              <User :size="18" class="flex-shrink-0" />
              <span class="profile-name">{{ profile.name }}</span>
              <span
                v-if="currentProfile === profile.id"
                class="profile-badge"
              >
                Actif
              </span>
            </div>
            
            <div class="profile-actions">
              <button
                v-if="(currentProfile !== profile.id) && !isBartenderMode"
                @click="() => onSelect(profile.id)"
                class="profile-btn-select"
              >
                Sélectionner
              </button>
              <!-- Bouton de suppression visible uniquement en mode bartender -->
              <button
                v-if="isBartenderMode"
                @click="() => handleDelete(profile.id)"
                class="profile-btn-delete"
                :disabled="currentProfile === profile.id"
                aria-label="Supprimer le profil"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="profile-empty-state">
          Aucun profil créé. Créez-en un pour commencer !
        </div>
      </div>

      <!-- Message informatif si pas en mode bartender -->
      <div v-if="!isBartenderMode && profiles.length > 0" class="profile-info-box">
        <p>
          💡 Passez en mode bartender pour supprimer des profils
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { User, Users, UserPlus, Trash2, X } from 'lucide-vue-next';

const props = defineProps({
  profiles: {
    type: Array,
    default: () => []
  },
  currentProfile: {
    type: [String, Number],
    default: null
  },
  isBartenderMode: {
    type: Boolean,
    default: false
  },
  onClose: {
    type: Function,
    required: true
  },
  onCreate: {
    type: Function,
    required: true
  },
  onSelect: {
    type: Function,
    required: true
  },
  onDelete: {
    type: Function,
    required: true
  }
});

const newProfileName = ref('');

function handleCreate() {
  if (newProfileName.value.trim()) {
    props.onCreate(newProfileName.value.trim());
    newProfileName.value = '';
  }
}

function handleDelete(profileId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce profil et toutes ses données ?')) {
    props.onDelete(profileId);
  }
}
</script>

<style scoped>
/* Tous les styles sont centralisés dans styles.css */
</style>