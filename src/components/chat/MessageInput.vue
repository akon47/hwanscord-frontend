<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CirclePlus, SendHorizontal, Smile, X } from '@lucide/vue'
import type { Channel, Message } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useChannelsStore } from '@/stores/channels'
import { useMessagesStore } from '@/stores/messages'
import { useUiStore } from '@/stores/ui'
import { useUsersStore } from '@/stores/users'
import { getSocket } from '@/realtime/socket'
import { useAutoResize } from '@/composables/useAutoResize'
import { useAttachmentUploads } from '@/composables/useAttachmentUploads'
import { mentionBus } from '@/composables/mentionBus'
import { activeEmojiQuery, activeMentionQuery, toRawContent } from '@/utils/mentions'
import { searchEmoji } from '@/utils/emoji'
import { readJson, writeJson } from '@/utils/storage'
import AutocompletePopup, { type AutocompleteItem } from './AutocompletePopup.vue'
import AttachmentChips from './AttachmentChips.vue'
import EmojiPicker from './EmojiPicker.vue'
import UserAvatar from '@/components/users/UserAvatar.vue'

const props = defineProps<{ channel: Channel; replyTo: Message | null }>()
const emit = defineEmits<{ cancelReply: []; editLast: []; sent: [] }>()

const MAX_LENGTH = 2000
const TYPING_INTERVAL_MS = 3000

const auth = useAuthStore()
const users = useUsersStore()
const channels = useChannelsStore()
const messages = useMessagesStore()
const ui = useUiStore()

const textarea = ref<HTMLTextAreaElement | null>(null)
const text = ref(readJson<string>(`draft.${props.channel.id}`, ''))
const sending = ref(false)
const emojiOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const autocompleteIndex = ref(0)

useAutoResize(textarea, text, Math.round(window.innerHeight * 0.5))
const uploads = useAttachmentUploads((message) => ui.toast(message, 'error'))

const placeholder = computed(() =>
  props.channel.type === 'dm'
    ? `@${channels.displayName(props.channel)}에게 메시지 보내기`
    : `#${props.channel.name}에 메시지 보내기`,
)
const remaining = computed(() => MAX_LENGTH - text.value.length)
const disabled = computed(() => ui.connection === 'disconnected')
const canSend = computed(
  () =>
    !sending.value &&
    !uploads.uploading.value &&
    !disabled.value &&
    remaining.value >= 0 &&
    (text.value.trim().length > 0 || uploads.ready.value.length > 0),
)

// ---- draft persistence ----------------------------------------------------------------------------------------
watch(text, (value) => writeJson(`draft.${props.channel.id}`, value))

// ---- typing --------------------------------------------------------------------------------------------------
let lastTypingSent = 0
function emitTyping() {
  const now = Date.now()
  if (now - lastTypingSent < TYPING_INTERVAL_MS) return
  lastTypingSent = now
  getSocket()?.emit('typing', { channelId: props.channel.id })
}

// ---- autocomplete ---------------------------------------------------------------------------------------------
type AutocompleteKind = 'mention' | 'emoji'
const autocomplete = ref<{ kind: AutocompleteKind; start: number; query: string } | null>(null)

const autocompleteItems = computed<AutocompleteItem[]>(() => {
  const ac = autocomplete.value
  if (!ac) return []
  if (ac.kind === 'mention') {
    const q = ac.query.toLowerCase()
    const list = users.all
      .filter((u) => !q || u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
      .slice(0, 8)
      .map<AutocompleteItem>((u) => ({
        id: u.id,
        label: u.displayName,
        description: `@${u.username}`,
        avatar: { userId: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl },
      }))
    if (props.channel.type !== 'dm' && (!q || 'everyone'.startsWith(q))) {
      list.unshift({ id: 'everyone', label: '@everyone', description: '모두에게 알림' })
    }
    return list
  }
  return searchEmoji(ac.query, 10).map<AutocompleteItem>((e) => ({ id: e.name, label: `:${e.name}:`, emoji: e.char }))
})

function updateAutocomplete() {
  const el = textarea.value
  if (!el) return
  const caret = el.selectionStart ?? text.value.length
  const mention = activeMentionQuery(text.value, caret)
  if (mention) {
    autocomplete.value = { kind: 'mention', ...mention }
    autocompleteIndex.value = 0
    return
  }
  const emoji = activeEmojiQuery(text.value, caret)
  if (emoji) {
    autocomplete.value = { kind: 'emoji', ...emoji }
    autocompleteIndex.value = 0
    return
  }
  autocomplete.value = null
}

function applyAutocomplete(item: AutocompleteItem) {
  const ac = autocomplete.value
  const el = textarea.value
  if (!ac || !el) return
  const caret = el.selectionStart ?? text.value.length
  const before = text.value.slice(0, ac.start)
  const after = text.value.slice(caret)
  const insert = ac.kind === 'mention' ? (item.id === 'everyone' ? '@everyone' : `@${item.label}`) : (item.emoji ?? '')
  text.value = `${before}${insert} ${after}`
  autocomplete.value = null
  void nextTick(() => {
    const pos = before.length + insert.length + 1
    el.setSelectionRange(pos, pos)
    el.focus()
  })
}

function insertAtCaret(snippet: string) {
  const el = textarea.value
  const start = el?.selectionStart ?? text.value.length
  const end = el?.selectionEnd ?? text.value.length
  text.value = `${text.value.slice(0, start)}${snippet}${text.value.slice(end)}`
  void nextTick(() => {
    const pos = start + snippet.length
    el?.setSelectionRange(pos, pos)
    el?.focus()
  })
}

function insertMention(userId: string) {
  const user = users.get(userId)
  if (!user) return
  const needsSpace = text.value.length > 0 && !/\s$/.test(text.value)
  insertAtCaret(`${needsSpace ? ' ' : ''}@${user.displayName} `)
}

// ---- sending --------------------------------------------------------------------------------------------------
async function send() {
  if (!canSend.value) return
  const content = toRawContent(text.value.trim(), users.mentionTargets)
  const attachments = uploads.ready.value
  const replyTo = props.replyTo
  sending.value = true
  text.value = ''
  uploads.clear()
  emit('cancelReply')
  writeJson(`draft.${props.channel.id}`, '')
  try {
    await messages.send(props.channel.id, { content, attachments, replyTo })
    emit('sent')
  } catch (error) {
    // the pending message shows a retry button; only toast for validation errors
    if ((error as { status?: number }).status === 400) ui.toast(errorMessage(error), 'error')
  } finally {
    sending.value = false
    void nextTick(() => textarea.value?.focus())
  }
}

function onKeydown(event: KeyboardEvent) {
  if (autocomplete.value && autocompleteItems.value.length) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      autocompleteIndex.value = (autocompleteIndex.value + 1) % autocompleteItems.value.length
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      autocompleteIndex.value =
        (autocompleteIndex.value - 1 + autocompleteItems.value.length) % autocompleteItems.value.length
      return
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const item = autocompleteItems.value[autocompleteIndex.value]
      if (item) applyAutocomplete(item)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      autocomplete.value = null
      return
    }
  }
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void send()
    return
  }
  if (event.key === 'ArrowUp' && text.value === '' && !event.shiftKey) {
    event.preventDefault()
    emit('editLast')
    return
  }
  if (event.key === 'Escape' && props.replyTo) {
    emit('cancelReply')
  }
}

function onInput() {
  updateAutocomplete()
  if (text.value.trim()) emitTyping()
}

function onPaste(event: ClipboardEvent) {
  const files = [...(event.clipboardData?.files ?? [])]
  if (files.length) {
    event.preventDefault()
    uploads.add(files)
  }
}

function onFilesChosen(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) uploads.add(input.files)
  input.value = ''
}

function addFiles(files: FileList | File[]) {
  uploads.add(files)
  textarea.value?.focus()
}

function pickEmoji(emoji: string) {
  emojiOpen.value = false
  insertAtCaret(emoji)
}

defineExpose({ addFiles, focus: () => textarea.value?.focus() })

let unsubscribeMention: (() => void) | null = null
onMounted(() => {
  unsubscribeMention = mentionBus.on(insertMention)
  if (window.matchMedia('(min-width: 900px)').matches) textarea.value?.focus()
})
onBeforeUnmount(() => unsubscribeMention?.())

watch(
  () => props.replyTo,
  (value) => {
    if (value) textarea.value?.focus()
  },
)

const me = computed(() => auth.user)
</script>

<template>
  <div class="composer">
    <div v-if="replyTo" class="reply-bar">
      <span class="reply-label">
        <UserAvatar
          :user-id="replyTo.author.id"
          :display-name="replyTo.author.displayName"
          :avatar-url="users.get(replyTo.author.id)?.avatarUrl ?? replyTo.author.avatarUrl"
          :size="16"
        />
        <strong>{{ users.get(replyTo.author.id)?.displayName ?? replyTo.author.displayName }}</strong>에게 답장하는 중
      </span>
      <button type="button" class="icon-btn" aria-label="답장 취소" @click="emit('cancelReply')">
        <X :size="16" />
      </button>
    </div>

    <div class="box" :class="{ 'has-reply': replyTo, 'is-disabled': disabled }">
      <AttachmentChips v-if="uploads.items.value.length" :items="uploads.items.value" @remove="uploads.remove" />
      <AutocompletePopup
        v-if="autocomplete && autocompleteItems.length"
        :title="autocomplete.kind === 'mention' ? '멤버' : '이모지'"
        :items="autocompleteItems"
        :active-index="autocompleteIndex"
        @select="applyAutocomplete"
        @hover="autocompleteIndex = $event"
      />
      <div class="row">
        <input ref="fileInput" type="file" multiple class="visually-hidden" tabindex="-1" @change="onFilesChosen" />
        <button
          v-tooltip="'파일 첨부'"
          type="button"
          class="attach"
          aria-label="파일 첨부"
          :disabled="disabled"
          @click="fileInput?.click()"
        >
          <CirclePlus :size="24" />
        </button>
        <textarea
          ref="textarea"
          v-model="text"
          class="textarea"
          rows="1"
          :placeholder="disabled ? '연결을 기다리는 중…' : placeholder"
          :maxlength="MAX_LENGTH + 100"
          :disabled="disabled"
          :aria-label="placeholder"
          @keydown="onKeydown"
          @input="onInput"
          @click="updateAutocomplete"
          @keyup.left.right="updateAutocomplete"
          @paste="onPaste"
        />
        <span v-if="remaining < 200" class="counter" :class="{ 'is-over': remaining < 0 }">{{ remaining }}</span>
        <div class="emoji-wrap">
          <button
            v-tooltip="'이모지'"
            type="button"
            class="tool"
            aria-label="이모지 선택"
            :disabled="disabled"
            @click="emojiOpen = !emojiOpen"
          >
            <Smile :size="24" />
          </button>
          <EmojiPicker v-if="emojiOpen" class="emoji-picker" @select="pickEmoji" @close="emojiOpen = false" />
        </div>
        <button
          v-tooltip="'보내기'"
          type="button"
          class="tool send mobile-only"
          aria-label="보내기"
          :disabled="!canSend"
          @click="send"
        >
          <SendHorizontal :size="22" />
        </button>
      </div>
    </div>
    <p v-if="me && uploads.hasFailures.value" class="hint is-error">업로드에 실패한 파일은 메시지에 포함되지 않습니다.</p>
  </div>
</template>

<style scoped>
.composer {
  position: relative;
  padding: 0 16px;
}

.reply-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 8px 16px;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  background: var(--bg-secondary);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.reply-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.reply-label strong {
  color: var(--header-secondary);
}

.box {
  position: relative;
  border-radius: var(--radius-md);
  background: var(--bg-input);
}

.box.has-reply {
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.box.is-disabled {
  opacity: 0.7;
}

.row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 0 4px 0 0;
}

.attach {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  color: var(--interactive-normal);
}

.attach:hover:not(:disabled) {
  color: var(--interactive-hover);
}

.textarea {
  flex: 1;
  min-height: 44px;
  max-height: 50vh;
  padding: 11px 0;
  border: 0;
  background: transparent;
  color: var(--text-normal);
  line-height: 1.375;
  resize: none;
  overflow-y: hidden;
}

.textarea::placeholder {
  color: var(--text-faint);
}

.textarea:focus-visible {
  outline: none;
}

.box:focus-within {
  box-shadow: 0 0 0 1px var(--bg-modifier-selected);
}

.counter {
  align-self: center;
  margin-right: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.counter.is-over {
  color: var(--red);
  font-weight: 700;
}

.emoji-wrap {
  position: relative;
}

.tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 44px;
  color: var(--interactive-normal);
}

.tool:hover:not(:disabled) {
  color: var(--interactive-hover);
}

.send {
  color: var(--brand);
}

.emoji-picker {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  z-index: 40;
}

.hint {
  padding: 4px 8px 0;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.hint.is-error {
  color: var(--red);
}

.mobile-only {
  display: none;
}

@media (max-width: 899px) {
  .composer {
    padding: 0 8px;
  }

  .mobile-only {
    display: inline-flex;
  }
}
</style>
