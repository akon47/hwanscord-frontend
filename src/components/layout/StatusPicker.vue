<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Pencil, X } from '@lucide/vue'
import type { Status } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useClickOutside } from '@/composables/useClickOutside'
import { useEscapeKey } from '@/composables/useEscapeKey'

const props = defineProps<{ anchor: HTMLElement | null }>()
const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()
const ui = useUiStore()
const root = ref<HTMLElement | null>(null)
const anchorRef = computed(() => props.anchor)
const editing = ref(false)
const customStatus = ref(auth.user?.customStatus ?? '')
const saving = ref(false)

useClickOutside(root, () => emit('close'), [anchorRef])
useEscapeKey(() => emit('close'))

const OPTIONS: { value: Status; label: string; description?: string; color: string }[] = [
  { value: 'online', label: '온라인', color: 'var(--green)' },
  { value: 'idle', label: '자리 비움', color: 'var(--yellow)' },
  { value: 'dnd', label: '다른 용무 중', description: '알림 소리를 받지 않습니다', color: 'var(--red)' },
  { value: 'invisible', label: '오프라인 표시', description: '다른 사람에게 오프라인으로 보입니다', color: 'var(--text-faint)' },
]

async function setStatus(status: Status) {
  try {
    await auth.patchMe({ status })
    emit('close')
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}

async function saveCustom() {
  saving.value = true
  try {
    await auth.patchMe({ customStatus: customStatus.value.trim() || null })
    editing.value = false
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    saving.value = false
  }
}

async function clearCustom() {
  customStatus.value = ''
  await saveCustom()
}
</script>

<template>
  <div ref="root" class="status-picker" role="menu">
    <div class="custom">
      <template v-if="editing">
        <form class="custom-form" @submit.prevent="saveCustom">
          <input
            v-model="customStatus"
            class="input"
            type="text"
            maxlength="128"
            placeholder="지금 무슨 생각을 하고 있나요?"
            autofocus
          />
          <button type="submit" class="icon-btn" aria-label="저장" :disabled="saving"><Check :size="18" /></button>
        </form>
      </template>
      <template v-else>
        <button type="button" class="custom-btn" @click="editing = true">
          <Pencil :size="16" />
          <span class="truncate">{{ auth.user?.customStatus || '사용자 지정 상태 설정' }}</span>
        </button>
        <button
          v-if="auth.user?.customStatus"
          type="button"
          class="icon-btn"
          aria-label="사용자 지정 상태 지우기"
          @click="clearCustom"
        >
          <X :size="16" />
        </button>
      </template>
    </div>
    <div class="separator" />
    <button
      v-for="option in OPTIONS"
      :key="option.value"
      type="button"
      role="menuitemradio"
      class="option"
      :aria-checked="auth.user?.status === option.value"
      @click="setStatus(option.value)"
    >
      <span class="option-dot" :style="{ background: option.color }" />
      <span class="option-text">
        <span class="option-label">{{ option.label }}</span>
        <span v-if="option.description" class="option-desc">{{ option.description }}</span>
      </span>
      <Check v-if="auth.user?.status === option.value" :size="16" class="option-check" />
    </button>
  </div>
</template>

<style scoped>
.status-picker {
  position: absolute;
  left: 8px;
  bottom: calc(100% + 8px);
  z-index: 100;
  width: 280px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-floating);
  box-shadow: var(--shadow-high);
  animation: pop-in var(--transition-fast);
}

.custom {
  display: flex;
  align-items: center;
  gap: 4px;
}

.custom-form {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
}

.custom-btn {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 36px;
  padding: 0 8px;
  border-radius: 2px;
  color: var(--interactive-normal);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: left;
}

.custom-btn:hover {
  background: var(--brand);
  color: #fff;
}

.separator {
  height: 1px;
  margin: 6px 4px;
  background: var(--divider);
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border-radius: 2px;
  color: var(--interactive-normal);
  text-align: left;
}

.option:hover {
  background: var(--brand);
  color: #fff;
}

.option:hover .option-desc {
  color: rgba(255, 255, 255, 0.8);
}

.option-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.option-text {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.option-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.option-desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.option-check {
  flex-shrink: 0;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
</style>
