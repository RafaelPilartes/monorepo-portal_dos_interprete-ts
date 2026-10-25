import { DataError } from '../../domain/errors/DataError'

export interface ApiClientOptions {
  baseUrl: string
  /** Returns the session JWT, or null without a session (architecture.md §6: the account comes from the JWT). */
  getAccessToken: () => Promise<string | null>
  fetchImpl?: typeof fetch | undefined
}

interface ErrorEnvelope {
  error?: { code?: unknown; field?: unknown; details?: unknown }
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

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async request<T>(method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
    const token = await this.options.getAccessToken()
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

    let response: Response
    try {
      response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/+$/, '')}${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
    } catch (cause) {
      throw new DataError('INTERNAL_ERROR', { cause })
    }

    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const envelope = (payload ?? {}) as ErrorEnvelope
      const code = typeof envelope.error?.code === 'string' ? envelope.error.code : response.status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL_ERROR'
      const field = typeof envelope.error?.field === 'string' ? envelope.error.field : undefined
      const details =
        envelope.error?.details && typeof envelope.error.details === 'object'
          ? (envelope.error.details as Record<string, string>)
          : undefined
      throw new DataError(code, { ...(field !== undefined ? { field } : {}), ...(details ? { details } : {}), cause: payload })
    }
    return payload as T
  }
}
