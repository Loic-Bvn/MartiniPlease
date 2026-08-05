import { createApp } from 'vue'
import './assets/styles.css'
import './assets/improvements.css'
import App from './App.vue'
import { useAuth } from '@/composables/useAuth'

async function bootstrap() {
  console.log('🚀 bootstrap')

  const { initAuth } = useAuth()

  console.log('➡️ avant initAuth')
  await initAuth()
  console.log('✅ après initAuth')

  createApp(App).mount('#app')
}

bootstrap()