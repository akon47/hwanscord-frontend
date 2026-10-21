import { describe, expect, it } from 'vitest'
import { escapeHtml, renderMarkdown, toPlainText } from './markdown'

describe('escapeHtml', () => {
  it('escapes all HTML special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
  })
})

describe('renderMarkdown — formatting', () => {
  it('renders bold, italic, underline, strike', () => {
    expect(renderMarkdown('**b**')).toBe('<strong>b</strong>')
    expect(renderMarkdown('*i*')).toBe('<em>i</em>')
    expect(renderMarkdown('_i_')).toBe('<em>i</em>')
    expect(renderMarkdown('__u__')).toBe('<u>u</u>')
    expect(renderMarkdown('~~s~~')).toBe('<s>s</s>')
  })

  it('handles nested formatting', () => {
    expect(renderMarkdown('**bold _and italic_**')).toBe('<strong>bold <em>and italic</em></strong>')
    expect(renderMarkdown('***both***')).toBe('<strong><em>both</em></strong>')
    expect(renderMarkdown('~~**x**~~')).toBe('<s><strong>x</strong></s>')
  })

  it('does not format inside inline code or code blocks', () => {
    expect(renderMarkdown('`**not bold**`')).toBe('<code class="md-code">**not bold**</code>')
    const block = renderMarkdown('```js\nconst a = **1**\n```')
    expect(block).toContain('<pre class="md-pre" data-lang="js"><code>const a = **1**</code></pre>')
    expect(block).not.toContain('<strong>')
  })

  it('renders spoilers, quotes and line breaks', () => {
    expect(renderMarkdown('||secret||')).toBe('<span class="md-spoiler" data-spoiler>secret</span>')
    expect(renderMarkdown('> quoted\nplain')).toBe('<blockquote class="md-quote">quoted</blockquote>plain')
    expect(renderMarkdown('a\nb')).toBe('a<br>b')
  })

  it('auto-links https urls without breaking underscores', () => {
    const html = renderMarkdown('see https://example.com/a_b_c.')
    expect(html).toContain('<a class="md-link" href="https://example.com/a_b_c" target="_blank" rel="noopener noreferrer nofollow">')
    expect(html).not.toContain('<em>')
    expect(html.endsWith('</a>.')).toBe(true)
  })

  it('renders mentions with resolved names and highlights self', () => {
    const html = renderMarkdown('hi <@u1> and <@u2> @everyone', {
      resolveMention: (id) => (id === 'u1' ? 'Kim <Hwan>' : null),
      selfId: 'u1',
    })
    expect(html).toContain('<span class="md-mention is-self" data-user-id="u1">@Kim &lt;Hwan&gt;</span>')
    expect(html).toContain('data-user-id="u2">@알 수 없는 사용자</span>')
    expect(html).toContain('<span class="md-mention is-self">@everyone</span>')
  })
})

describe('renderMarkdown — XSS safety', () => {
  it('escapes raw HTML tags such as <img onerror>', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)>')
    expect(html).toBe('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
  })

  it('never links javascript: urls', () => {
    const html = renderMarkdown('javascript:alert(1) [x](javascript:alert(1))')
    expect(html).not.toContain('<a')
    expect(html).not.toContain('href')
  })

  it('escapes script tags and attribute breakouts inside urls', () => {
    const html = renderMarkdown('https://a.com/"onmouseover="alert(1) <script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).not.toMatch(/href="[^"]*"onmouseover/)
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes HTML inside code blocks and mention ids', () => {
    expect(renderMarkdown('`<b>`')).toBe('<code class="md-code">&lt;b&gt;</code>')
    expect(renderMarkdown('<@"><script>>')).not.toContain('<script>')
  })
})

describe('toPlainText', () => {
  it('strips formatting and resolves mentions', () => {
    expect(toPlainText('**hi** <@u1> ||x|| `c`', { resolveMention: () => '환' })).toBe('hi @환 [스포일러] c')
  })
})
