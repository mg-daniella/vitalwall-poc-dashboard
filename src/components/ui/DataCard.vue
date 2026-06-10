<script setup>
defineProps({
  title:    { type: String, required: true },
  linkText: { type: String, default: null },
  linkTo:   { type: String, default: null }
})
</script>

<template>
  <div class="data-card card">
    <div class="data-card__header">
      <span class="card-title">{{ title }}</span>
      <RouterLink v-if="linkText && linkTo" :to="linkTo" class="link-btn">
        {{ linkText }} →
      </RouterLink>
    </div>
    <div class="data-card__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.data-card {
  display: flex;
  flex-direction: column;
}
.data-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.link-btn {
  font-size: 11px;
  font-weight: 500;
  color: var(--green);
  transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }
</style>
