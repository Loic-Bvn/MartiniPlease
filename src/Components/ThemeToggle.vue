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
import { ref, onMounted } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

const isDark = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

function setTheme(nextDark) {
  isDark.value = nextDark
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>