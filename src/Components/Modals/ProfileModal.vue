<template>
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="onClose"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users class="text-blue-600" :size="24" />
          Gestion des profils
        </h2>
        <button 
          @click="onClose" 
          class="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Fermer"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Création de profil -->
      <div class="mb-6">
        <div class="flex gap-2">
          <input
            type="text"
            v-model="newProfileName"
            @keypress.enter="handleCreate"
            placeholder="Nom du nouveau profil..."
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
          />
          <button
            @click="handleCreate"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!newProfileName.trim()"
          >
            <UserPlus :size="20" />
          </button>
        </div>
      </div>

      <!-- Liste des profils -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Profils existants</h3>
        
        <div v-if="profiles && profiles.length > 0" class="space-y-2 max-h-80 overflow-y-auto pr-2">
          <div
            v-for="profile in profiles"
            :key="profile.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <User :size="18" class="text-gray-600 flex-shrink-0" />
              <span class="font-medium truncate">{{ profile.name }}</span>
              <span
                v-if="currentProfile === profile.id"
                class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded flex-shrink-0"
              >
                Actif
              </span>
            </div>
            
            <div class="flex gap-2 flex-shrink-0 ml-2">
              <button
                v-if="currentProfile !== profile.id"
                @click="() => onSelect(profile.id)"
                class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Sélectionner
              </button>
              <button
                @click="() => handleDelete(profile.id)"
                class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="currentProfile === profile.id"
                aria-label="Supprimer le profil"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center text-gray-500 text-sm py-8 bg-gray-50 rounded-lg">
          Aucun profil créé. Créez-en un pour commencer !
        </div>
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
/* Scrollbar personnalisée */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>