import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Calls `handler` when a pointerdown happens outside `target` (and outside any `ignore` elements). */
export function useClickOutside(
  target: Ref<HTMLElement | null | undefined>,
  handler: (event: PointerEvent) => void,
  ignore: Ref<HTMLElement | null | undefined>[] = [],
): void {
  const listener = (event: PointerEvent) => {
    const el = target.value
    if (!el) return
    const node = event.target as Node | null
    if (!node) return
    if (el.contains(node)) return
    if (ignore.some((ref) => ref.value?.contains(node))) return
    handler(event)
  }
  onMounted(() => document.addEventListener('pointerdown', listener, true))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', listener, true))
}
