// Conversion between the stored content format ("<@userId>") and what the textarea shows ("@displayName").

export interface MentionTarget {
  id: string
  displayName: string
  username: string
}

export const MENTION_TOKEN_RE = /<@([a-zA-Z0-9_-]{1,64})>/g

export function extractMentionIds(content: string): string[] {
  const ids = new Set<string>()
  for (const match of content.matchAll(MENTION_TOKEN_RE)) {
    if (match[1]) ids.add(match[1])
  }
  return [...ids]
}

export function mentionsEveryone(content: string): boolean {
  return /(^|[^\w@])@everyone\b/.test(content)
}

/** "<@id>" → "@Display Name" so the author can edit a message comfortably. */
export function toEditableContent(content: string, users: MentionTarget[]): string {
  const byId = new Map(users.map((u) => [u.id, u]))
  return content.replace(MENTION_TOKEN_RE, (match, id: string) => {
    const user = byId.get(id)
    return user ? `@${user.displayName}` : match
  })
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * "@Display Name" / "@username" → "<@id>". Longest names first so "@Kim Hwan" wins over "@Kim".
 * Names already written as <@id> are left untouched.
 */
export function toRawContent(text: string, users: MentionTarget[]): string {
  if (!text.includes('@')) return text
  const names: { name: string; id: string }[] = []
  for (const user of users) {
    names.push({ name: user.displayName, id: user.id })
    if (user.username !== user.displayName) names.push({ name: user.username, id: user.id })
  }
  names.sort((a, b) => b.name.length - a.name.length)
  let out = text
  for (const { name, id } of names) {
    if (!name) continue
    const re = new RegExp(`(^|[^\\w<])@${escapeRegExp(name)}(?![\\w가-힣])`, 'g')
    out = out.replace(re, `$1<@${id}>`)
  }
  return out
}

/** Does `content` mention `userId` (directly or via @everyone)? */
export function mentionsUser(content: string, mentions: string[], mentionEveryone: boolean, userId: string): boolean {
  return mentionEveryone || mentions.includes(userId) || content.includes(`<@${userId}>`)
}

/**
 * Find an "@query" being typed right before the caret. Returns null when the caret is not inside a mention.
 */
export function activeMentionQuery(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  if (at > 0 && /[\w가-힣]/.test(before[at - 1] ?? '')) return null
  const query = before.slice(at + 1)
  if (/\s/.test(query) || query.length > 32) return null
  return { start: at, query }
}

/** Find a ":query" (emoji shortcode) being typed right before the caret (at least 2 chars). */
export function activeEmojiQuery(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const colon = before.lastIndexOf(':')
  if (colon < 0) return null
  if (colon > 0 && /[\w가-힣:]/.test(before[colon - 1] ?? '')) return null
  const query = before.slice(colon + 1)
  if (query.length < 2 || /\s|:/.test(query) || query.length > 32) return null
  return { start: colon, query }
}
