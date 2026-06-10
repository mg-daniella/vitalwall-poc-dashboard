<script setup>
defineProps({
  message:        { type: String,  default: 'No se pudieron cargar los datos.' },
  status:         { type: Number,  default: null },
  retryExhausted: { type: Boolean, default: false },
  retrying:       { type: Boolean, default: false },
  compact:        { type: Boolean, default: false }   // inline vs full-card
})
defineEmits(['retry'])

function statusHint(code) {
  if (!code) return 'Revisa la conexión de red o el estado del servidor.'
  if (code === 401 || code === 403) return 'Sin autorización. Verifica la clave API en el archivo .env.'
  if (code === 404) return 'Endpoint no encontrado. Revisa VITE_API_URL en .env.'
  if (code === 429) return 'Límite de solicitudes alcanzado. Se reintentará con backoff.'
  if (code >= 500)  return `Error interno del servidor (${code}). Revisa los logs del backend.`
  return `Código HTTP: ${code}`
}
</script>

<template>
  <div class="error-state" :class="{ compact }">
    <div class="error-icon">{{ retryExhausted ? '🔌' : '⚠' }}</div>
    <div class="error-body">
      <div class="error-title">
        {{ retryExhausted ? 'Conexión agotada' : 'Error de carga' }}
      </div>
      <div class="error-message">{{ message }}</div>
      <div v-if="status || retryExhausted" class="error-hint">
        {{ retryExhausted
            ? `Se realizaron 3 intentos sin éxito. ${statusHint(status)}`
            : statusHint(status) }}
      </div>
    </div>
    <button
      class="retry-btn"
      :disabled="retrying"
      @click="$emit('retry')"
    >
      <span v-if="retrying" class="spinner"></span>
      {{ retrying ? 'Reintentando…' : 'Reintentar' }}
    </button>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(226,75,74,0.06);
  border: 1px solid rgba(226,75,74,0.2);
  border-radius: var(--radius-card);
  padding: 16px;
}
.error-state.compact {
  padding: 10px 12px;
  gap: 8px;
}
.error-icon {
  font-size: 22px;
  flex-shrink: 0;
  margin-top: 1px;
}
.error-state.compact .error-icon { font-size: 16px; }

.error-body  { flex: 1; min-width: 0; }
.error-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--red);
  margin-bottom: 3px;
}
.error-state.compact .error-title { font-size: 12px; }
.error-message {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.error-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  font-style: italic;
}

.retry-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 5px;
  border: 1px solid rgba(226,75,74,0.35);
  background: rgba(226,75,74,0.08);
  color: var(--red);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.retry-btn:hover:not(:disabled) { background: rgba(226,75,74,0.15); }
.retry-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* Spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(226,75,74,0.25);
  border-top-color: var(--red);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
</style>
