<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Copy, CornerUpLeft, Link2, MoreHorizontal, Pencil, Pin, PinOff, SmilePlus, Trash2 } from '@lucide/vue'
import type { Message } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useUiStore, type MenuItem } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { useUserMenu } from '@/composables/useUserMenu'
import { formatFull, formatTime, formatDateTime } from '@/utils/time'
import { toPlainText } from '@/utils/markdown'
import UserAvatar from '@/components/users/UserAvatar.vue'
import MessageContent from './MessageContent.vue'
import MessageAttachments from './MessageAttachments.vue'
import MessageEditor from './MessageEditor.vue'
import ReactionBar from './ReactionBar.vue'
import EmojiPicker from './EmojiPicker.vue'

const props = withDefaults(
  defineProps<{
    message: Message
    grouped: boolean
    /** disables hover toolbar / menus (confirm preview, pins list, search) */
    readonly?: boolean
    highlighted?: boolean
    pending?: 'sending' | 'failed'
    pendingError?: string | null
  }>(),
  { readonly: false, highlighted: false, pending: undefined, pendingError: null },
)

const emit = defineEmits<{
  reply: [message: Message]
  jump: [messageId: string]
  retry: []
  discard: []
}>()

const auth = useAuthStore()
const users = useUsersStore()
const channels = useChannelsStore()
const messages = useMessagesStore()
const ui = useUiStore()
const userMenu = useUserMenu()

const editing = ref(false)
const pickerOpen = ref(false)
const root = ref<HTMLElement | null>(null)

// ArrowUp in an empty composer asks the last own message to enter edit mode (see ChatPane.editLast)
function onEditRequest() {
  if (!props.readonly && !props.pending && isMine.value) editing.value = true
}
onMounted(() => root.value?.addEventListener('edit-request', onEditRequest))
onBeforeUnmount(() => root.value?.removeEventListener('edit-request', onEditRequest))

const author = computed(() => users.get(props.message.author.id))
const displayName = computed(() => author.value?.displayName ?? props.message.author.displayName)
const avatarUrl = computed(() => author.value?.avatarUrl ?? props.message.author.avatarUrl)
const isMine = computed(() => props.message.author.id === auth.userId)
const canDelete = computed(() => isMine.value || auth.isAdmin)
const mentionsMe = computed(
  () =>
    !!auth.userId &&
    (props.message.mentionEveryone || props.message.mentions.includes(auth.userId)) &&
    !isMine.value,
)
const channel = computed(() => channels.get(props.message.channelId))
const canPin = computed(() => channel.value?.type !== 'voice')

const replyAuthorName = computed(() => {
  const ref = props.message.replyTo?.author
  if (!ref) return null
  return users.get(ref.id)?.displayName ?? ref.displayName
})

const replyPreview = computed(() => {
  const reply = props.message.replyTo
  if (!reply) return ''
  if (reply.deleted) return '원본 메시지가 삭제되었습니다.'
  return toPlainText(reply.content, { resolveMention: (id) => users.displayName(id) }) || '첨부 파일을 클릭하여 보기'
})

function openAuthor(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  ui.openProfile(props.message.author.id, { x: rect.right + 8, y: rect.top }, 'right')
}

function copyText() {
  void navigator.clipboard?.writeText(props.message.content)
  ui.toast('메시지를 복사했습니다.', 'success', 2000)
}

function copyLink() {
  const base = channel.value?.type === 'dm' ? '/channels/@me/' : '/channels/'
  void navigator.clipboard?.writeText(`${window.location.origin}${base}${props.message.channelId}#${props.message.id}`)
  ui.toast('메시지 링크를 복사했습니다.', 'success', 2000)
}

async function remove() {
  const ok = await ui.askConfirm({
    title: '메시지 삭제하기',
    message: '정말 이 메시지를 삭제할까요?',
    confirmLabel: '삭제',
    danger: true,
    preview: props.message,
  })
  if (!ok) return
  try {
    await messages.remove(props.message.channelId, props.message.id)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}

async function togglePin() {
  try {
    const pin = !props.message.pinned
    await messages.setPinned(props.message, pin)
    ui.toast(pin ? '메시지를 고정했습니다.' : '메시지 고정을 해제했습니다.', 'success', 2000)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}

async function react(emoji: string) {
  pickerOpen.value = false
  try {
    await messages.toggleReaction(props.message, emoji)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}

function menuItems(): MenuItem[] {
  const items: MenuItem[] = [
    { id: 'react', label: '반응 추가', icon: SmilePlus, action: () => (pickerOpen.value = true) },
    { id: 'reply', label: '답장', icon: CornerUpLeft, action: () => emit('reply', props.message) },
  ]
  if (isMine.value) items.push({ id: 'edit', label: '메시지 수정', icon: Pencil, action: () => (editing.value = true) })
  if (canPin.value) {
    items.push({
      id: 'pin',
      label: props.message.pinned ? '메시지 고정 해제' : '메시지 고정',
      icon: props.message.pinned ? PinOff : Pin,
      action: () => void togglePin(),
    })
  }
  items.push({ id: 'sep1', label: '', separator: true })
  items.push({ id: 'copy', label: '텍스트 복사', icon: Copy, disabled: !props.message.content, action: copyText })
  items.push({ id: 'link', label: '메시지 링크 복사', icon: Link2, action: copyLink })
  if (canDelete.value) {
    items.push({ id: 'sep2', label: '', separator: true })
    items.push({ id: 'delete', label: '메시지 삭제', icon: Trash2, danger: true, action: () => void remove() })
  }
  return items
}

function onContextMenu(event: MouseEvent) {
  if (props.readonly || props.pending) return
  const target = event.target as HTMLElement
  // let the browser handle right-clicks on links/images/selection
  if (target.closest('a, img, video, audio')) return
  if (window.getSelection()?.toString()) return
  ui.openContextMenu(event, menuItems())
}

function onAuthorContextMenu(event: MouseEvent) {
  if (props.readonly) return
  ui.openContextMenu(event, userMenu.itemsFor(props.message.author.id, { anchor: { x: event.clientX, y: event.clientY } }))
}

function onMore(event: MouseEvent) {
  ui.openContextMenu(event, menuItems())
}
</script>

<template>
  <article
    :id="`message-${message.id}`"
    ref="root"
    class="message"
    :class="{
      'is-grouped': grouped,
      'is-mention': mentionsMe,
      'is-highlighted': highlighted,
      'is-pending': pending === 'sending',
      'is-failed': pending === 'failed',
      'is-editing': editing,
      'is-readonly': readonly,
    }"
    @contextmenu="onContextMenu"
  >
    <div v-if="message.replyTo" class="reply">
      <span class="reply-spine" aria-hidden="true" />
      <template v-if="message.replyTo.author && !message.replyTo.deleted">
        <UserAvatar
          :user-id="message.replyTo.author.id"
          :display-name="replyAuthorName ?? ''"
          :avatar-url="users.get(message.replyTo.author.id)?.avatarUrl ?? message.replyTo.author.avatarUrl"
          :size="16"
        />
        <span class="reply-author">{{ replyAuthorName }}</span>
      </template>
      <button type="button" class="reply-text truncate" @click="emit('jump', message.replyTo!.id)">
        {{ replyPreview }}
      </button>
    </div>

    <div class="row">
      <div class="gutter">
        <button
          v-if="!grouped"
          type="button"
          class="avatar-btn"
          :aria-label="`${displayName} 프로필`"
          @click="openAuthor"
          @contextmenu.stop="onAuthorContextMenu"
        >
          <UserAvatar :user-id="message.author.id" :display-name="displayName" :avatar-url="avatarUrl" :size="40" />
        </button>
        <time v-else class="side-time" :datetime="message.createdAt" :title="formatFull(message.createdAt)">
          {{ formatTime(message.createdAt) }}
        </time>
      </div>

      <div class="body">
        <header v-if="!grouped" class="meta">
          <button
            type="button"
            class="author"
            :class="{ 'is-admin': author?.role === 'admin' }"
            @click="openAuthor"
            @contextmenu.stop="onAuthorContextMenu"
          >
            {{ displayName }}
          </button>
          <time class="time" :datetime="message.createdAt" :title="formatFull(message.createdAt)">
            {{ formatDateTime(message.createdAt) }}
          </time>
          <Pin v-if="message.pinned" :size="12" class="pin-mark" aria-label="고정됨" />
        </header>

        <MessageEditor v-if="editing" :message="message" @done="editing = false" />
        <template v-else>
          <MessageContent v-if="message.content" :content="message.content" :edited="!!message.editedAt" />
          <MessageAttachments v-if="message.attachments.length" :attachments="message.attachments" />
          <ReactionBar v-if="!readonly && !pending" :message="message" />
          <p v-if="pending === 'failed'" class="failed-text">
            {{ pendingError ?? '메시지를 보내지 못했습니다.' }}
            <button type="button" class="link" @click="emit('retry')">다시 시도</button>
            ·
            <button type="button" class="link" @click="emit('discard')">삭제</button>
          </p>
        </template>
      </div>

      <div v-if="!readonly && !pending && !editing" class="toolbar" role="toolbar" aria-label="메시지 동작">
        <button v-tooltip="'반응 추가'" type="button" class="tool" aria-label="반응 추가" @click="pickerOpen = !pickerOpen">
          <SmilePlus :size="18" />
        </button>
        <button v-tooltip="'답장'" type="button" class="tool" aria-label="답장" @click="emit('reply', message)">
          <CornerUpLeft :size="18" />
        </button>
        <button v-if="isMine" v-tooltip="'수정'" type="button" class="tool" aria-label="수정" @click="editing = true">
          <Pencil :size="18" />
        </button>
        <button
          v-else-if="canDelete"
          v-tooltip="'삭제'"
          type="button"
          class="tool is-danger"
          aria-label="삭제"
          @click="remove"
        >
          <Trash2 :size="18" />
        </button>
        <button v-tooltip="'더 보기'" type="button" class="tool" aria-label="더 보기" @click="onMore">
          <MoreHorizontal :size="18" />
        </button>
        <EmojiPicker v-if="pickerOpen" class="picker" @select="react" @close="pickerOpen = false" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.message {
  position: relative;
  padding: 2px 48px 2px 16px;
  margin-top: 17px;
  transition: background-color var(--transition-fast);
}

.message.is-grouped {
  margin-top: 0;
}

.message:hover:not(.is-readonly),
.message.is-editing {
  background: var(--bg-message-hover);
}

.message.is-mention {
  background: var(--bg-mention);
  box-shadow: inset 2px 0 0 var(--yellow);
}

.message.is-highlighted {
  background: var(--mention-bg);
  animation: highlight 2.5s ease-out;
}

.message.is-pending {
  opacity: 0.55;
}

.message.is-failed .body {
  color: var(--red);
}

.row {
  display: flex;
  gap: 0;
}

.gutter {
  width: 56px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-start;
}

.avatar-btn {
  display: inline-flex;
  margin-top: 2px;
  border-radius: 50%;
}

.side-time {
  display: none;
  width: 56px;
  padding-top: 4px;
  font-size: 0.6875rem;
  line-height: 1.375rem;
  color: var(--text-faint);
  text-align: left;
  white-space: nowrap;
}

.message.is-grouped:hover .side-time {
  display: block;
}

.body {
  flex: 1;
  min-width: 0;
}

.meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 1px;
}

.author {
  font-weight: 600;
  color: var(--header-primary);
  text-align: left;
}

.author:hover {
  text-decoration: underline;
}

.author.is-admin {
  color: #e0a6ff;
}

html[data-theme='light'] .author.is-admin {
  color: #8a2be2;
}

.time {
  font-size: var(--font-size-xs);
  color: var(--text-faint);
}

.pin-mark {
  color: var(--text-faint);
}

.reply {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 56px;
  margin-bottom: 2px;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.reply-spine {
  position: absolute;
  left: 36px;
  top: 10px;
  width: 20px;
  height: 14px;
  border-left: 2px solid var(--divider);
  border-top: 2px solid var(--divider);
  border-top-left-radius: 6px;
}

.reply-author {
  font-weight: 600;
  color: var(--header-secondary);
  white-space: nowrap;
}

.reply-text {
  min-width: 0;
  color: var(--text-muted);
  text-align: left;
}

.reply-text:hover {
  color: var(--text-normal);
}

.toolbar {
  position: absolute;
  top: -16px;
  right: 16px;
  display: none;
  align-items: center;
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  box-shadow: var(--shadow-low);
  border: 1px solid var(--divider-strong);
}

.message:hover .toolbar,
.toolbar:has(.picker) {
  display: flex;
}

.tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--interactive-normal);
  border-radius: var(--radius-sm);
}

.tool:hover {
  background: var(--bg-modifier-hover);
  color: var(--interactive-hover);
}

.tool.is-danger:hover {
  color: var(--red);
}

.picker {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 60;
}

.failed-text {
  margin-top: 4px;
  font-size: var(--font-size-xs);
}

.link {
  color: var(--link);
}

.link:hover {
  text-decoration: underline;
}

/* compact display: tighter spacing, smaller avatars */
:global(html[data-display='compact']) .message {
  margin-top: 8px;
  padding-top: 1px;
  padding-bottom: 1px;
}

:global(html[data-display='compact']) .message.is-grouped {
  margin-top: 0;
}

:global(html[data-display='compact']) .gutter {
  width: 40px;
}

:global(html[data-display='compact']) .reply {
  padding-left: 40px;
}

:global(html[data-display='compact']) .side-time {
  width: 40px;
  font-size: 0.625rem;
}

/* touch devices: no sticky hover toolbar; long-press opens the context menu instead */
@media (hover: none) {
  .message:hover .toolbar {
    display: none;
  }

  .message:hover:not(.is-readonly) {
    background: transparent;
  }
}

@keyframes highlight {
  from {
    background: var(--mention-bg-hover);
  }
}

@media (max-width: 899px) {
  .message {
    padding-right: 12px;
  }

  .toolbar {
    right: 8px;
  }
}
</style>
