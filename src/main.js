import { createApp } from 'vue'
import './assets/styles.css'
import './assets/improvements.css'
import App from './App.vue'
import { useAuth } from '@/composables/useAuth'
import { initAnalytics } from '@/lib/analytics'
import { initMonitoring } from '@/lib/monitoring'

async function bootstrap() {
  initAnalytics()
  const app = createApp(App)
  initMonitoring(app)
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