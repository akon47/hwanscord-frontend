<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PinOff } from '@lucide/vue'
import { errorMessage } from '@/api/client'
import { useMessagesStore } from '@/stores/messages'
import { useUiStore } from '@/stores/ui'
import { useClickOutside } from '@/composables/useClickOutside'
import { useEscapeKey } from '@/composables/useEscapeKey'
import MessageItem from './MessageItem.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{ channelId: string }>()
const emit = defineEmits<{ close: [] }>()

const messages = useMessagesStore()
const ui = useUiStore()
const root = ref<HTMLElement | null>(null)
const loading = ref(true)

useClickOutside(root, () => emit('close'))
useEscapeKey(() => emit('close'))

const pins = computed(() => messages.pins[props.channelId] ?? [])

onMounted(async () => {
  try {
    await messages.loadPins(props.channelId)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    loading.value = false
  }
})

function jump(messageId: string) {
  ui.requestJump(messageId)
  emit('close')
}

async function unpin(messageId: string) {
  const message = pins.value.find((m) => m.id === messageId)
  if (!message) return
  try {
    await messages.setPinned(message, false)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}
</script>

<template>
  <div ref="root" class="pins" role="dialog" aria-label="고정된 메시지">
    <header class="pins-header">
      <h3>고정된 메시지</h3>
    </header>
    <div class="pins-body scroller-thin">
      <LoadingSpinner v-if="loading" :size="24" />
      <p v-else-if="pins.length === 0" class="empty">
        아직 고정된 메시지가 없어요.<br />
        메시지의 <strong>더 보기</strong> 메뉴에서 고정할 수 있어요.
      </p>
      <div v-for="message in pins" :key="message.id" class="pin">
        <MessageItem :message="message" :grouped="false" readonly />
        <div class="pin-actions">
          <button type="button" class="btn btn-sm btn-secondary" @click="jump(message.id)">이동</button>
          <button type="button" class="icon-btn" aria-label="고정 해제" @click="unpin(message.id)">
            <PinOff :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pins {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
  width: min(420px, calc(100vw - 32px));
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  box-shadow: var(--shadow-high);
  border: 1px solid var(--divider-strong);
  overflow: hidden;
}

.pins-header {
  padding: 14px 16px;
  background: var(--bg-tertiary);
  font-weight: 700;
  color: var(--header-primary);
}

.pins-body {
  overflow-y: auto;
  padding: 8px 0 12px;
}

.empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  line-height: 1.6;
}

.pin {
  position: relative;
  margin: 8px 12px;
  padding-bottom: 8px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-strong);
}

.pin :deep(.message) {
  margin-top: 8px;
}

.pin-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 4px 12px 0;
}
</style>
