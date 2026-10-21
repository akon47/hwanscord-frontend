// Tiny token holder so the API client does not depend on Pinia (avoids circular imports).

const STORAGE_KEY = 'hwanscord.token'

let token: string | null = readStoredToken()
let unauthorizedHandler: (() => void) | null = null

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return token
}

export function setToken(value: string | null): void {
  token = value
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable (private mode) — keep the in-memory token only
  }
}

export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export function notifyUnauthorized(): void {
  unauthorizedHandler?.()
}
