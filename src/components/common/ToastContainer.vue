<script setup lang="ts">
import { CheckCircle2, Info, TriangleAlert, X } from '@lucide/vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const icons = { info: Info, success: CheckCircle2, error: TriangleAlert }
</script>

<template>
  <Teleport to="body">
    <div class="toasts" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="toast in ui.toasts" :key="toast.id" class="toast" :class="`is-${toast.kind}`" role="status">
          <component :is="icons[toast.kind]" :size="18" class="toast-icon" />
          <span class="toast-text">{{ toast.message }}</span>
          <button type="button" class="toast-close" aria-label="닫기" @click="ui.dismissToast(toast.id)">
            <X :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: 16px;
  left: 50%;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(420px, calc(100vw - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-floating);
  color: var(--text-normal);
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-high);
  pointer-events: auto;
  border-left: 4px solid var(--brand);
}

.is-success {
  border-left-color: var(--green);
}

.is-error {
  border-left-color: var(--red);
}

.is-success .toast-icon {
  color: var(--green);
}

.is-error .toast-icon {
  color: var(--red);
}

.is-info .toast-icon {
  color: var(--brand);
}

.toast-text {
  flex: 1;
  word-break: keep-all;
}

.toast-close {
  color: var(--interactive-normal);
  display: inline-flex;
}

.toast-close:hover {
  color: var(--interactive-hover);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
