import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue'

export interface InfiniteScrollOptions {
  /** px from the top that triggers loading older items */
  threshold?: number
  /** px from the bottom that still counts as "at bottom" */
  bottomThreshold?: number
  loadOlder: () => Promise<number>
  onAtBottomChange?: (atBottom: boolean) => void
  canLoad: () => boolean
}

/**
 * Upward infinite scroll for a chat list. Keeps the visual position stable after prepending items.
 */
export function useInfiniteScroll(container: Ref<HTMLElement | null>, options: InfiniteScrollOptions) {
  const threshold = options.threshold ?? 240
  const bottomThreshold = options.bottomThreshold ?? 48
  let loading = false
  let atBottom = true
  let frame = 0

  const isAtBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= bottomThreshold

  const scrollToBottom = (smooth = false) => {
    const el = container.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  const maybeLoad = async () => {
    const el = container.value
    if (!el || loading || !options.canLoad()) return
    if (el.scrollTop > threshold) return
    loading = true
    const prevHeight = el.scrollHeight
    const prevTop = el.scrollTop
    try {
      const added = await options.loadOlder()
      if (added > 0) {
        await nextTick()
        const el2 = container.value
        if (el2) el2.scrollTop = prevTop + (el2.scrollHeight - prevHeight)
      }
    } finally {
      loading = false
    }
  }

  const onScroll = () => {
    const el = container.value
    if (!el) return
    const nowAtBottom = isAtBottom(el)
    if (nowAtBottom !== atBottom) {
      atBottom = nowAtBottom
      options.onAtBottomChange?.(atBottom)
    }
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      void maybeLoad()
    })
  }

  onMounted(() => {
    container.value?.addEventListener('scroll', onScroll, { passive: true })
  })
  onBeforeUnmount(() => {
    container.value?.removeEventListener('scroll', onScroll)
    if (frame) cancelAnimationFrame(frame)
  })

  return {
    scrollToBottom,
    checkLoad: maybeLoad,
    get atBottom() {
      return atBottom
    },
  }
}
