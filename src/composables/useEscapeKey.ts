import { onBeforeUnmount, onMounted } from 'vue'

/** Runs `handler` on Escape. Handlers registered later win (stack), so nested overlays close one at a time. */
const stack: Array<(event: KeyboardEvent) => void> = []
let installed = false

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  const top = stack[stack.length - 1]
  if (top) {
    event.preventDefault()
    top(event)
  }
}

export function useEscapeKey(handler: (event: KeyboardEvent) => void): void {
  onMounted(() => {
    stack.push(handler)
    if (!installed) {
      document.addEventListener('keydown', onKeydown)
      installed = true
    }
  })
  onBeforeUnmount(() => {
    const idx = stack.lastIndexOf(handler)
    if (idx >= 0) stack.splice(idx, 1)
  })
}
