import { describe, expect, it } from 'vitest'
import { buildServer } from './server.js'

describe('CORS', () => {
  it('lets the apps send every method the API uses, with the session token', async () => {
    const app = await buildServer({ appOrigins: ['http://localhost:5173'] })
    for (const method of ['PATCH', 'PUT', 'DELETE', 'POST']) {
      const response = await app.inject({
        method: 'OPTIONS', url: '/admin/staff/x',
        headers: { origin: 'http://localhost:5173', 'access-control-request-method': method, 'access-control-request-headers': 'authorization,content-type' },
      })
      expect(response.statusCode).toBe(204)
      expect(response.headers['access-control-allow-methods']).toContain(method)
      expect(String(response.headers['access-control-allow-headers']).toLowerCase()).toContain('authorization')
    }
    await app.close()
  })

  it('does not answer another origin', async () => {
    const app = await buildServer({ appOrigins: ['http://localhost:5173'] })
    const response = await app.inject({ method: 'OPTIONS', url: '/health', headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' } })
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
    await app.close()
  })
})
