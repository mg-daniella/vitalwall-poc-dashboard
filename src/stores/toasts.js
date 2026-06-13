import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastsStore = defineStore('toasts', () => {
  const toasts  = ref([])
  const timers  = new Map()
  let nextId = 1

  function add({ message, variant = 'error', duration = 5000 }) {
    const id = nextId++
    toasts.value.push({ id, message, variant })
    timers.set(id, setTimeout(() => remove(id), duration))
    return id
  }

  function remove(id) {
    clearTimeout(timers.get(id))
    timers.delete(id)
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  // Convenience wrappers
  const error   = (msg, d) => add({ message: msg, variant: 'error',   duration: d })
  const warning = (msg, d) => add({ message: msg, variant: 'warning', duration: d })
  const success = (msg, d) => add({ message: msg, variant: 'success', duration: d || 3000 })

  return { toasts, add, remove, error, warning, success }
})
