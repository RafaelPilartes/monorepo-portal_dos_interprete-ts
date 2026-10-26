import { isErrorCode, paramsFromMessage, type MessageParams } from '@portal-dos-interpretes/core/errors'
import { DataError } from '../../domain/errors/DataError'

export interface ApiClientOptions {
  baseUrl: string
  /** Returns the session JWT, or null without a session (architecture.md §6: the account comes from the JWT). */
  getAccessToken: () => Promise<string | null>
  fetchImpl?: typeof fetch | undefined
  /** Told of every failure (packages/auth re-reads the session on ACCOUNT_SUSPENDED and TERMS_ACCEPTANCE_REQUIRED). */
  onError?: ((error: DataError, request: { method: string; path: string }) => void) | undefined
}

interface ErrorEnvelope {
  error?: { code?: unknown; message?: unknown; params?: unknown; details?: unknown }
}

/** Codes for an error response without a catalog body (a proxy, a gateway, a crash). */
const STATUS_CODES: Record<number, string> = {
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  429: 'RATE_LIMITED',
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return !!value && typeof value === 'object' && Object.values(value).every((item) => typeof item === 'string')
}

function isParams(value: unknown): value is MessageParams {
  return !!value && typeof value === 'object' && Object.values(value).every((item) => typeof item === 'string' || typeof item === 'number')
}

/**
 * Calls apps/api with the session JWT and turns every failure into a DataError
 * with a catalog code (api.md §2). The app decides by `code`; the message shown
 * is the catalog's Portuguese text, never the server's or the network's.
 */
export class ApiClient {
  private readonly fetchImpl: typeof fetch

  constructor(private readonly options: ApiClientOptions) {
    this.fetchImpl = options.fetchImpl ?? ((...args) => globalThis.fetch(...args))
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  post<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    return this.request<T>('POST', path, body, idempotencyKey)
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async request<T>(method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    const token = await this.options.getAccessToken()
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
    const url = `${this.options.baseUrl.replace(/\/+$/, '')}${path}`

    let response: Response
    try {
      response = await this.fetchImpl(url, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
    } catch (cause) {
      console.error(`[api] ${method} ${path}: network failure`, cause)
      throw new DataError('INTERNAL_ERROR', { cause })
    }

    if (response.status === 204) return undefined as T

    const isJson = (response.headers.get('Content-Type') ?? '').includes('application/json')
    const payload: unknown = isJson ? await response.json().catch(() => undefined) : undefined

    if (response.ok) {
      // A 2xx that is not JSON is not our API (e.g. API_URL pointing at a web app): never a success.
      if (payload === undefined) {
        console.error(`[api] ${method} ${path}: ${response.status} without a JSON body`)
        throw new DataError('INTERNAL_ERROR')
      }
      return payload as T
    }

    const envelope = (payload ?? {}) as ErrorEnvelope
    const sentCode = typeof envelope.error?.code === 'string' ? envelope.error.code : undefined
    const code = sentCode ?? STATUS_CODES[response.status] ?? 'INTERNAL_ERROR'
    if (!sentCode || !isErrorCode(sentCode)) {
      console.error(`[api] ${method} ${path}: ${response.status} with code ${sentCode ?? 'none'}`)
    }
    let params: MessageParams | undefined
    if (isParams(envelope.error?.params)) {
      params = envelope.error.params
    } else if (typeof envelope.error?.message === 'string') {
      params = paramsFromMessage(code, envelope.error.message) ?? undefined
    }
    const details = isStringRecord(envelope.error?.details) ? envelope.error.details : undefined
    const error = new DataError(code, { params, details, cause: payload })
    this.options.onError?.(error, { method, path })
    throw error
  }
}
