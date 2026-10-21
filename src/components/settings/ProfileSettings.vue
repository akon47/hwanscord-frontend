<script setup lang="ts">
import { ref } from 'vue'
import type { Status } from '@/api'
import { errorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const customStatus = ref(auth.user?.customStatus ?? '')
const saving = ref(false)

const OPTIONS: { value: Status; label: string; description: string; color: string }[] = [
  { value: 'online', label: '온라인', description: '모두에게 온라인으로 표시됩니다.', color: 'var(--green)' },
  { value: 'idle', label: '자리 비움', description: '잠시 자리를 비웠어요.', color: 'var(--yellow)' },
  { value: 'dnd', label: '다른 용무 중', description: '알림 소리와 데스크톱 알림을 받지 않습니다.', color: 'var(--red)' },
  { value: 'invisible', label: '오프라인 표시', description: '접속 중이지만 다른 사람에게 오프라인으로 보여요.', color: 'var(--text-faint)' },
]

async function setStatus(status: Status) {
  try {
    await auth.patchMe({ status })
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  }
}

async function saveCustom() {
  saving.value = true
  try {
    await auth.patchMe({ customStatus: customStatus.value.trim() || null })
    ui.toast('상태 메시지를 저장했습니다.', 'success', 2000)
  } catch (error) {
    ui.toast(errorMessage(error), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <h2 class="title">프로필 상태</h2>
    <div class="options" role="radiogroup" aria-label="상태">
      <button
        v-for="option in OPTIONS"
        :key="option.value"
        type="button"
        role="radio"
        class="option"
        :class="{ 'is-active': auth.user?.status === option.value }"
        :aria-checked="auth.user?.status === option.value"
        @click="setStatus(option.value)"
      >
        <span class="dot" :style="{ background: option.color }" />
        <span class="option-text">
          <strong>{{ option.label }}</strong>
          <small>{{ option.description }}</small>
        </span>
      </button>
    </div>

    <h3 class="subtitle">사용자 지정 상태</h3>
    <form class="custom" @submit.prevent="saveCustom">
      <input v-model="customStatus" class="input" type="text" maxlength="128" placeholder="예: 공부하는 중 📚" />
      <button type="submit" class="btn btn-primary" :disabled="saving">저장</button>
    </form>
    <p class="hint">멤버 목록과 프로필에 표시됩니다. 비우고 저장하면 지워져요.</p>
  </section>
</template>

<style scoped>
.title {
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--header-primary);
}

.subtitle {
  margin: 32px 0 12px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--header-primary);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  text-align: left;
}

.option:hover {
  background: var(--bg-modifier-hover);
}

.option.is-active {
  border-color: var(--brand);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.option-text {
  display: flex;
  flex-direction: column;
}

.option-text strong {
  color: var(--header-primary);
}

.option-text small {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.custom {
  display: flex;
  gap: 8px;
}

.hint {
  margin-top: 8px;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
</style>
