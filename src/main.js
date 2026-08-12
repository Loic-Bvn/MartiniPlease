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
  await initAuth()
  app.mount('#app')
}

bootstrap()