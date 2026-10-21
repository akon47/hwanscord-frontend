<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useClickOutside } from '@/composables/useClickOutside'
import { useEscapeKey } from '@/composables/useEscapeKey'

const ui = useUiStore()
const root = ref<HTMLElement | null>(null)
const style = ref<Record<string, string>>({})

useClickOutside(root, () => ui.closeContextMenu())
useEscapeKey(() => ui.closeContextMenu())

async function place() {
  await nextTick()
  const menu = ui.contextMenu
  const el = root.value
  if (!menu || !el) return
  const rect = el.getBoundingClientRect()
  const x = Math.min(menu.x, window.innerWidth - rect.width - 8)
  const y = Math.min(menu.y, window.innerHeight - rect.height - 8)
  style.value = { left: `${Math.max(8, x)}px`, top: `${Math.max(8, y)}px` }
  el.querySelector<HTMLElement>('button:not(:disabled)')?.focus()
}

onMounted(place)
watch(() => ui.contextMenu, place)

function run(action?: () => void) {
  ui.closeContextMenu()
  action?.()
}

function onKeydown(event: KeyboardEvent) {
  const el = root.value
  if (!el) return
  const buttons = [...el.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  const idx = buttons.findIndex((b) => b === document.activeElement)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    buttons[(idx + 1) % buttons.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    buttons[(idx - 1 + buttons.length) % buttons.length]?.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ui.contextMenu"
      ref="root"
      class="context-menu"
      role="menu"
      :style="style"
      @contextmenu.prevent
      @keydown="onKeydown"
    >
      <template v-for="item in ui.contextMenu.items" :key="item.id">
        <div v-if="item.separator" class="separator" role="separator" />
        <button
          v-else
          type="button"
          role="menuitem"
          class="item"
          :class="{ 'is-danger': item.danger }"
          :disabled="item.disabled"
          @click="run(item.action)"
        >
          <span class="label">{{ item.label }}</span>
          <component :is="item.icon" v-if="item.icon" :size="18" class="icon" />
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 4000;
  min-width: 188px;
  max-width: 320px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-floating);
  box-shadow: var(--shadow-high);
  animation: pop-in var(--transition-fast);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border-radius: 2px;
  color: var(--interactive-normal);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: left;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.item:hover:not(:disabled),
.item:focus-visible {
  background: var(--brand);
  color: #fff;
  outline: none;
}

.item.is-danger {
  color: var(--red);
}

.item.is-danger:hover:not(:disabled),
.item.is-danger:focus-visible {
  background: var(--red);
  color: #fff;
}

.separator {
  height: 1px;
  margin: 4px;
  background: var(--divider);
}

.icon {
  flex-shrink: 0;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}
</style>
