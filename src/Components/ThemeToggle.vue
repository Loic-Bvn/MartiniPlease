<template>
  <div
    class="settings-switch"
    role="group"
    aria-label="Theme switch"
    @click="setTheme(!isDark)"
  >
    <button
      type="button"
      class="view-toggle-btn"
      :class="{ 'view-toggle-btn--active': !isDark }"
      :title="'Switch to light mode'"
    >
      <Sun :size="16" />
    </button>
    <button
      type="button"
      class="view-toggle-btn"
      :class="{ 'view-toggle-btn--active': isDark }"
      :title="'Switch to dark mode'"
    >
      <Moon :size="16" />
    </button>
  </div>
</template>

<script setup>
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

// État partagé (singleton) : évite la désynchronisation entre les
// différentes instances de ThemeToggle (header principal + vue carte).
const { isDark, setTheme } = useTheme()
</script>
