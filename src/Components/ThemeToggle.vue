<template>
  <SegmentedSwitch
    :model-value="isDark ? 'dark' : 'light'"
    :options="options"
    aria-label="Theme switch"
    @update:model-value="setTheme($event === 'dark')"
  />
</template>

<script setup>
import { Sun, Moon } from 'lucide-vue-next'
import SegmentedSwitch from '@/Components/SegmentedSwitch.vue'
import { useTheme } from '@/composables/useTheme'

// État partagé (singleton) : évite la désynchronisation entre les
// différentes instances de ThemeToggle (header principal + vue carte).
const { isDark, setTheme } = useTheme()

const options = [
  { value: 'light', icon: Sun,  title: 'Switch to light mode' },
  { value: 'dark',  icon: Moon, title: 'Switch to dark mode' },
]
</script>
