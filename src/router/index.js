import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',           name: 'PanelGeneral',   component: () => import('@/views/PanelGeneral.vue') },
  { path: '/cerebro',    name: 'CerebroActivo',   component: () => import('@/views/CerebroActivo.vue') },
  { path: '/decisiones', name: 'DecisionesIA',    component: () => import('@/views/DecisionesIA.vue') },
  { path: '/capas',      name: 'CapasDeLaPared',  component: () => import('@/views/CapasDeLaPared.vue') },
  { path: '/clima',      name: 'ClimaYPrevision', component: () => import('@/views/ClimaYPrevision.vue') },
  { path: '/red',        name: 'RedElectrica',    component: () => import('@/views/RedElectrica.vue') },
  { path: '/aire',       name: 'CalidadDelAire',  component: () => import('@/views/CalidadDelAire.vue') },
  { path: '/confort',    name: 'Confort',          component: () => import('@/views/Confort.vue') },
  { path: '/historico',  name: 'Historico',        component: () => import('@/views/Historico.vue') },
  { path: '/log',        name: 'LogDeAPIs',        component: () => import('@/views/LogDeAPIs.vue') },
  { path: '/salud',      name: 'SaludDelSistema',  component: () => import('@/views/SaludDelSistema.vue') },
  { path: '/alertas',    name: 'Alertas',           component: () => import('@/views/Alertas.vue') },
  { path: '/agua',       name: 'AguaYSequia',      component: () => import('@/views/AguaYSequia.vue') },
  { path: '/emergencias',name: 'Emergencias',       component: () => import('@/views/Emergencias.vue') }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
