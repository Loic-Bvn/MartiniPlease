<!--
  SegmentedSwitch.vue
  Switch segmenté à deux options (FR/EN, oz/ml, clair/sombre, compact/standard…).
  Un clic n'importe où sur le switch bascule vers l'autre option.
  Le style (bicolore : option active inversée par rapport à l'inactive) est
  porté par .settings-switch / .view-toggle-btn dans assets/styles.css.

  Usage :
    <SegmentedSwitch
      v-model="locale"
      aria-label="Language switch"
      :options="[{ value: 'fr', label: 'FR' }, { value: 'en', label: 'EN' }]"
    />
  Option : { value, label?, icon?, title? } — `icon` = composant lucide.
  Si icon + label, le label reçoit .view-toggle-label (masqué en très petit écran).
-->
<template>
  <div
    class="settings-switch"
    role="group"
    :aria-label="ariaLabel"
    @click="toggle"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="view-toggle-btn"
      :class="{ 'view-toggle-btn--active': opt.value === modelValue }"
      :title="opt.title ?? opt.label"
      :aria-pressed="opt.value === modelValue"
    >
      <component :is="opt.icon" v-if="opt.icon" :size="iconSize" />
      <span v-if="opt.label" :class="{ 'view-toggle-label': opt.icon }">{{ opt.label }}</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: null },
  options: { type: Array, required: true },
  ariaLabel: { type: String, default: undefined },
  iconSize: { type: Number, default: 16 },
})
const emit = defineEmits(['update:modelValue'])

function toggle() {
  const other = props.options.find(o => o.value !== props.modelValue)
  if (other) emit('update:modelValue', other.value)
}
</script>
