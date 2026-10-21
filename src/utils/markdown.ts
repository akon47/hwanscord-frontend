// Safe renderer for the Discord-like markdown subset described in docs/DESIGN.md.
// Strategy: escape every HTML character first, then run the formatting passes on the escaped text.
// Only http(s) URLs are auto-linked; no user-controlled attribute values are ever emitted unescaped.

export interface MarkdownOptions {
  /** Resolve a mentioned user id to a display name. Return null to render the raw token. */
  resolveMention?: (userId: string) => string | null
  /** The current user's id, used to highlight mentions of me. */
  selfId?: string | null
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch)
}

const PLACEHOLDER_PREFIX = '\u0000MD'
const PLACEHOLDER_SUFFIX = '\u0000'

function placeholder(index: number): string {
  return `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`
}

// Already-escaped text uses &lt;@id&gt; for <@id>
const MENTION_RE = /&lt;@([a-zA-Z0-9_-]{1,64})&gt;/g
const EVERYONE_RE = /(^|[^\w@])@everyone\b/g
const URL_RE = /\bhttps?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g

function formatInline(text: string, options: MarkdownOptions): string {
  let out = text

  // mentions
  out = out.replace(MENTION_RE, (_match, id: string) => {
    const name = options.resolveMention?.(id)
    const isSelf = options.selfId != null && id === options.selfId
    const label = name ? `@${escapeHtml(name)}` : `@알 수 없는 사용자`
    return `<span class="md-mention${isSelf ? ' is-self' : ''}" data-user-id="${escapeHtml(id)}">${label}</span>`
  })
  out = out.replace(EVERYONE_RE, (_m, pre: string) => `${pre}<span class="md-mention is-self">@everyone</span>`)

  // links (before emphasis so that underscores inside urls are safe)
  out = out.replace(URL_RE, (url) => {
    // url is already HTML-escaped (& → &amp;) which is fine inside an attribute and as text
    return `<a class="md-link" href="${url}" target="_blank" rel="noopener noreferrer nofollow">${url}</a>`
  })

  // spoilers
  out = out.replace(/\|\|([^\n]+?)\|\|/g, '<span class="md-spoiler" data-spoiler>$1</span>')
  // bold / underline / strike / italic
  out = out.replace(/\*\*\*([^*\n]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_\n]+?)__/g, '<u>$1</u>')
  out = out.replace(/~~([^~\n]+?)~~/g, '<s>$1</s>')
  out = out.replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_\w])_([^_\n]+?)_(?!\w)/g, '$1<em>$2</em>')

  return out
}

function formatBlocks(escaped: string, options: MarkdownOptions): string {
  const lines = escaped.split('\n')
  const html: string[] = []
  let quote: string[] = []

  const flushQuote = () => {
    if (quote.length === 0) return
    html.push(`<blockquote class="md-quote">${quote.join('<br>')}</blockquote>`)
    quote = []
  }

  for (const line of lines) {
    const quoteMatch = /^&gt;\s?(.*)$/.exec(line)
    if (quoteMatch) {
      quote.push(formatInline(quoteMatch[1] ?? '', options))
      continue
    }
    flushQuote()
    html.push(formatInline(line, options))
  }
  flushQuote()

  // Join lines: blockquotes are block-level, the rest get <br>
  let joined = ''
  for (let i = 0; i < html.length; i++) {
    const part = html[i] ?? ''
    const isBlock = part.startsWith('<blockquote')
    const prevBlock = i > 0 && (html[i - 1] ?? '').startsWith('<blockquote')
    if (i > 0 && !isBlock && !prevBlock) joined += '<br>'
    joined += part
  }
  return joined
}

/**
 * Render message content to safe HTML.
 */
export function renderMarkdown(content: string, options: MarkdownOptions = {}): string {
  if (!content) return ''
  const stash: string[] = []

  // 1) fenced code blocks ```lang\n...```
  let text = content.replace(/```(?:([\w+-]{1,20})\n)?([\s\S]*?)```/g, (_m, lang: string | undefined, code: string) => {
    const cls = lang ? ` data-lang="${escapeHtml(lang)}"` : ''
    stash.push(`<pre class="md-pre"${cls}><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`)
    return placeholder(stash.length - 1)
  })

  // 2) inline code `...`
  text = text.replace(/`([^`\n]+?)`/g, (_m, code: string) => {
    stash.push(`<code class="md-code">${escapeHtml(code)}</code>`)
    return placeholder(stash.length - 1)
  })

  // 3) escape everything else, then format
  let html = formatBlocks(escapeHtml(text), options)

  // 4) restore stashed code
  html = html.replace(/\u0000MD(\d+)\u0000/g, (_m, idx: string) => stash[Number(idx)] ?? '')

  return html
}

/** Plain-text preview (for reply quotes, notifications, search snippets). */
export function toPlainText(content: string, options: MarkdownOptions = {}): string {
  return content
    .replace(/```[\s\S]*?```/g, '[코드]')
    .replace(/<@([a-zA-Z0-9_-]{1,64})>/g, (_m, id: string) => `@${options.resolveMention?.(id) ?? '사용자'}`)
    .replace(/\|\|([^\n]+?)\|\|/g, '[스포일러]')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
