<script setup lang="ts">
import { authApi } from '@/api'
import { useAuthProviders } from '@/composables/useAuthProviders'

const props = defineProps<{
  /** where to go after a successful login */
  next: string
  label?: string
}>()

const providers = useAuthProviders()

function start() {
  window.location.assign(authApi.githubStartUrl(props.next))
}
</script>

<template>
  <div v-if="providers.github" class="oauth">
    <div class="divider" role="separator"><span>또는</span></div>
    <button type="button" class="btn btn-lg github" @click="start">
      <svg class="mark" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
      {{ props.label ?? 'GitHub 로 계속하기' }}
    </button>
  </div>
</template>

<style scoped>
.oauth {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-faint);
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-subtle, rgba(128, 128, 128, 0.25));
}

.github {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #24292f;
  color: #fff;
}

.github:hover:not(:disabled) {
  background: #32383f;
}

.mark {
  flex-shrink: 0;
}
</style>
