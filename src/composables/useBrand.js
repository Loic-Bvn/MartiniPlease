// composables/useBrand.js
// Identité visuelle "par bar".
//
// Deux identités cohabitent :
//   • default      → MartiniPlease (thème standard, tous les bars)
//   • porte-bleue  → Porte Bleue Cocktail Club (skin de marque)
//
// Le skin s'active quand on ENTRE dans un bar dont `features.theme` vaut
// 'porte-bleue' (colonne jsonb `bars.features`, aucune migration SQL), et
// disparaît dès qu'on en sort. Voir supabase/porte_bleue_theme.sql.
//
// La porte d'accueil pointe vers le bar qui porte ce thème (cf. fetchPorteBleueBar
// dans CocktailMenuApp) : aucune variable d'environnement à configurer.
//
// ⚠️  SINGLETON : `activeKey` est au niveau module (état partagé).

import { ref, computed, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

export const PORTE_BLEUE_THEME = 'porte-bleue'

const BRANDS = {
  default: {
    key: 'default',
    name: 'MartiniPlease',
    pageTitle: 'MartiniPlease',
    themeColor: { light: '#f8f5ee', dark: '#181510' },
  },
  'porte-bleue': {
    key: 'porte-bleue',
    name: 'Porte Bleue Cocktail Club',
    pageTitle: 'Porte Bleue Cocktail Club',
    themeColor: { light: '#1f4c8f', dark: '#0b121c' },
  },
}

const activeKey = ref('default')
const { isDark } = useTheme()

// <html data-brand>, <title> et <meta theme-color> suivent l'identité active
// (et le mode clair/sombre, pour la barre du navigateur mobile).
watch([activeKey, isDark], () => {
  const brand = BRANDS[activeKey.value]
  const root = document.documentElement

  if (brand.key === 'default') root.removeAttribute('data-brand')
  else root.setAttribute('data-brand', brand.key)

  document.title = brand.pageTitle

  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = isDark.value ? brand.themeColor.dark : brand.themeColor.light
}, { immediate: true })

export function useBrand() {
  const brand = computed(() => BRANDS[activeKey.value])
  const isPorteBleue = computed(() => activeKey.value === 'porte-bleue')

  // Thème inconnu / absent → identité standard.
  function setBrandTheme(theme) {
    activeKey.value = BRANDS[theme] ? theme : 'default'
  }

  return { brand, isPorteBleue, setBrandTheme }
}
