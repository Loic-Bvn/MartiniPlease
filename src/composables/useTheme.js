// composables/useTheme.js
// Thème clair/sombre — état centralisé (comme useUIState/useToast).
//
// ⚠️ Avant ce composable, ThemeToggle.vue gérait son `isDark` dans un ref
//    local à CHAQUE instance du composant. Comme <ThemeToggle /> est monté
//    à la fois dans AppHeader ET dans MenuCardView, on se retrouvait avec
//    deux états indépendants qui pouvaient diverger (l'un affichait "clair"
//    actif pendant que l'autre affichait "sombre" actif) → bug des
//    "plusieurs thèmes sombres". Un seul singleton partagé règle ça.
//
// ⚠️  SINGLETON : le ref est au niveau module → état partagé dans toute l'appli.

import { ref } from 'vue'

function getInitialIsDark() {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const isDark = ref(getInitialIsDark())
applyTheme(isDark.value)

function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark)
}

export function useTheme() {
    function setTheme(nextDark) {
        isDark.value = nextDark
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
        applyTheme(isDark.value)
    }

    function toggleTheme() {
        setTheme(!isDark.value)
    }

    return {
        isDark,
        setTheme,
        toggleTheme,
    }
}
