<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore, type MessageDisplay, type Theme } from '@/stores/settings'

const settings = useSettingsStore()

const themes: { value: Theme; label: string }[] = [
  { value: 'dark', label: '다크' },
  { value: 'light', label: '라이트' },
]

const displays: { value: MessageDisplay; label: string; description: string }[] = [
  { value: 'cozy', label: '편안하게', description: '아바타와 넉넉한 간격으로 표시해요.' },
  { value: 'compact', label: '간단하게', description: '한 화면에 더 많은 메시지를 표시해요.' },
]

const fontSize = computed({
  get: () => settings.settings.fontSize,
  set: (value: number) => settings.update({ fontSize: value }),
})
</script>

<template>
  <section>
    <h2 class="title">모양</h2>

    <h3 class="subtitle">테마</h3>
    <div class="themes" role="radiogroup" aria-label="테마">
      <button
        v-for="theme in themes"
        :key="theme.value"
        type="button"
        role="radio"
        class="theme"
        :class="[`is-${theme.value}`, { 'is-active': settings.settings.theme === theme.value }]"
        :aria-checked="settings.settings.theme === theme.value"
        @click="settings.update({ theme: theme.value })"
      >
        <span class="swatch" />
        <span>{{ theme.label }}</span>
      </button>
    </div>

    <h3 class="subtitle">메시지 표시</h3>
    <div class="displays" role="radiogroup" aria-label="메시지 표시">
      <label v-for="display in displays" :key="display.value" class="display" :class="{ 'is-active': settings.settings.messageDisplay === display.value }">
        <input
          type="radio"
          name="display"
          class="visually-hidden"
          :checked="settings.settings.messageDisplay === display.value"
          @change="settings.update({ messageDisplay: display.value })"
        />
        <span class="radio" />
        <span class="display-text">
          <strong>{{ display.label }}</strong>
          <small>{{ display.description }}</small>
        </span>
      </label>
    </div>

    <h3 class="subtitle">글꼴 크기 — {{ fontSize }}px</h3>
    <input v-model.number="fontSize" type="range" min="12" max="20" step="1" class="range" aria-label="글꼴 크기" />
    <div class="scale"><span>12px</span><span>16px</span><span>20px</span></div>
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
  margin: 28px 0 12px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--header-primary);
}

.themes {
  display: flex;
  gap: 16px;
}

.theme {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-normal);
  font-weight: 500;
}

.swatch {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid var(--divider);
}

.is-dark .swatch {
  background: linear-gradient(135deg, #1e1f22 50%, #313338 50%);
}

.is-light .swatch {
  background: linear-gradient(135deg, #e3e5e8 50%, #ffffff 50%);
}

.theme.is-active .swatch {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand);
}

.displays {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  cursor: pointer;
}

.display:hover {
  background: var(--bg-modifier-hover);
}

.radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--interactive-normal);
  flex-shrink: 0;
}

.display.is-active .radio {
  border-color: var(--brand);
  box-shadow: inset 0 0 0 4px var(--bg-secondary);
  background: var(--brand);
}

.display-text {
  display: flex;
  flex-direction: column;
}

.display-text strong {
  color: var(--header-primary);
}

.display-text small {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.range {
  width: 100%;
  accent-color: var(--brand);
}

.scale {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
</style>
