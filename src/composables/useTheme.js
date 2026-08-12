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

const media = window.matchMedia('(prefers-color-scheme: dark)')

function getInitialIsDark() {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return media.matches
}

const isDark = ref(getInitialIsDark())
applyTheme(isDark.value)

function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark)
}

// Si l'utilisateur n'a jamais choisi explicitement (pas de 'theme' en
// localStorage), on suit le thème de l'OS en live — y compris s'il change
// pendant que l'app est ouverte (bascule jour/nuit auto de l'appareil, etc).
// Dès que l'utilisateur clique le toggle (setTheme), on sort de ce mode auto.
media.addEventListener('change', (e) => {
    if (localStorage.getItem('theme')) return
    isDark.value = e.matches
    applyTheme(isDark.value)
})

export function useTheme() {
    function setTheme(nextDark) {
        isDark.value = nextDark
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
        applyTheme(isDark.value)
    }

    function toggleTheme() {
        setTheme(!isDark.value)
    }

    // Repasse en mode "suit l'OS" (efface le choix explicite sauvegardé).
    function useSystemTheme() {
        localStorage.removeItem('theme')
        isDark.value = media.matches
        applyTheme(isDark.value)
    }

    return {
        isDark,
        setTheme,
        toggleTheme,
        useSystemTheme,
    }
}
