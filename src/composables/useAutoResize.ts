import { nextTick, onMounted, watch, type Ref } from 'vue'

/** Grows a textarea with its content up to `maxHeight` px (then scrolls). */
export function useAutoResize(textarea: Ref<HTMLTextAreaElement | null>, value: Ref<string>, maxHeight = 400): {
  resize: () => void
} {
  const resize = () => {
    const el = textarea.value
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }
  onMounted(resize)
  watch(value, () => void nextTick(resize))
  return { resize }
}
