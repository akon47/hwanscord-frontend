<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Hash, Volume2 } from '@lucide/vue'
import { ApiError, errorMessage } from '@/api/client'
import { useChannelsStore } from '@/stores/channels'
import { useUiStore } from '@/stores/ui'
import { useChannelMenu } from '@/composables/useChannelMenu'
import BaseModal from '@/components/common/BaseModal.vue'

/** Create (createType set) or edit (channelId set) a text / voice channel. */
const props = defineProps<{ createType?: 'text' | 'voice' | null; channelId?: string | null }>()
const emit = defineEmits<{ close: [] }>()

const channels = useChannelsStore()
const ui = useUiStore()
const router = useRouter()
const channelMenu = useChannelMenu()

const editing = computed(() => (props.channelId ? channels.get(props.channelId) : undefined))
const type = ref<'text' | 'voice'>(editing.value?.type === 'voice' ? 'voice' : (props.createType ?? 'text'))
const name = ref(editing.value?.name ?? '')
const topic = ref(editing.value?.topic ?? '')
const saving = ref(false)
const error = ref<string | null>(null)

const title = computed(() => (editing.value ? '채널 편집' : '채널 만들기'))
const normalizedName = computed(() =>
  type.value === 'text' ? name.value.trim().toLowerCase().replace(/\s+/g, '-') : name.value.trim(),
)
const valid = computed(() => normalizedName.value.length >= 1 && normalizedName.value.length <= 100)

async function submit() {
  if (!valid.value || saving.value) return
  saving.value = true
  error.value = null
  try {
    if (editing.value) {
      await channels.update(editing.value.id, {
        name: normalizedName.value,
        ...(editing.value.type === 'text' ? { topic: topic.value.trim() || null } : {}),
      })
      ui.toast('채널을 수정했습니다.', 'success', 2000)
    } else {
      const channel = await channels.create(type.value, normalizedName.value, type.value === 'text' ? topic.value.trim() : undefined)
      await router.push(`/channels/${channel.id}`)
    }
    emit('close')
  } catch (e) {
    error.value = e instanceof ApiError && e.code === 'CONFLICT' ? '같은 이름의 채널이 이미 있어요.' : errorMessage(e)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!editing.value) return
  const channel = editing.value
  emit('close')
  await channelMenu.remove(channel)
}
</script>

<template>
  <BaseModal :title="title" size="small" @close="emit('close')">
    <form id="channel-form" class="form" @submit.prevent="submit">
      <fieldset v-if="!editing" class="types">
        <legend class="label">채널 유형</legend>
        <label class="type" :class="{ 'is-active': type === 'text' }">
          <input v-model="type" type="radio" value="text" class="visually-hidden" />
          <Hash :size="24" />
          <span class="type-text">
            <strong>채팅</strong>
            <small>메시지, 이미지, 이모지, 의견을 보내세요</small>
          </span>
        </label>
        <label class="type" :class="{ 'is-active': type === 'voice' }">
          <input v-model="type" type="radio" value="voice" class="visually-hidden" />
          <Volume2 :size="24" />
          <span class="type-text">
            <strong>음성</strong>
            <small>음성, 화면 공유로 함께 어울리세요</small>
          </span>
        </label>
      </fieldset>
      <label class="field">
        <span class="label">채널 이름</span>
        <span class="name-input">
          <component :is="type === 'text' ? Hash : Volume2" :size="16" class="name-icon" />
          <input v-model="name" class="input" type="text" maxlength="100" placeholder="새로운-채널" autofocus />
        </span>
      </label>
      <label v-if="type === 'text'" class="field">
        <span class="label">채널 주제</span>
        <textarea v-model="topic" class="input" rows="2" maxlength="1024" placeholder="이 채널에 대해 알려주세요" />
      </label>
      <p v-if="error" class="field-error">{{ error }}</p>
    </form>
    <template #footer>
      <button v-if="editing" type="button" class="btn btn-ghost danger-link" @click="remove">채널 삭제</button>
      <span class="spacer" />
      <button type="button" class="btn btn-ghost" @click="emit('close')">취소</button>
      <button type="submit" form="channel-form" class="btn btn-primary" :disabled="!valid || saving">
        {{ editing ? '저장' : '채널 만들기' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.types {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.type {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--interactive-normal);
  cursor: pointer;
}

.type:hover {
  background: var(--bg-modifier-hover);
}

.type.is-active {
  background: var(--bg-modifier-selected);
  color: var(--interactive-active);
}

.type:has(input:focus-visible) {
  box-shadow: var(--focus-ring);
}

.type-text {
  display: flex;
  flex-direction: column;
}

.type-text small {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.field {
  display: block;
}

.name-input {
  position: relative;
  display: block;
}

.name-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.name-input .input {
  padding-left: 32px;
}

textarea.input {
  resize: vertical;
}

.spacer {
  flex: 1;
}

.danger-link {
  color: var(--red);
}
</style>
