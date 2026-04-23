<template>
  <div class="main-content">
    <div class="welcome-screen">
      <img :src="randomLogo" alt="Martini Please" class="welcome-logo" />
      <h2 class="welcome-title">{{ locale === 'fr' ? 'Gérer vos bars' : 'Manage your bars' }}</h2>
      <p class="welcome-subtitle">{{ locale === 'fr' ? 'Créez, sélectionnez ou supprimez vos bars.' : 'Create, select or delete your bars.' }}</p>
      
      <!-- Bouton créer nouveau bar -->
      <div class="bars-management-header">
        <button v-if="!showNewBarInput" @click="showNewBarInput = true" class="btn-create-bar">
          <Plus :size="16" />
          {{ locale === 'fr' ? 'Créer un nouveau bar' : 'Create new bar' }}
        </button>
        <div v-else class="new-bar-input-group">
          <input
            :value="newBarName"
            @input="$emit('update:newBarName', $event.target.value)"
            type="text"
            :placeholder="locale === 'fr' ? 'Nom du bar...' : 'Bar name...'"
            class="new-bar-input"
            @keyup.enter="$emit('create-new-bar')"
            @keyup.esc="showNewBarInput = false"
            autofocus
          />
          <button @click="$emit('create-new-bar')" class="btn-confirm" title="Créer">
            <Plus :size="14" />
          </button>
          <button @click="showNewBarInput = false" class="btn-cancel" title="Annuler">
            <X :size="14" />
          </button>
        </div>
      </div>
      
      <!-- Liste des bars -->
      <div class="welcome-cards bars-management-list">
        <div v-for="b in bars" :key="b.id" class="welcome-card bar-management-card">
          <!-- Mode édition -->
          <div v-if="editingBarId === b.id" class="bar-edit-mode">
            <div class="edit-field-group">
              <label class="edit-field-label">{{ locale === 'fr' ? 'Nom du bar:' : 'Bar name:' }}</label>
              <input 
                :value="editingBarName"
                @input="$emit('update:editingBarName', $event.target.value)"
                type="text" 
                class="edit-field-input"
                :placeholder="locale === 'fr' ? 'Nom du bar...' : 'Bar name...'"
                autofocus
              />
            </div>
            <div class="edit-field-group">
              <label class="edit-field-label">{{ locale === 'fr' ? 'Code d\'invitation:' : 'Invite code:' }}</label>
              <input 
                :value="editingBarCode"
                @input="$emit('update:editingBarCode', $event.target.value)"
                type="text" 
                class="edit-field-input"
                :placeholder="locale === 'fr' ? 'Code d\'invitation...' : 'Invite code...'"
              />
            </div>
            <div class="bar-edit-actions">
              <button @click="$emit('save-bar-edits', b.id)" :disabled="updatingBarId === b.id" class="btn-confirm">
                {{ updatingBarId === b.id ? '⏳' : '✓' }} {{ locale === 'fr' ? 'Sauvegarder' : 'Save' }}
              </button>
              <button @click="$emit('cancel-edit-bar')" :disabled="updatingBarId === b.id" class="btn-cancel">
                {{ locale === 'fr' ? 'Annuler' : 'Cancel' }}
              </button>
            </div>
          </div>
          <!-- Mode affichage -->
          <div v-else>
            <div class="bar-header">
              <span class="welcome-card-icon">🍾</span>
              
              <!-- Infos -->
              <div style="flex: 1;">
                <div class="bar-title-row">
                  <div class="welcome-card-title">{{ b.name }}</div>

                  <span v-if="b.is_public" class="bar-status-badge public">🌐 Public</span>
                  <span v-else class="bar-status-badge private">🔒 {{ locale === 'fr' ? 'Privé' : 'Private' }}</span>
                </div>

                <div class="welcome-card-desc">
                  Code : <code>{{ b.invite_code }}</code>
                </div>
              </div>

              <!-- Stats à droite -->
              <div class="bar-stats" @mouseenter="$emit('load-bar-stats', b.id)">
                <div class="bar-stat">
                  <div class="bar-stat-value">{{ barStatsMap[b.id]?.cocktails ?? '-' }}</div>
                  <div class="bar-stat-label">Cocktails</div>
                </div>
                <div class="bar-stat">
                  <div class="bar-stat-value">{{ barStatsMap[b.id]?.cards ?? '-' }}</div>
                  <div class="bar-stat-label">{{ locale === 'fr' ? 'Cartes' : 'Cards' }}</div>
                </div>
              </div>
            </div>

            <div class="bar-actions-new">
              <div class="bar-actions-small">
                <button @click="$emit('select-bar', b)" class="btn-select-bar-large">
                  <Check :size="18" /> {{ locale === 'fr' ? 'Sélectionner' : 'Select' }}
                </button>
                <button @click="$emit('start-edit-bar', b)" class="btn-action-small"><Pencil :size="14" /></button>
                <button @click="$emit('start-delete-bar', b)" class="btn-action-small btn-action-small--danger"><Trash2 :size="14" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal de confirmation de suppression -->
      <transition name="fade">
        <div v-if="barToDelete" class="modal-overlay" @click.self="$emit('close-delete-modal')">
          <div class="modal-container modal-container--delete-bar">
            <div class="modal-header">
              <h2 class="modal-title">{{ locale === 'fr' ? '⚠️ Supprimer le bar' : '⚠️ Delete bar' }}</h2>
              <button @click="$emit('close-delete-modal')" class="btn-icon btn-icon--close">
                <X :size="20" />
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-warning">
                {{ locale === 'fr' 
                  ? `Êtes-vous sûr de vouloir supprimer le bar "${barToDelete.name}" ?` 
                  : `Are you sure you want to delete the bar "${barToDelete.name}"?` 
                }}
              </p>
              <p class="delete-hint">
                {{ locale === 'fr' 
                  ? 'Cette action est irréversible. Écrivez le mot de confirmation ci-dessous.' 
                  : 'This action is irreversible. Type the confirmation word below.' 
                }}
              </p>
              <div class="delete-confirmation-group">
                <label class="delete-confirmation-label">
                  {{ locale === 'fr' ? 'Écrivez' : 'Type' }} <strong>{{ barToDelete.name }}</strong> {{ locale === 'fr' ? 'pour confirmer:' : 'to confirm:' }}
                </label>
                <input
                  :value="deleteConfirmationInput"
                  @input="$emit('update:deleteConfirmationInput', $event.target.value)"
                  type="text"
                  :placeholder="barToDelete.name"
                  class="field-input delete-confirmation-input"
                  @keyup.enter="$emit('delete-bar')"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button @click="$emit('close-delete-modal')" class="btn-modal-secondary">
                {{ locale === 'fr' ? 'Annuler' : 'Cancel' }}
              </button>
              <button
                @click="$emit('delete-bar')"
                :disabled="deleteConfirmationInput !== barToDelete.name"
                class="btn-modal-danger"
              >
                {{ locale === 'fr' ? 'Supprimer' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-vue-next'

const props = defineProps({
  randomLogo: String,
  locale: String,
  bars: Array,
  barStatsMap: Object,
  editingBarId: String,
  editingBarName: String,
  editingBarCode: String,
  updatingBarId: String,
  newBarName: String,
  showNewBarInput: Boolean,
  barToDelete: Object,
  deleteConfirmationInput: String,
})

const emit = defineEmits([
  'create-new-bar',
  'select-bar',
  'start-edit-bar',
  'save-bar-edits',
  'cancel-edit-bar',
  'start-delete-bar',
  'load-bar-stats',
  'close-delete-modal',
  'delete-bar',
  'update:newBarName',
  'update:editingBarName',
  'update:editingBarCode',
  'update:deleteConfirmationInput'
])

const showNewBarInput = ref(false)
</script>