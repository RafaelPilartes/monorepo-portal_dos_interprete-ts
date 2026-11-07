import { describe, expect, it } from 'vitest'
import { buildServer } from '../server.js'
import { ACCOUNT_A, ACCOUNT_B, accountsDatabase, fakeVerifier } from '../testing/fakes.js'

describe('rate limits and client IP', () => {
  it('limits per account, answers RATE_LIMITED, and does not let one account use up another', async () => {
    const app = await buildServer({ db: accountsDatabase(), verifyToken: fakeVerifier })
    app.post('/create', { config: { rateLimit: { max: 2, timeWindow: '1 minute' } } }, async () => ({ ok: true }))
    const call = (id: string) => app.inject({ method: 'POST', url: '/create', headers: { authorization: `Bearer token-${id}` } })
    expect((await call(ACCOUNT_A)).statusCode).toBe(200)
    expect((await call(ACCOUNT_A)).statusCode).toBe(200)
    const limited = await call(ACCOUNT_A)
    expect(limited.statusCode).toBe(429)
    expect(limited.json().error.code).toBe('RATE_LIMITED')
    expect((await call(ACCOUNT_B)).statusCode).toBe(200)
    await app.close()
  })

  it('limits public routes per IP', async () => {
    const app = await buildServer({ db: accountsDatabase(), verifyToken: fakeVerifier })
    app.post('/contact', { config: { access: 'public', rateLimit: { max: 1, timeWindow: '1 hour' } } }, async () => ({ ok: true }))
    expect((await app.inject({ method: 'POST', url: '/contact', remoteAddress: '10.0.0.1' })).statusCode).toBe(200)
    expect((await app.inject({ method: 'POST', url: '/contact', remoteAddress: '10.0.0.1' })).statusCode).toBe(429)
    expect((await app.inject({ method: 'POST', url: '/contact', remoteAddress: '10.0.0.2' })).statusCode).toBe(200)
    await app.close()
  })

  it('trusts exactly the configured proxy hops, so a client cannot pick its IP', async () => {
    for (const [hops, expected] of [[0, '10.0.0.9'], [1, '198.51.100.7']] as const) {
      const app = await buildServer({ trustProxyHops: hops })
      app.get('/ip', { config: { access: 'public' } }, async (request) => ({ ip: request.ip }))
      const response = await app.inject({
        method: 'GET', url: '/ip', remoteAddress: '10.0.0.9',
        headers: { 'x-forwarded-for': '203.0.113.66, 198.51.100.7' },
      })
      expect(response.json().ip).toBe(expected)
      await app.close()
    }
  })
})
