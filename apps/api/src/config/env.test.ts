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
  SITE_URL: 'http://localhost:5170',
  REQUESTER_URL: 'http://localhost:5171',
  INTERPRETER_URL: 'http://localhost:5172',
  ADMIN_URL: 'http://localhost:5173',
}

describe('loadEnv', () => {
  it('parses a valid configuration with defaults', () => {
    const env = loadEnv(valid)
    expect(env.PORT).toBe(3000)
    expect(env.TRUST_PROXY_HOPS).toBeUndefined()
    expect(env.APP_ORIGINS).toEqual(['http://localhost:5170', 'http://localhost:5171'])
    expect(env.EMAIL_WORKER_ENABLED).toBe(true)
  })

  it('lists every missing variable by name, in Portuguese', () => {
    const { DATABASE_URL: _db, SMTP_HOST: _smtp, ...partial } = valid
    expect(() => loadEnv(partial)).toThrow(EnvError)
    expect(() => loadEnv(partial)).toThrow(/DATABASE_URL: falta[\s\S]*SMTP_HOST: falta/)
  })

  it('treats empty values from a copied .env.example as not set', () => {
    const env = loadEnv({ ...valid, SUPABASE_JWT_SECRET: '', SMTP_USER: '', SMTP_PASSWORD: '', TRUST_PROXY_HOPS: '' })
    expect(env.SUPABASE_JWT_SECRET).toBeUndefined()
    expect(env.SMTP_USER).toBeUndefined()
  })

  it('requires TRUST_PROXY_HOPS in production', () => {
    expect(() => loadEnv({ ...valid, NODE_ENV: 'production' })).toThrow(/TRUST_PROXY_HOPS/)
    expect(loadEnv({ ...valid, NODE_ENV: 'production', TRUST_PROXY_HOPS: '1' }).TRUST_PROXY_HOPS).toBe(1)
  })

  it('refuses an invalid value and names it', () => {
    expect(() => loadEnv({ ...valid, PORT: 'abc' })).toThrow(/PORT: valor inválido/)
    expect(() => loadEnv({ ...valid, TRUST_PROXY_HOPS: 'true' })).toThrow(/TRUST_PROXY_HOPS: valor inválido/)
  })
})
