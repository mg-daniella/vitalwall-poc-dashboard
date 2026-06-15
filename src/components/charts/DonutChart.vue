<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const props = defineProps({
  data:   { type: Array,  required: true },
  colors: { type: Array,  default: () => ['#0071BC','#0D9488','#D97706'] },
  labels: { type: Array,  default: () => [] },
  cutout: { type: String, default: '70%' },
  height: { type: Number, default: 180 }
})

const canvasRef = ref(null)
let chart = null

function buildChart() {
  if (!canvasRef.value) return
  const isDark = document.documentElement.classList.contains('dark')
  const tickColor = isDark ? '#8E8E87' : '#9A9A96'

  chart = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [{ data: props.data, backgroundColor: props.colors, borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: props.cutout,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: tickColor, font: { family: 'Inter', size: 11 }, boxWidth: 10, padding: 12 }
        },
        tooltip: { backgroundColor: isDark ? '#3A3A38' : '#fff', titleColor: tickColor, bodyColor: tickColor, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1 }
      }
    }
  })
}

onMounted(buildChart)

watch(() => props.data, (newData) => {
  if (!chart) return
  try { chart.data.datasets[0].data = newData; chart.update() } catch {}
}, { deep: true })

onBeforeUnmount(() => { chart?.destroy(); chart = null })
</script>

<template>
  <div class="donut-wrap" :style="{ height: height + 'px' }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.donut-wrap { position: relative; width: 100%; }
</style>
