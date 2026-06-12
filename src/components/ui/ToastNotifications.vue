<script setup>
import { useToastsStore } from '@/stores/toasts'
const toasts = useToastsStore()
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts.toasts"
          :key="t.id"
          class="toast"
          :class="t.variant"
          @click="toasts.remove(t.id)"
        >
          <span class="toast-icon">
            {{ t.variant === 'error' ? '✕' : t.variant === 'warning' ? '⚠' : '✓' }}
          </span>
          <span class="toast-msg">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-card);
  font-size: 12px;
  font-weight: 600;
  max-width: 340px;
  cursor: pointer;
  pointer-events: all;
}
.toast.error   { background: var(--red);   color: #fff; }
.toast.warning { background: var(--amber); color: #fff; }
.toast.success { background: var(--green); color: #fff; }
.toast-icon { flex-shrink: 0; font-size: 12px; }

/* Transition */
.toast-enter-active { transition: all 0.22s ease; }
.toast-leave-active { transition: all 0.18s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(30px); }
.toast-leave-to     { opacity: 0; transform: translateX(30px); }
</style>
