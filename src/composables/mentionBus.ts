// Lets any component (member list, context menu) ask the active MessageInput to insert a mention.
type Listener = (userId: string) => void

const listeners = new Set<Listener>()

export const mentionBus = {
  emit(userId: string) {
    for (const listener of listeners) listener(userId)
  },
  on(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
