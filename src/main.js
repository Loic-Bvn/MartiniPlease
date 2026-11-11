import { createApp } from 'vue'
import './assets/styles.css'
import './assets/styles_skin_luxe.css'
import './assets/styles_skin_luxe_emerald.css'
import './assets/styles_skin_luxe_bordeaux.css'
import './assets/styles_skin_classic.css'
// import './assets/styles_skin_color.css'
// import './assets/styles_skin_brasserie.css'
// import './assets/styles_skin_craft.css'
import './assets/styles_skin_minimal.css'
import App from './App.vue'
import { useAuth } from '@/composables/useAuth'

async function bootstrap() {
  const app = createApp(App)
  const { initAuth } = useAuth()
  try {
    await Promise.race([
      initAuth(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('initAuth timeout (5s)')), 5000)
      )
    ])
  } catch (err) {
    console.error('❌ initAuth a échoué ou a expiré, montage de l\'app quand même:', err)
  }
  app.mount('#app')
}

bootstrap()