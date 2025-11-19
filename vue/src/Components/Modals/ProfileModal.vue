<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users class="text-blue-600" :size="24" />
          Gestion des profils
        </h2>
        <button @click="onClose" class="p-1 hover:bg-gray-100 rounded">
          <X :size="20" />
        </button>
      </div>
      <div class="space-y-4">
        <div class="flex gap-2">
          <input
            type="text"
            v-model="newProfileName"
            @keypress.enter="handleCreate"
            placeholder="Nom du nouveau profil..."
            class="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            @click="handleCreate"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus :size="20" />
          </button>
        </div>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="profile in profiles"
            :key="profile.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <User :size="18" class="text-gray-600" />
              <span class="font-medium">{{ profile.name }}</span>
              <span
                v-if="currentProfile === profile.id"
                class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
              >Actif</span>
            </div>
            <div class="flex gap-2">
              <button
                v-if="currentProfile !== profile.id"
                @click="() => onSelect(profile.id)"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sélectionner
              </button>
              <button
                @click="() => onDelete(profile.id)"
                class="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
        <p v-if="profiles.length === 0" class="text-center text-gray-500 text-sm py-4">
          Aucun profil créé
        </p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { User, Users, UserPlus, Trash2, X } from 'lucide-vue-next';

const props = defineProps({
  profiles: Array,
  currentProfile: [String, Number],
  onClose: Function,
  onCreate: Function,
  onSelect: Function,
  onDelete: Function
});

const newProfileName = ref('');

function handleCreate() {
  if (newProfileName.value.trim()) {
    props.onCreate(newProfileName.value.trim());
    newProfileName.value = '';
  }
}
</script>
<style scoped>
/* À compléter si besoin */
</style>