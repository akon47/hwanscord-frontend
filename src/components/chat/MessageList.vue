<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowDown, Hash } from '@lucide/vue'
import type { Channel, Message } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore, type PendingMessage } from '@/stores/messages'
import { useReadStatesStore } from '@/stores/readStates'
import { useUiStore } from '@/stores/ui'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { formatDayLabel, isSameDay, withinGroupWindow } from '@/utils/time'
import MessageItem from './MessageItem.vue'
import DateDivider from './DateDivider.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{ channel: Channel }>()
const emit = defineEmits<{ reply: [message: Message] }>()

const auth = useAuthStore()
const channels = useChannelsStore()
const messages = useMessagesStore()
const readStates = useReadStatesStore()
const ui = useUiStore()

const container = ref<HTMLElement | null>(null)
const bucket = computed(() => messages.channel(props.channel.id))
const items = computed(() => bucket.value.items)
const pending = computed(() => messages.pendingFor(props.channel.id))

/** the first unread message id at the moment the channel was opened (so the divider does not jump) */
const newDividerBefore = ref<string | null>(null)

type RenderItem =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'new'; key: string }
  | { kind: 'message'; key: string; message: Message; grouped: boolean }
  | { kind: 'pending'; key: string; pending: PendingMessage; grouped: boolean }

const renderItems = computed<RenderItem[]>(() => {
  const out: RenderItem[] = []
  let previous: Message | null = null
  for (const message of items.value) {
    const prevDate = previous ? new Date(previous.createdAt) : null
    const date = new Date(message.createdAt)
    let dateBreak = false
    if (!prevDate || !isSameDay(prevDate, date)) {
      out.push({ kind: 'date', key: `date-${message.id}`, label: formatDayLabel(date) })
      dateBreak = true
    }
    if (newDividerBefore.value && message.id === newDividerBefore.value) {
      out.push({ kind: 'new', key: 'new-divider' })
      dateBreak = true
    }
    const grouped =
      !dateBreak &&
      !!previous &&
      previous.author.id === message.author.id &&
      !message.replyTo &&
      withinGroupWindow(previous.createdAt, message.createdAt)
    out.push({ kind: 'message', key: message.id, message, grouped })
    previous = message
  }
  for (const p of pending.value) {
    const grouped = !!previous && previous.author.id === auth.userId && !p.replyTo && withinGroupWindow(previous.createdAt, p.createdAt)
    out.push({ kind: 'pending', key: p.nonce, pending: p, grouped })
  }
  return out
})

function pendingAsMessage(p: PendingMessage): Message {
  const me = auth.user!
  return {
    id: p.nonce,
    channelId: p.channelId,
    author: { id: me.id, username: me.username, displayName: me.displayName, avatarUrl: me.avatarUrl },
    content: p.content,
    attachments: p.attachments,
    replyTo: p.replyTo,
    mentions: [],
    mentionEveryone: false,
    reactions: [],
    pinned: false,
    editedAt: null,
    createdAt: p.createdAt,
  }
}

const scroller = useInfiniteScroll(container, {
  canLoad: () => bucket.value.loaded && bucket.value.hasMore && !bucket.value.loading,
  loadOlder: () => messages.loadOlder(props.channel.id),
  onAtBottomChange: (atBottom) => {
    ui.setAtBottom(atBottom)
    if (atBottom) ackLatest()
  },
})

const showJump = ref(false)

function ackLatest() {
  if (document.visibilityState !== 'visible') return
  const last = items.value[items.value.length - 1]
  if (last && !bucket.value.detached) readStates.ack(props.channel.id, last.id)
}

async function load() {
  const channelId = props.channel.id
  const rs = readStates.get(channelId)
  try {
    await messages.loadInitial(channelId)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
    return
  }
  if (channelId !== props.channel.id) return
  // compute the "new messages" divider from the read state captured before acking
  if (rs.lastReadMessageId && rs.unreadCount > 0) {
    const first = items.value.find((m) => m.id > rs.lastReadMessageId! && m.author.id !== auth.userId)
    newDividerBefore.value = first?.id ?? null
  } else {
    newDividerBefore.value = null
  }
  await nextTick()
  scroller.scrollToBottom(false)
  ui.setAtBottom(true)
  ackLatest()
  await nextTick()
  void scroller.checkLoad()
}

// jump to a message (from search / pins / reply quote)
async function jumpTo(messageId: string) {
  const channelId = props.channel.id
  const found = await messages.loadAround(channelId, messageId)
  await nextTick()
  const el = document.getElementById(`message-${messageId}`)
  if (el) {
    el.scrollIntoView({ block: 'center' })
    ui.highlightMessageId = messageId
    setTimeout(() => {
      if (ui.highlightMessageId === messageId) ui.highlightMessageId = null
    }, 2500)
  } else if (!found) {
    ui.toast('메시지를 찾을 수 없습니다.', 'error')
  }
  ui.clearJump()
}

async function backToPresent() {
  if (bucket.value.detached) await messages.loadLatest(props.channel.id)
  await nextTick()
  scroller.scrollToBottom(true)
  ackLatest()
}

watch(
  () => props.channel.id,
  () => {
    newDividerBefore.value = null
    void load()
  },
)

// keep pinned to the bottom when new messages arrive while at bottom
watch(
  () => renderItems.value.length,
  async () => {
    if (ui.atBottom && !bucket.value.detached) {
      await nextTick()
      scroller.scrollToBottom(false)
      ackLatest()
    }
    showJump.value = !ui.atBottom || bucket.value.detached
  },
)

watch(
  () => ui.atBottom,
  (value) => {
    showJump.value = !value || bucket.value.detached
  },
)

watch(
  () => ui.jumpToMessageId,
  (id) => {
    if (id) void jumpTo(id)
  },
)

function onVisibility() {
  if (document.visibilityState === 'visible' && ui.atBottom) ackLatest()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibility)
  void load().then(() => {
    if (ui.jumpToMessageId) void jumpTo(ui.jumpToMessageId)
  })
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibility))

const channelTitle = computed(() => channels.displayName(props.channel))
</script>

<template>
  <div class="list-wrap">
    <div ref="container" class="list scroller-thin" role="log" aria-live="polite">
      <div v-if="bucket.loaded && !bucket.hasMore && !bucket.detached" class="intro">
        <div class="intro-icon"><Hash :size="40" /></div>
        <h3 class="intro-title">
          {{ channel.type === 'dm' ? channelTitle : `#${channel.name}에 오신 것을 환영합니다!` }}
        </h3>
        <p class="intro-text">
          {{
            channel.type === 'dm'
              ? `${channelTitle}님과의 다이렉트 메시지 기록이 시작되는 곳입니다.`
              : `#${channel.name} 채널의 시작이에요.${channel.topic ? ` ${channel.topic}` : ''}`
          }}
        </p>
      </div>
      <LoadingSpinner v-if="bucket.loading && bucket.hasMore" :size="24" />
      <template v-for="item in renderItems" :key="item.key">
        <DateDivider v-if="item.kind === 'date'" :label="item.label" />
        <DateDivider v-else-if="item.kind === 'new'" label="새 메시지" variant="new" />
        <MessageItem
          v-else-if="item.kind === 'message'"
          :message="item.message"
          :grouped="item.grouped"
          :highlighted="ui.highlightMessageId === item.message.id"
          @reply="emit('reply', $event)"
          @jump="jumpTo"
        />
        <MessageItem
          v-else
          :message="pendingAsMessage(item.pending)"
          :grouped="item.grouped"
          :pending="item.pending.status"
          :pending-error="item.pending.error"
          @retry="messages.retry(item.pending.nonce)"
          @discard="messages.discardPending(item.pending.nonce)"
        />
      </template>
      <div class="bottom-pad" />
    </div>
    <Transition name="fade">
      <button v-if="showJump" type="button" class="jump" @click="backToPresent">
        <ArrowDown :size="16" />
        {{ bucket.detached ? '최신 메시지로 이동' : '맨 아래로' }}
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.list-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-top: 16px;
  scrollbar-gutter: stable;
}

.bottom-pad {
  height: 16px;
}

.intro {
  padding: 24px 16px 8px;
}

.intro-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--bg-modifier-active);
  color: var(--header-primary);
}

.intro-title {
  margin-top: 12px;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--header-primary);
}

.intro-text {
  margin-top: 4px;
  color: var(--text-muted);
}

.jump {
  position: absolute;
  right: 16px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  background: var(--brand);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
  box-shadow: var(--shadow-medium);
}

.jump:hover {
  background: var(--brand-hover);
}
</style>
