<script setup>
import { ref, onMounted, onBeforeUnmount, onActivated, onDeactivated, watch } from 'vue'
import { Chart, CategoryScale, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler } from 'chart.js'
import 'chartjs-adapter-date-fns'

Chart.register(CategoryScale, LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler)

const props = defineProps({
  datasets: { type: Array, required: true },
  labels:   { type: Array, default: null },
  height:   { type: Number, default: 180 },
  xType:    { type: String, default: 'category' } // 'category' | 'time'
})

const canvasRef = ref(null)
let chart = null

function buildChart() {
  if (!canvasRef.value) return
  const isDark = document.documentElement.classList.contains('dark')
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const tickColor = isDark ? '#8E8E87' : '#9A9A96'

  chart = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: props.labels || undefined,
      datasets: props.datasets
    },
    options: {
      animation: false,
      responsive: false,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: props.datasets.length > 1,
          labels: { color: tickColor, font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 }
        },
        tooltip: { backgroundColor: isDark ? '#3A3A38' : '#fff', titleColor: tickColor, bodyColor: tickColor, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 10 }
      },
      scales: {
        x: {
          type: props.xType === 'time' ? 'time' : 'category',
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'Inter', size: 11 }, maxTicksLimit: 8 }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'Inter', size: 11 }, maxTicksLimit: 6 }
        }
      }
    }
  })
}

function destroyChart() { chart?.destroy(); chart = null }

function buildChartSafe() {
  if (chart) return  // guard: never create two instances on the same canvas
  buildChart()
}

onMounted(buildChartSafe)
onBeforeUnmount(destroyChart)

onActivated(buildChartSafe)
onDeactivated(destroyChart)

watch([() => props.datasets, () => props.labels], ([newDs, newLabels]) => {
  if (!chart) return
  try {
    chart.data.datasets = newDs
    if (newLabels) chart.data.labels = newLabels
    chart.update('none')
  } catch {}
}, { deep: true })
</script>

<template>
  <div class="chart-wrap" :style="{ height: height + 'px' }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.chart-wrap { position: relative; width: 100%; }
</style>
