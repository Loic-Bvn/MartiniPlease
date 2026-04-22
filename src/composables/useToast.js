import { ref } from 'vue'

const toastMessage = ref('')
let _timer = null

export function useToast() {
  function showToast(message, duration = 2000) {
    if (_timer) clearTimeout(_timer)
    toastMessage.value = message
    _timer = setTimeout(() => { toastMessage.value = '' }, duration)
  }

  return { toastMessage, showToast }
}