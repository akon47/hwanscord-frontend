<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const LENGTH = 6

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
    /** marks every box red (wrong code) */
    invalid?: boolean
    autofocus?: boolean
  }>(),
  { disabled: false, invalid: false, autofocus: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** all six digits are in */
  complete: [code: string]
}>()

const boxes = ref<HTMLInputElement[]>([])
const digits = ref<string[]>(Array.from({ length: LENGTH }, (_, i) => props.modelValue[i] ?? ''))

watch(
  () => props.modelValue,
  (value) => {
    if (value !== digits.value.join('')) digits.value = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '')
  },
)

function focusBox(index: number) {
  const el = boxes.value[Math.max(0, Math.min(LENGTH - 1, index))]
  el?.focus()
  el?.select()
}

function commit() {
  const code = digits.value.join('')
  emit('update:modelValue', code)
  if (/^\d{6}$/.test(code)) emit('complete', code)
}

/** Writes digits starting at `start` (typing one digit, or pasting/auto-filling several). */
function fill(start: number, text: string) {
  const incoming = text.replace(/\D/g, '').slice(0, LENGTH - start)
  if (!incoming) return
  for (let i = 0; i < incoming.length; i++) digits.value[start + i] = incoming[i]!
  commit()
  focusBox(Math.min(LENGTH - 1, start + incoming.length))
}

function onInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  if (!value) {
    digits.value[index] = ''
    commit()
    return
  }
  // a single box can receive several characters (SMS/one-time-code autofill, fast typing)
  input.value = digits.value[index] ?? ''
  fill(index, value)
  if (!/\d/.test(value)) input.value = digits.value[index] ?? ''
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    event.preventDefault()
    digits.value[index - 1] = ''
    commit()
    focusBox(index - 1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    focusBox(index - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    focusBox(index + 1)
  }
}

function onPaste(index: number, event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!/\d/.test(text)) return
  event.preventDefault()
  // a full code always lands from the first box, wherever it was pasted
  fill(text.replace(/\D/g, '').length >= LENGTH ? 0 : index, text)
}

function clear() {
  digits.value = Array.from({ length: LENGTH }, () => '')
  commit()
  void nextTick(() => focusBox(0))
}

onMounted(() => {
  if (props.autofocus) focusBox(0)
})

defineExpose({ clear, focus: () => focusBox(digits.value.findIndex((d) => !d)) })
</script>

<template>
  <div class="code" :class="{ 'is-invalid': invalid }" role="group" aria-label="6자리 인증 코드">
    <input
      v-for="(_, i) in LENGTH"
      :key="i"
      :ref="(el) => (boxes[i] = el as HTMLInputElement)"
      class="box"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      :autocomplete="i === 0 ? 'one-time-code' : 'off'"
      :aria-label="`${i + 1}번째 숫자`"
      :value="digits[i]"
      :disabled="disabled"
      @input="onInput(i, $event)"
      @keydown="onKeydown(i, $event)"
      @paste="onPaste(i, $event)"
      @focus="($event.target as HTMLInputElement).select()"
    />
  </div>
</template>

<style scoped>
.code {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.box {
  width: 46px;
  height: 56px;
  border: 1px solid var(--input-border, transparent);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  color: var(--header-primary);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  caret-color: var(--brand);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.box:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 35%, transparent);
}

.is-invalid .box {
  border-color: var(--red);
}

.box:disabled {
  opacity: 0.6;
}

@media (max-width: 380px) {
  .box {
    width: 40px;
    height: 50px;
    font-size: 1.4rem;
  }
}
</style>
