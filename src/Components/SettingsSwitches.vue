<template>
  <!-- Menu burger : mêmes lignes à switch que les options bartender -->
  <div v-if="layout === 'stacked'" class="settings-switches settings-switches--stacked">
    <button type="button" class="burger-item burger-item--toggle" @click="$emit('set-locale', locale === 'fr' ? 'en' : 'fr')">
      <Languages :size="15" />
      <span>{{ locale === 'fr' ? 'Langue' : 'Language' }} <b class="setting-value">{{ locale === 'fr' ? 'FR' : 'EN' }}</b></span>
      <div class="toggle-switch" :class="{ on: locale === 'en' }"><div class="toggle-knob"></div></div>
    </button>

    <button v-if="showUnit" type="button" class="burger-item burger-item--toggle" @click="$emit('set-unit', unit === 'oz' ? 'ml' : 'oz')">
      <Ruler :size="15" />
      <span>{{ locale === 'fr' ? 'Quantité' : 'Quantity' }} <b class="setting-value">{{ unit === 'oz' ? 'oz' : 'ml' }}</b></span>
      <div class="toggle-switch" :class="{ on: unit === 'oz' }"><div class="toggle-knob"></div></div>
    </button>

    <button type="button" class="burger-item burger-item--toggle" @click="setTheme(!isDark)">
      <component :is="isDark ? Moon : Sun" :size="15" />
      <span>{{ locale === 'fr' ? 'Mode sombre' : 'Dark mode' }}</span>
      <div class="toggle-switch" :class="{ on: isDark }"><div class="toggle-knob"></div></div>
    </button>
  </div>

  <!-- Header : switches segmentés côte à côte (mise en page inchangée) -->
  <div v-else class="settings-switches settings-switches--inline">
    <SegmentedSwitch
      :model-value="locale"
      :options="localeOptions"
      aria-label="Language switch"
      @update:model-value="$emit('set-locale', $event)"
    />

    <SegmentedSwitch
      v-if="showUnit"
      :model-value="unit"
      :options="unitOptions"
      aria-label="Unit switch"
      @update:model-value="$emit('set-unit', $event)"
    />

    <ThemeToggle />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Languages, Ruler, Sun, Moon } from 'lucide-vue-next'
import SegmentedSwitch from '@/Components/SegmentedSwitch.vue'
import ThemeToggle from '@/Components/ThemeToggle.vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps({
  locale: String,
  unit: String,
  showUnit: Boolean,
  // 'inline' : réglages côte à côte dans le header
  // 'stacked' : lignes à switch dans le menu burger
  layout: { type: String, default: 'inline' },
})
defineEmits(['set-locale', 'set-unit'])

const { isDark, setTheme } = useTheme()

const localeTitle = computed(() => props.locale === 'fr' ? 'Switch to English' : 'Passer en français')
const localeOptions = computed(() => [
  { value: 'fr', label: 'FR', title: localeTitle.value },
  { value: 'en', label: 'EN', title: localeTitle.value },
])

const unitTitle = computed(() => props.unit === 'oz' ? 'Passer en ml' : 'Switch to oz')
const unitOptions = computed(() => [
  { value: 'oz', label: 'oz', title: unitTitle.value },
  { value: 'ml', label: 'ml', title: unitTitle.value },
])
</script>

<style scoped>
/* inline : les enfants se comportent comme s'ils étaient directement dans .header-actions */
.settings-switches--inline { display: contents; }

/* valeur courante, à côté du libellé fixe */
.setting-value {
  margin-left: 0.3rem;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(201, 168, 76, 0.16);
  color: var(--gold);
  font-size: 0.72em;
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>