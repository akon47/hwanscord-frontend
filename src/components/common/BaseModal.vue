<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { useEscapeKey } from '@/composables/useEscapeKey'

const props = withDefaults(
  defineProps<{
    title?: string
    /** small: 440px, medium: 560px, large: 760px, full: full-screen (settings) */
    size?: 'small' | 'medium' | 'large' | 'full'
    closable?: boolean
    hideHeader?: boolean
  }>(),
  { title: '', size: 'small', closable: true, hideHeader: false },
)

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)

function close() {
  if (props.closable) emit('close')
}

useEscapeKey(close)

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusFirst() {
  const el = panel.value
  if (!el) return
  const target = el.querySelector<HTMLElement>('[autofocus]') ?? el.querySelector<HTMLElement>(FOCUSABLE)
  ;(target ?? el).focus()
}

function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !panel.value) return
  const focusable = [...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null)
  if (focusable.length === 0) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => void nextTick(focusFirst))
watch(() => props.size, () => void nextTick(focusFirst))
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" :class="`is-${size}`" @pointerdown.self="close">
      <div
        ref="panel"
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title || undefined"
        tabindex="-1"
        @keydown="trapFocus"
      >
        <header v-if="!hideHeader && size !== 'full'" class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button v-if="closable" type="button" class="icon-btn" aria-label="닫기" @click="close">
            <X :size="20" />
          </button>
        </header>
        <div class="modal-body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--bg-overlay);
  animation: fade-in var(--transition-normal);
}

.modal-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 32px);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  box-shadow: var(--shadow-high);
  animation: pop-in var(--transition-normal);
  outline: none;
}

.is-medium .modal-panel {
  max-width: 560px;
}

.is-large .modal-panel {
  max-width: 760px;
}

.is-full {
  padding: 0;
}

.is-full .modal-panel {
  max-width: none;
  max-height: none;
  height: 100%;
  border-radius: 0;
  animation: none;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--header-primary);
}

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

.is-full .modal-body {
  padding: 0;
  overflow: hidden;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  background: var(--bg-secondary);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
