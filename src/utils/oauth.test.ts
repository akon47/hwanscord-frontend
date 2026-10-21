import { describe, expect, it } from 'vitest'
import {
  decodeSignupProfile,
  oauthErrorMessage,
  parseOAuthFragment,
  safeNext,
  sanitizeUsername,
} from './oauth'

describe('parseOAuthFragment', () => {
  it('reads a session token and the next path', () => {
    expect(parseOAuthFragment('#token=abc.def.ghi&next=%2Fchannels%2F123')).toEqual({
      kind: 'token',
      token: 'abc.def.ghi',
      next: '/channels/123',
    })
  })

  it('reads a pending signup', () => {
    expect(parseOAuthFragment('#signup=s.t.u&next=%2F')).toEqual({
      kind: 'signup',
      signupToken: 's.t.u',
      next: '/channels/@me',
    })
  })

  it('reads a linked result', () => {
    expect(parseOAuthFragment('linked=github&next=%2Fchannels%2F%40me')).toEqual({
      kind: 'linked',
      provider: 'github',
      next: '/channels/@me',
    })
  })

  it('prefers errors and rejects unknown or empty fragments', () => {
    expect(parseOAuthFragment('#error=denied&token=x')).toEqual({ kind: 'error', code: 'denied' })
    expect(parseOAuthFragment('')).toEqual({ kind: 'error', code: 'invalid' })
    expect(parseOAuthFragment('#linked=google')).toEqual({ kind: 'error', code: 'invalid' })
  })

  it('never returns an off-site next path', () => {
    for (const next of ['//evil.example', 'https://evil.example', '/\\evil', 'javascript:alert(1)']) {
      const r = parseOAuthFragment(`#token=t&next=${encodeURIComponent(next)}`)
      expect(r.kind === 'token' && r.next).toBe('/channels/@me')
    }
    expect(safeNext('/channels/1?x=2')).toBe('/channels/1?x=2')
  })

  it('has Korean messages for every server error code', () => {
    for (const code of ['state_mismatch', 'denied', 'exchange_failed', 'disabled', 'already_linked']) {
      expect(oauthErrorMessage(code)).not.toBe(oauthErrorMessage('nope'))
    }
  })
})

describe('sanitizeUsername', () => {
  it.each([
    ['Octo-Cat', 'octo_cat'],
    ['akon47', 'akon47'],
    ['--Weird__Name--', 'weird_name'],
    ['dots..and.more', 'dots.and.more'],
    ['한글만', 'user'],
    ['a', 'auser'],
    ['x'.repeat(40), 'x'.repeat(32)],
  ])('%s → %s', (login, expected) => {
    const out = sanitizeUsername(login)
    expect(out).toBe(expected)
    expect(out).toMatch(/^[a-z0-9_.]{2,32}$/)
  })
})

describe('decodeSignupProfile', () => {
  it('reads login and name from the token payload (UTF-8 safe)', () => {
    const payload = btoa(
      String.fromCharCode(...new TextEncoder().encode(JSON.stringify({ login: 'octo', name: '옥토캣' }))),
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(decodeSignupProfile(`h.${payload}.s`)).toEqual({ login: 'octo', name: '옥토캣' })
    expect(decodeSignupProfile('garbage')).toBeNull()
  })
})
