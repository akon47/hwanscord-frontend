import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * One-time token from an email link. Links put it in the fragment (`#token=…`) so it never reaches a
 * server log; the older `?token=…` form is still accepted for links that were already sent.
 */
export function readLinkToken(route: Pick<RouteLocationNormalizedLoaded, 'hash' | 'query'>): string {
  const hash = route.hash.startsWith('#') ? route.hash.slice(1) : route.hash
  const fromHash = new URLSearchParams(hash).get('token')
  if (fromHash) return fromHash
  return typeof route.query.token === 'string' ? route.query.token : ''
}
