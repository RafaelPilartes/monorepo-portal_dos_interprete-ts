import { describe, expect, it, vi } from 'vitest'
import { DataError } from '../../domain/errors/DataError'
import { ApiClient } from './ApiClient'

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function client(fetchImpl: typeof fetch, token: string | null = 'jwt') {
  return new ApiClient({ baseUrl: 'http://api.test/', getAccessToken: async () => token, fetchImpl })
}

describe('ApiClient', () => {
  it('sends the session JWT and the idempotency key, and returns the body', async () => {
    const fetchImpl = vi.fn(async () => json(201, { id: 'p1' }))
    await expect(client(fetchImpl).post('/payments', { amount: 1 }, 'key-1')).resolves.toEqual({ id: 'p1' })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://api.test/payments')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer jwt', 'Idempotency-Key': 'key-1' })
  })

  it('uses the catalog message and the field the server names, not the server text', async () => {
    const fetchImpl = vi.fn(async () =>
      json(400, { error: { code: 'INVALID_IBAN', message: 'whatever the server said', field: 'iban' } }),
    )
    const error = (await client(fetchImpl).put('/me/payout-details', {}).catch((e: unknown) => e)) as DataError
    expect(error).toBeInstanceOf(DataError)
    expect(error.code).toBe('INVALID_IBAN')
    expect(error.field).toBe('iban')
    expect(error.message).toBe('IBAN inválido. Um IBAN angolano começa por AO06 e tem 25 caracteres.')
  })

  it('treats a 401 without a body as UNAUTHENTICATED', async () => {
    const error = (await client(vi.fn(async () => new Response(null, { status: 401 }))).get('/me').catch((e: unknown) => e)) as DataError
    expect(error.code).toBe('UNAUTHENTICATED')
  })

  it('treats an unknown code or a network failure as INTERNAL_ERROR', async () => {
    const unknown = (await client(vi.fn(async () => json(500, { error: { code: 'SOMETHING_NEW' } }))).get('/x').catch((e: unknown) => e)) as DataError
    expect(unknown.code).toBe('INTERNAL_ERROR')
    const offline = (await client(vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')))).get('/x').catch((e: unknown) => e)) as DataError
    expect(offline.code).toBe('INTERNAL_ERROR')
  })

  it('sends no Authorization header without a session', async () => {
    const fetchImpl = vi.fn(async () => json(200, { ok: true }))
    await client(fetchImpl, null).get('/health')
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })
})
