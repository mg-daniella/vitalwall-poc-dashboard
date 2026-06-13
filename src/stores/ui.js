import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const stored  = localStorage.getItem('darkMode') === 'true'
  const darkMode = ref(stored)
  if (stored) document.documentElement.classList.add('dark')

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    document.documentElement.classList.toggle('dark', darkMode.value)
    localStorage.setItem('darkMode', darkMode.value)
  }

  return { darkMode, toggleDarkMode }
})
