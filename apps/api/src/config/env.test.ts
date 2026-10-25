import { describe, expect, it } from 'vitest'
import { EnvError, loadEnv } from './env.js'

const valid = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  APP_ORIGINS: 'http://localhost:5170, http://localhost:5171',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '54325',
  EMAIL_FROM: 'Portal <no-reply@example.ao>',
}

describe('loadEnv', () => {
  it('parses a valid configuration with defaults', () => {
    const env = loadEnv(valid)
    expect(env.PORT).toBe(3000)
    expect(env.TRUST_PROXY_HOPS).toBe(0)
    expect(env.APP_ORIGINS).toEqual(['http://localhost:5170', 'http://localhost:5171'])
    expect(env.EMAIL_WORKER_ENABLED).toBe(true)
  })

  it('lists every missing variable by name, in Portuguese', () => {
    const { DATABASE_URL: _db, SMTP_HOST: _smtp, ...partial } = valid
    expect(() => loadEnv(partial)).toThrow(EnvError)
    expect(() => loadEnv(partial)).toThrow(/DATABASE_URL: falta[\s\S]*SMTP_HOST: falta/)
  })

  it('refuses an invalid value and names it', () => {
    expect(() => loadEnv({ ...valid, PORT: 'abc' })).toThrow(/PORT: valor inválido/)
    expect(() => loadEnv({ ...valid, TRUST_PROXY_HOPS: 'true' })).toThrow(/TRUST_PROXY_HOPS: valor inválido/)
  })
})
