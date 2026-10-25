import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { catalogMessage } from '@portal-dos-interpretes/core/errors'
import { createStorageClient } from './integrations/storage.js'
import { createConfirmedAccount, deleteAccount, type TestAccount } from './integrations/testing/localAuth.js'
import { createDatabase } from './lib/db.js'
import { resolveMigrationInBuild } from './lib/migrations.js'
import { createTokenVerifier } from './lib/tokens.js'
import { buildServer } from './server.js'
import { local } from './testing/localSupabase.js'

// The API against the local database and Auth server (foundation.md §G, "Feito quando").

const db = createDatabase(local.DB_URL)
let app: FastifyInstance
let account: TestAccount

beforeAll(async () => {
  app = await buildServer({
    db,
    migrationInBuild: resolveMigrationInBuild(undefined),
    verifyToken: createTokenVerifier({ supabaseUrl: local.API_URL }),
    storage: createStorageClient({ supabaseUrl: local.API_URL, serviceRoleKey: local.SERVICE_ROLE_KEY }),
  })
  app.get('/whoami', async (request) => ({ id: request.account?.id }))
  app.get('/force-db-error', { config: { access: 'public' } }, async () =>
    db.transaction((client) => client.query('SELECT 1 / 0')),
  )
  account = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
})

afterAll(async () => {
  await app.close()
  await db.close()
})

describe('API against the local database', () => {
  it('reports health ok with the migration of this build applied', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ status: 'ok', migration_in_database: resolveMigrationInBuild(undefined) })
  })

  it('answers a request without a token with 401 UNAUTHENTICATED', async () => {
    const response = await app.inject({ method: 'GET', url: '/whoami' })
    expect(response.statusCode).toBe(401)
    expect(response.json().error).toEqual({ code: 'UNAUTHENTICATED', message: catalogMessage('UNAUTHENTICATED'), field: null })
  })

  it('accepts a real session token (ES256, JWKS) and resolves the account from it', async () => {
    const response = await app.inject({ method: 'GET', url: '/whoami', headers: { authorization: `Bearer ${account.accessToken}` } })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ id: account.id })
  })

  it('refuses a tampered token', async () => {
    const [header, payload, signature] = account.accessToken.split('.')
    const forgedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload ?? '', 'base64url').toString()), sub: '00000000-0000-4000-8000-000000000000' })).toString('base64url')
    const response = await app.inject({ method: 'GET', url: '/whoami', headers: { authorization: `Bearer ${header}.${forgedPayload}.${signature}` } })
    expect(response.statusCode).toBe(401)
  })

  it('sends a forced database error as INTERNAL_ERROR without technical text', async () => {
    const response = await app.inject({ method: 'GET', url: '/force-db-error' })
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: catalogMessage('INTERNAL_ERROR'), field: null } })
    expect(response.body).not.toMatch(/division|22012/)
  })

  it('refuses an upload until the step that owns the purpose allows it (SQL decides)', async () => {
    const response = await app.inject({
      method: 'POST', url: '/uploads/sign', headers: { authorization: `Bearer ${account.accessToken}` },
      payload: { purpose: 'payment_proof', subject_id: account.id, file_name: 'p.pdf', content_type: 'application/pdf', size_bytes: 10 },
    })
    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('FORBIDDEN')
  })

  it('treats the token of a deleted account as no session', async () => {
    const gone = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
    await deleteAccount(local.API_URL, local.SERVICE_ROLE_KEY, gone.id)
    const response = await app.inject({ method: 'GET', url: '/whoami', headers: { authorization: `Bearer ${gone.accessToken}` } })
    expect(response.statusCode).toBe(401)
  })
})
