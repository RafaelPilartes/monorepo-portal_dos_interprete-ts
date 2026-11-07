import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createStorageClient } from '../../integrations/storage.js'
import { createConfirmedAccount, type TestAccount } from '../../integrations/testing/localAuth.js'
import { createDatabase } from '../../lib/db.js'
import { createTokenVerifier } from '../../lib/tokens.js'
import { buildServer } from '../../server.js'
import { local } from '../../testing/localSupabase.js'
import { acceptCurrentTerms } from '../../testing/terms.js'

// Step H1 routes against the local database (staff-and-config.md criteria 2–4).

const db = createDatabase(local.DB_URL)
const owner = new pg.Pool({ connectionString: local.DB_URL, max: 2 })
let app: FastifyInstance
let superAdmin: TestAccount
let moderator: TestAccount

const as = (account: TestAccount) => ({ authorization: `Bearer ${account.accessToken}` })
async function currentVersion(): Promise<string | null> {
  return (await owner.query("SELECT id FROM config.platform_versions WHERE status = 'published'")).rows[0]?.id ?? null
}

beforeAll(async () => {
  app = await buildServer({
    db,
    verifyToken: createTokenVerifier({ supabaseUrl: local.API_URL }),
    storage: createStorageClient({ supabaseUrl: local.API_URL, serviceRoleKey: local.SERVICE_ROLE_KEY }),
  })
  superAdmin = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  moderator = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  // Test setup only: the team as bootstrap-admin would leave it.
  await owner.query("INSERT INTO identity.staff_members (account_id, level) VALUES ($1, 'super_admin'), ($2, 'moderator')", [superAdmin.id, moderator.id])
  for (const account of [superAdmin, moderator]) await acceptCurrentTerms(owner, account.id)
  if (!(await currentVersion())) {
    const draft = (await owner.query("SELECT id FROM config.platform_versions WHERE status = 'draft' ORDER BY version_number LIMIT 1")).rows[0].id
    await owner.query('SELECT config.publish_version($1, $2, NULL)', [superAdmin.id, draft])
  }
})

afterAll(async () => {
  await app.close()
  await db.close()
  await owner.end()
})

describe('configuration versions', () => {
  it('refuses a moderator with 403 FORBIDDEN (criterion 2)', async () => {
    const response = await app.inject({ method: 'POST', url: '/admin/config/versions', headers: as(moderator), payload: {} })
    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('FORBIDDEN')
  })

  it('creates a draft, edits it, publishes it, and audits the request (criterion 3, R-AUD-02)', async () => {
    const before = await currentVersion()
    const draft = await app.inject({ method: 'POST', url: '/admin/config/versions', headers: as(superAdmin), payload: {} })
    expect(draft.statusCode).toBe(201)
    const id = draft.json().id as string
    const edited = await app.inject({
      method: 'PATCH', url: `/admin/config/versions/${id}`, headers: as(superAdmin),
      payload: { values: { invite_expiry_hours: 47 }, notes: 'teste' },
    })
    expect(edited.statusCode).toBe(200)
    expect(edited.json().invite_expiry_hours).toBe(47)
    const published = await app.inject({
      method: 'POST', url: `/admin/config/versions/${id}/publish`, headers: { ...as(superAdmin), 'x-forwarded-for': '1.2.3.4' },
      payload: { expected_current_version_id: before },
    })
    expect(published.statusCode).toBe(200)
    expect(published.json().status).toBe('published')
    expect(await currentVersion()).toBe(id)
    expect((await owner.query("SELECT count(*)::int AS n FROM config.platform_versions WHERE status = 'published'")).rows[0].n).toBe(1)
    const audit = (await owner.query("SELECT actor_account, request_id, ip FROM audit.events WHERE action = 'config.published' AND entity_id = $1", [id])).rows[0]
    expect(audit.actor_account).toBe(superAdmin.id)
    expect(audit.request_id).toMatch(/^req-/)
    expect(audit.ip).toBe('127.0.0.1')
  })

  it('lets only one of two publishes over the same version win; the other gets STATE_CHANGED', async () => {
    const before = await currentVersion()
    const a = (await app.inject({ method: 'POST', url: '/admin/config/versions', headers: as(superAdmin), payload: {} })).json().id
    const b = (await app.inject({ method: 'POST', url: '/admin/config/versions', headers: as(superAdmin), payload: {} })).json().id
    const results = await Promise.all([a, b].map((id) => app.inject({
      method: 'POST', url: `/admin/config/versions/${id}/publish`, headers: as(superAdmin), payload: { expected_current_version_id: before },
    })))
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409])
    expect(results.find((r) => r.statusCode === 409)?.json().error.code).toBe('STATE_CHANGED')
    expect((await owner.query("SELECT count(*)::int AS n FROM config.platform_versions WHERE status = 'published'")).rows[0].n).toBe(1)
  })

  it('answers a value the database refuses on the field, in Portuguese', async () => {
    const id = (await app.inject({ method: 'POST', url: '/admin/config/versions', headers: as(superAdmin), payload: {} })).json().id
    const negative = await app.inject({ method: 'PATCH', url: `/admin/config/versions/${id}`, headers: as(superAdmin), payload: { values: { invite_expiry_hours: -1 } } })
    expect(negative.statusCode).toBe(400)
    expect(negative.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { invite_expiry_hours: 'Há campos por corrigir.' } })
    const iban = await app.inject({ method: 'PATCH', url: `/admin/config/versions/${id}`, headers: as(superAdmin), payload: { values: { academia_iban: 'PT50000' } } })
    expect(iban.json().error).toMatchObject({ code: 'INVALID_IBAN', field: 'iban' })
    const published = await app.inject({ method: 'PATCH', url: `/admin/config/versions/${await currentVersion()}`, headers: as(superAdmin), payload: { values: { invite_expiry_hours: 1 } } })
    expect(published.json().error.code).toBe('STATE_CHANGED')
  })
})

describe('GET /me', () => {
  it('answers who the caller is: account, roles and staff level', async () => {
    const response = await app.inject({ method: 'GET', url: '/me', headers: as(moderator) })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      account: { id: moderator.id, email: moderator.email, status: 'active' },
      roles: ['staff'],
      staff_level: 'moderator',
    })
    expect((await app.inject({ method: 'GET', url: '/me' })).statusCode).toBe(401)
  })
})

describe('team', () => {
  it('adds an existing account by email and refuses an unknown email with ACCOUNT_NOT_FOUND', async () => {
    const person = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
    const added = await app.inject({ method: 'POST', url: '/admin/staff', headers: as(superAdmin), payload: { email: person.email.toUpperCase(), level: 'finance' } })
    expect(added.statusCode).toBe(201)
    expect(added.json()).toMatchObject({ account_id: person.id, level: 'finance', active: true })
    const unknown = await app.inject({ method: 'POST', url: '/admin/staff', headers: as(superAdmin), payload: { email: `nobody-${randomUUID()}@example.ao`, level: 'finance' } })
    expect(unknown.statusCode).toBe(404)
    expect(unknown.json().error).toMatchObject({ code: 'ACCOUNT_NOT_FOUND', field: 'email' })
    const changed = await app.inject({ method: 'PATCH', url: `/admin/staff/${person.id}`, headers: as(superAdmin), payload: { active: false } })
    expect(changed.json()).toMatchObject({ level: 'finance', active: false })
  })

  it('refuses team changes from a moderator', async () => {
    const response = await app.inject({ method: 'POST', url: '/admin/staff', headers: as(moderator), payload: { email: 'x@example.ao', level: 'finance' } })
    expect(response.statusCode).toBe(403)
  })
})

describe('legal documents and document types', () => {
  it('publishes a legal draft and refuses to edit it afterwards', async () => {
    const draft = await app.inject({ method: 'POST', url: '/admin/legal-documents', headers: as(superAdmin), payload: { kind: 'privacy', body: '# Política' } })
    expect(draft.statusCode).toBe(201)
    const id = draft.json().id
    expect((await app.inject({ method: 'POST', url: `/admin/legal-documents/${id}/publish`, headers: as(superAdmin) })).statusCode).toBe(200)
    // A new version must be accepted before anything else (R-PRIV-02).
    for (const account of [superAdmin, moderator]) await acceptCurrentTerms(owner, account.id)
    const edit = await app.inject({ method: 'PATCH', url: `/admin/legal-documents/${id}`, headers: as(superAdmin), payload: { body: 'outro' } })
    expect(edit.json().error.code).toBe('STATE_CHANGED')
  })

  it('lets a moderator create and remove a document type', async () => {
    const code = `t_${randomUUID().slice(0, 8)}`
    const created = await app.inject({
      method: 'POST', url: '/admin/document-types', headers: as(moderator),
      payload: { code, name: 'Carta de condução', description: '', required: false, active: true, sort: 9 },
    })
    expect(created.statusCode).toBe(201)
    const duplicate = await app.inject({
      method: 'POST', url: '/admin/document-types', headers: as(moderator),
      payload: { code, name: 'Outra', description: '', required: false, active: true, sort: 10 },
    })
    expect(duplicate.statusCode).toBe(400)
    expect(duplicate.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { code: 'Já existe um tipo de documento com este código.' } })
    const removed = await app.inject({ method: 'DELETE', url: `/admin/document-types/${created.json().id}`, headers: as(moderator) })
    expect(removed.statusCode).toBe(204)
  })
})
