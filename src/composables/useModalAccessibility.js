import { nextTick, onBeforeUnmount, onMounted, unref, watch } from 'vue'

const modalStack = []
let originalBodyOverflow = ''

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

function resolve(value) {
  return typeof value === 'function' ? value() : unref(value)
}

function getFocusableElements(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(element =>
    element.getAttribute('aria-hidden') !== 'true'
    && !element.closest('[hidden], [aria-hidden="true"]')
    && getComputedStyle(element).visibility !== 'hidden'
  )
}

function focusDialog(dialog, initialFocus) {
  const preferred = resolve(initialFocus)
  const target = preferred?.isConnected
    ? preferred
    : dialog.querySelector('[autofocus]') || getFocusableElements(dialog)[0] || dialog

  if (target === dialog && !dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1')
  target.focus()
}

function handleModalKeydown(event) {
  const topModal = modalStack.at(-1)
  if (!topModal) return

  const dialog = topModal.dialog.value
  if (!dialog) return

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    topModal.onClose()
    return
  }

  if (event.key !== 'Tab') return

  const focusable = getFocusableElements(dialog)
  if (!focusable.length) {
    event.preventDefault()
    focusDialog(dialog)
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault()
    first.focus()
  }
}

export function useModalAccessibility(dialog, onClose, active = true, initialFocus = null) {
  let entry = null
  let generation = 0

  async function activate() {
    const currentGeneration = ++generation
    await nextTick()
    if (currentGeneration !== generation || entry || !resolve(active) || !resolve(dialog)) return

    entry = {
      dialog,
      onClose,
      restoreFocus: document.activeElement,
    }
    if (!modalStack.length) {
      originalBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleModalKeydown)
    }
    modalStack.push(entry)
    focusDialog(resolve(dialog), initialFocus)
  }

  function deactivate() {
    generation++
    if (!entry) return

    const wasTopModal = modalStack.at(-1) === entry
    const index = modalStack.indexOf(entry)
    if (index !== -1) modalStack.splice(index, 1)

    if (!modalStack.length) {
      document.removeEventListener('keydown', handleModalKeydown)
      document.body.style.overflow = originalBodyOverflow
    }

    const restoreTarget = entry.restoreFocus
    entry = null
    if (wasTopModal && restoreTarget?.isConnected) {
      nextTick(() => restoreTarget.focus())
    }
  }

  watch(() => resolve(active), isActive => {
    if (isActive) activate()
    else deactivate()
  }, { immediate: true, flush: 'post' })

  onMounted(activate)
  onBeforeUnmount(deactivate)
}
