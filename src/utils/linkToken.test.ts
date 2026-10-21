import { describe, expect, it } from 'vitest'
import { readLinkToken } from './linkToken'

describe('readLinkToken', () => {
  it('reads the token from the fragment', () => {
    expect(readLinkToken({ hash: '#token=abc_DEF-1', query: {} })).toBe('abc_DEF-1')
  })
  it('prefers the fragment over the query', () => {
    expect(readLinkToken({ hash: '#token=frag', query: { token: 'query' } })).toBe('frag')
  })
  it('falls back to the legacy query form', () => {
    expect(readLinkToken({ hash: '', query: { token: 'legacy' } })).toBe('legacy')
  })
  it('returns an empty string when there is no token', () => {
    expect(readLinkToken({ hash: '#other=1', query: {} })).toBe('')
  })
})
