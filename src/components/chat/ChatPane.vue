<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Upload } from '@lucide/vue'
import type { Channel, Message } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useUsersStore } from '@/stores/users'
import ChannelHeader from '@/components/layout/ChannelHeader.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import TypingIndicator from './TypingIndicator.vue'

const props = defineProps<{ channel: Channel }>()

const auth = useAuthStore()
const channels = useChannelsStore()
const messages = useMessagesStore()
const users = useUsersStore()

const replyTo = ref<Message | null>(null)
const dragging = ref(false)
const input = ref<InstanceType<typeof MessageInput> | null>(null)
let dragDepth = 0

watch(
  () => props.channel.id,
  () => {
    replyTo.value = null
  },
)

const dmPartner = computed(() => {
  if (props.channel.type !== 'dm') return null
  const id = channels.dmPartnerId(props.channel)
  return id ? users.get(id) : null
})

const headerTitle = computed(() => channels.displayName(props.channel))
const headerSubtitle = computed(() =>
  props.channel.type === 'dm' ? dmPartner.value?.customStatus ?? undefined : props.channel.topic ?? undefined,
)

function editLast() {
  const mine = [...messages.list(props.channel.id)].reverse().find((m) => m.author.id === auth.userId)
  if (!mine) return
  // MessageItem owns the edit state; trigger via a custom DOM event on the element
  document.getElementById(`message-${mine.id}`)?.dispatchEvent(new CustomEvent('edit-request', { bubbles: false }))
}

function onDragEnter(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) return
  dragDepth++
  dragging.value = true
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragging.value = false
}

function onDrop(event: DragEvent) {
  dragDepth = 0
  dragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length) input.value?.addFiles(files)
}
</script>

<template>
  <section
    class="chat-pane"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <ChannelHeader :channel="channel" :title="headerTitle" :subtitle="headerSubtitle" />
    <MessageList :channel="channel" @reply="replyTo = $event" />
    <div class="composer-area">
      <MessageInput
        ref="input"
        :channel="channel"
        :reply-to="replyTo"
        @cancel-reply="replyTo = null"
        @edit-last="editLast"
      />
      <TypingIndicator :channel-id="channel.id" />
    </div>
    <Transition name="fade">
      <div v-if="dragging" class="drop-overlay">
        <div class="drop-card">
          <Upload :size="48" />
          <h3>{{ channel.type === 'dm' ? headerTitle : `#${channel.name}` }}에 업로드</h3>
          <p>파일을 여기에 놓으세요</p>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.chat-pane {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--bg-primary);
}

.composer-area {
  flex-shrink: 0;
  padding-bottom: 0;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-overlay);
}

.drop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 48px;
  border: 3px dashed var(--brand);
  border-radius: var(--radius-lg);
  background: var(--brand);
  color: #fff;
  text-align: center;
}

.drop-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
}
</style>
