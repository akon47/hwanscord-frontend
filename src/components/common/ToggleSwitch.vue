<script setup lang="ts">
const model = defineModel<boolean>({ required: true })
defineProps<{ label?: string; description?: string; disabled?: boolean }>()
</script>

<template>
  <label class="switch" :class="{ 'is-disabled': disabled }">
    <span class="switch-text">
      <span class="switch-label">{{ label }}</span>
      <span v-if="description" class="switch-description">{{ description }}</span>
    </span>
    <span class="switch-control" :class="{ 'is-on': model }">
      <input v-model="model" type="checkbox" class="visually-hidden" :disabled="disabled" />
      <span class="knob" />
    </span>
  </label>
</template>

<style scoped>
.switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  cursor: pointer;
}

.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.switch-label {
  font-weight: 500;
  color: var(--header-primary);
}

.switch-description {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.switch-control {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 24px;
  border-radius: 12px;
  background: var(--text-faint);
  transition: background-color var(--transition-normal);
}

.switch-control.is-on {
  background: var(--green);
}

.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-low);
  transition: transform var(--transition-normal);
}

.is-on .knob {
  transform: translateX(16px);
}

.switch-control:has(input:focus-visible) {
  box-shadow: var(--focus-ring);
}
</style>
