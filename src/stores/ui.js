import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const darkMode    = ref(false)
  const currentView = ref('PanelGeneral')

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    document.documentElement.classList.toggle('dark', darkMode.value)
  }

  function setView(viewName) {
    currentView.value = viewName
  }

  return { darkMode, currentView, toggleDarkMode, setView }
})
