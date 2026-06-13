import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, vi } from 'vitest'

// Fresh Pinia before every test
beforeEach(() => {
  setActivePinia(createPinia())
})

// Stub Chart.js canvas — happy-dom doesn't implement canvas
vi.mock('@/components/charts/LineChart.vue', () => ({
  default: { template: '<canvas />' }
}))
vi.mock('@/components/charts/DonutChart.vue', () => ({
  default: { template: '<canvas />' }
}))

// Stub env vars
vi.stubEnv('VITE_API_URL',  'http://localhost:3001')
vi.stubEnv('VITE_WS_URL',   'ws://localhost:3001')
vi.stubEnv('VITE_API_KEY',  'test-key')
vi.stubEnv('VITE_USE_DUMMY','false')
