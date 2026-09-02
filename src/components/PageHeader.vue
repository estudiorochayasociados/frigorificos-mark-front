<template>
  <header class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
}

.page-header > div:first-child {
  min-width: 0;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 1.1;
}

.page-header p {
  max-width: 680px;
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.page-header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

@media (max-width: 700px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
    gap: 17px;
  }

  .page-header h1 {
    font-size: 30px;
  }

  .page-header-actions {
    width: 100%;
    flex-direction: column;
  }

  .page-header-actions :deep(button) {
    width: 100%;
  }
}
</style>
