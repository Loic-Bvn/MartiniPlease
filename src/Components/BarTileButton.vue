<template>
  <button
    type="button"
    :class="['expand-actions-btn', 'bar-tile-button', { 'bar-tile-button--open': toggle && open }]"
    :aria-expanded="toggle ? open : undefined"
    @click="$emit('activate')"
  >
    <ChevronDown v-if="toggle" :size="18" :class="{ rotated: open }" aria-hidden="true" />
    <span class="section-title">
      <component :is="icon" :size="20" class="tile-ico" aria-hidden="true" />
      <span class="tile-lbl"><slot name="label">{{ label }}</slot></span>
      <slot name="badge" />
    </span>
  </button>
</template>

<script setup>
import { ChevronDown } from 'lucide-vue-next'

defineProps({
  icon: { type: [Object, Function], required: true },
  label: { type: String, required: true },
  toggle: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
})

defineEmits(['activate'])
</script>
