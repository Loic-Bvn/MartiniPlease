import { createApp } from 'vue'
import './assets/styles.css'
import './assets/improvements.css'
import App from './App.vue'
import { useAuth } from '@/composables/useAuth'

async function bootstrap() {
  const { initAuth } = useAuth()
  await initAuth()
  createApp(App).mount('#app')
}

bootstrap()