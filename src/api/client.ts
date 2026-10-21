import type { ApiErrorBody } from './types'
import { getToken, notifyUnauthorized } from './token'

export const API_BASE = '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get fieldErrors(): Record<string, string[]> {
    const d = this.details as { fieldErrors?: Record<string, string[]> } | undefined
    return d?.fieldErrors ?? {}
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions {
  query?: Query
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null
  try {
    body = (await response.json()) as ApiErrorBody
  } catch {
    body = null
  }
  const code = body?.error?.code ?? (response.status === 429 ? 'RATE_LIMITED' : 'HTTP_ERROR')
  const message = body?.error?.message ?? `요청에 실패했습니다 (${response.status})`
  return new ApiError(response.status, code, message, body?.error?.details)
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }
  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body,
    signal: options.signal,
    credentials: 'same-origin',
  })
  if (response.status === 401) {
    const error = await parseError(response)
    if (token) notifyUnauthorized()
    throw error
  }
  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

export interface UploadHandle<T> {
  promise: Promise<T>
  abort: () => void
}

/** multipart upload with progress (XMLHttpRequest, because fetch has no upload progress). */
export function upload<T>(
  method: 'POST' | 'PUT',
  path: string,
  formData: FormData,
  onProgress?: (ratio: number) => void,
): UploadHandle<T> {
  const xhr = new XMLHttpRequest()
  const promise = new Promise<T>((resolve, reject) => {
    xhr.open(method, buildUrl(path))
    xhr.setRequestHeader('Accept', 'application/json')
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total)
    }
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK_ERROR', '네트워크 오류가 발생했습니다.'))
    xhr.onabort = () => reject(new ApiError(0, 'ABORTED', '업로드가 취소되었습니다.'))
    xhr.onload = () => {
      let parsed: unknown = null
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        parsed = null
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsed as T)
        return
      }
      if (xhr.status === 401 && token) notifyUnauthorized()
      const body = parsed as ApiErrorBody | null
      reject(
        new ApiError(
          xhr.status,
          body?.error?.code ?? 'HTTP_ERROR',
          body?.error?.message ?? `업로드에 실패했습니다 (${xhr.status})`,
          body?.error?.details,
        ),
      )
    }
    xhr.send(formData)
  })
  return { promise, abort: () => xhr.abort() }
}

export function errorMessage(error: unknown, fallback = '문제가 발생했습니다. 다시 시도해 주세요.'): string {
  if (error instanceof ApiError) return error.message
  if (isNetworkError(error)) return '서버에 연결할 수 없습니다.'
  if (error instanceof Error && error.message) return error.message
  return fallback
}
