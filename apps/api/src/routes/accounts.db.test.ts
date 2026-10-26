import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuthServer } from '../integrations/auth.js'
import { createConfirmedAccount, mailpitMessages, type TestAccount } from '../integrations/testing/localAuth.js'
import { createDatabase } from '../lib/db.js'
import { createTokenVerifier } from '../lib/tokens.js'
import { buildServer } from '../server.js'
import { local } from '../testing/localSupabase.js'
import { acceptCurrentTerms } from '../testing/terms.js'

// Step H2 routes against the local database and Auth server (accounts-and-organizations.md
// criteria 1, 4, 6; personal-data.md criteria 1, 2).

const db = createDatabase(local.DB_URL)
const owner = new pg.Pool({ connectionString: local.DB_URL, max: 2 })
const appUrls = { site: 'http://localhost:5170', requester: 'http://localhost:5171', interpreter: 'http://localhost:5172', admin: 'http://localhost:5173' }
let app: FastifyInstance
let documentIds: string[]
let moderator: TestAccount

const as = (account: TestAccount) => ({ authorization: `Bearer ${account.accessToken}` })
const uniqueNif = () => `54${Date.now().toString().slice(-8)}`

async function newAccount(): Promise<TestAccount> {
  const account = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  await acceptCurrentTerms(owner, account.id)
  return account
}

beforeAll(async () => {
  app = await buildServer({
    db,
    verifyToken: createTokenVerifier({ supabaseUrl: local.API_URL }),
    authServer: createAuthServer({ supabaseUrl: local.API_URL, serviceRoleKey: local.SERVICE_ROLE_KEY }),
    appUrls,
  })
  // Test setup: published terms and privacy (bootstrap-admin publishes them in a real database).
  for (const kind of ['terms', 'privacy']) {
    const published = await owner.query('SELECT 1 FROM identity.legal_documents WHERE kind = $1 AND published_at IS NOT NULL', [kind])
    if (published.rowCount === 0) {
      await owner.query(`INSERT INTO identity.legal_documents (kind, version, body, published_at)
                         VALUES ($1, (SELECT coalesce(max(version), 0) + 1 FROM identity.legal_documents WHERE kind = $1), '', now())`, [kind])
    }
  }
  documentIds = (await owner.query(`SELECT DISTINCT ON (kind) id FROM identity.legal_documents
                                     WHERE published_at IS NOT NULL ORDER BY kind, version DESC`)).rows.map((row) => row.id as string)
  moderator = await newAccount()
  await owner.query("INSERT INTO identity.staff_members (account_id, level) VALUES ($1, 'moderator')", [moderator.id])
  // The invite expiry comes from the configuration in force.
  if ((await owner.query("SELECT 1 FROM config.platform_versions WHERE status = 'published'")).rowCount === 0) {
    const draft = (await owner.query("SELECT id FROM config.platform_versions WHERE status = 'draft' ORDER BY version_number LIMIT 1")).rows[0].id
    await owner.query("UPDATE config.platform_versions SET status = 'published', published_at = now() WHERE id = $1", [draft])
  }
})

afterAll(async () => {
  await app.close()
  await db.close()
  await owner.end()
})

describe('POST /auth/register (R-ACC-01, R-PRIV-01)', () => {
  const register = (payload: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/auth/register', payload, headers: { 'x-forwarded-for': '9.9.9.9', 'user-agent': 'vitest' } })

  it('refuses without the box ticked: TERMS_NOT_ACCEPTED on accept_terms (privacy criterion 1)', async () => {
    const response = await register({ email: `r-${randomUUID()}@example.ao`, password: 'senha12345', full_name: 'Ana Teste', intended_role: 'requester', accept_terms: false, legal_document_ids: documentIds })
    expect(response.statusCode).toBe(400)
    expect(response.json().error).toMatchObject({ code: 'TERMS_NOT_ACCEPTED', field: 'accept_terms' })
  })

  it('creates the profile and no role, two consent rows, and sends the confirmation email (criterion 1)', async () => {
    const email = `r-${randomUUID()}@example.ao`
    const response = await register({ email, password: 'senha12345', full_name: 'Ana Registo', intended_role: 'interpreter', accept_terms: true, legal_document_ids: documentIds, return_to: '/invite/abc' })
    expect(response.statusCode).toBe(201)
    const accountId = response.json().account_id as string
    expect(response.json().email_confirmation_sent).toBe(true)
    const profile = (await owner.query('SELECT full_name, status FROM identity.profiles WHERE id = $1', [accountId])).rows[0]
    expect(profile).toEqual({ full_name: 'Ana Registo', status: 'active' })
    expect((await owner.query('SELECT identity.roles_of($1) AS roles', [accountId])).rows[0].roles).toEqual([])
    const consents = (await owner.query('SELECT user_agent FROM identity.consents WHERE account_id = $1', [accountId])).rows
    expect(consents).toHaveLength(2)
    expect(consents[0].user_agent).toBe('vitest')
    // The confirmation email reaches the local mail server, with a link back to the interpreter app.
    let messages: Awaited<ReturnType<typeof mailpitMessages>> = []
    for (let attempt = 0; attempt < 20 && messages.length === 0; attempt++) {
      messages = await mailpitMessages(local.MAILPIT_URL, email)
      if (messages.length === 0) await new Promise((resolve) => setTimeout(resolve, 250))
    }
    expect(messages.length).toBeGreaterThan(0)
  })

  it('answers EMAIL_IN_USE on the email field for an existing account', async () => {
    const existing = await newAccount()
    const response = await register({ email: existing.email.toUpperCase(), password: 'senha12345', full_name: 'Outra Vez', intended_role: 'requester', accept_terms: true, legal_document_ids: documentIds })
    expect(response.statusCode).toBe(409)
    expect(response.json().error).toMatchObject({ code: 'EMAIL_IN_USE', field: 'email' })
  })

  it('answers WEAK_PASSWORD for a password without digits', async () => {
    const response = await register({ email: `r-${randomUUID()}@example.ao`, password: 'sodeletras', full_name: 'Ana Fraca', intended_role: 'requester', accept_terms: true, legal_document_ids: documentIds })
    expect(response.statusCode).toBe(400)
    expect(response.json().error).toMatchObject({ code: 'WEAK_PASSWORD', field: 'password' })
  })

  it('refuses consent to an unpublished document before creating anything', async () => {
    const email = `r-${randomUUID()}@example.ao`
    const response = await register({ email, password: 'senha12345', full_name: 'Ana Errada', intended_role: 'requester', accept_terms: true, legal_document_ids: [randomUUID()] })
    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('VALIDATION_FAILED')
    expect((await owner.query('SELECT identity.email_in_use($1) AS used', [email])).rows[0].used).toBe(false)
  })
})

describe('terms, roles and the active role (R-PRIV-02, R-ACC-02, R-ACC-04)', () => {
  it('a new version: /me says so, other routes answer TERMS_ACCEPTANCE_REQUIRED, accepting clears it (privacy criterion 2)', async () => {
    const person = await newAccount()
    const terms = await owner.query(`INSERT INTO identity.legal_documents (kind, version, body, published_at)
      VALUES ('terms', (SELECT max(version) + 1 FROM identity.legal_documents WHERE kind = 'terms'), 'Nova', now()) RETURNING id`)
    const newTerms = terms.rows[0].id as string
    const me = await app.inject({ method: 'GET', url: '/me', headers: as(person) })
    expect(me.statusCode).toBe(200)
    expect(me.json().terms_acceptance_required).toBe(true)
    expect(me.json().pending_documents.map((d: { id: string }) => d.id)).toEqual([newTerms])
    const blocked = await app.inject({ method: 'POST', url: '/onboarding/requester', headers: as(person), payload: {} })
    expect(blocked.statusCode).toBe(403)
    expect(blocked.json().error.code).toBe('TERMS_ACCEPTANCE_REQUIRED')
    const accepted = await app.inject({ method: 'POST', url: '/me/accept-terms', headers: as(person), payload: { legal_document_ids: [newTerms] } })
    expect(accepted.json()).toEqual({ ok: true, pending: 0 })
    expect((await app.inject({ method: 'GET', url: '/me', headers: as(person) })).json().terms_acceptance_required).toBe(false)
    await acceptCurrentTerms(owner, moderator.id)
  })

  it('creates each role once and switches the active role only to a role the account has', async () => {
    const person = await newAccount()
    expect((await app.inject({ method: 'POST', url: '/me/active-role', headers: as(person), payload: { role: 'requester' } })).json().error.code).toBe('FORBIDDEN')
    const requester = await app.inject({ method: 'POST', url: '/onboarding/requester', headers: as(person), payload: { city: 'Luanda', nif: '' } })
    expect(requester.statusCode).toBe(201)
    const again = await app.inject({ method: 'POST', url: '/onboarding/requester', headers: as(person), payload: {} })
    expect(again.json().error.code).toBe('ROLE_ALREADY_EXISTS')
    const interpreter = await app.inject({ method: 'POST', url: '/onboarding/interpreter', headers: as(person), payload: { city: 'Benguela' } })
    expect(interpreter.statusCode).toBe(201)
    expect(interpreter.json().slug).toMatch(/^[a-z0-9-]+$/)
    const me = (await app.inject({ method: 'GET', url: '/me', headers: as(person) })).json()
    expect(me.roles).toEqual(['requester', 'interpreter'])
    const switched = await app.inject({ method: 'POST', url: '/me/active-role', headers: as(person), payload: { role: 'requester' } })
    expect(switched.json()).toEqual({ last_active_role: 'requester', app_url: appUrls.requester })
  })

  it('answers INVALID_NIF on the nif field', async () => {
    const person = await newAccount()
    const response = await app.inject({ method: 'POST', url: '/onboarding/requester', headers: as(person), payload: { nif: 'abc' } })
    expect(response.statusCode).toBe(400)
    expect(response.json().error).toMatchObject({ code: 'INVALID_NIF', field: 'nif' })
  })
})

describe('organisations and invites (R-ORG-01..04)', () => {
  it('runs create → invite → preview → accept, with NIF_IN_USE, INVITE_EMAIL_MISMATCH and LAST_OWNER (criterion 4)', async () => {
    const boss = await newAccount()
    const invited = await newAccount()
    const stranger = await newAccount()
    const nif = uniqueNif()
    const created = await app.inject({ method: 'POST', url: '/organizations', headers: as(boss), payload: { name: 'Clínica Teste', nif, city: 'Luanda' } })
    expect(created.statusCode).toBe(201)
    const orgId = created.json().id as string
    const duplicate = await app.inject({ method: 'POST', url: '/organizations', headers: as(stranger), payload: { name: 'Outra', nif } })
    expect(duplicate.json().error).toMatchObject({ code: 'NIF_IN_USE', field: 'nif' })

    const invite = await app.inject({ method: 'POST', url: `/organizations/${orgId}/invites`, headers: as(boss), payload: { email: invited.email, role: 'member' } })
    expect(invite.statusCode).toBe(201)
    expect(invite.json()).not.toHaveProperty('token_hash')
    expect(invite.json()).not.toHaveProperty('token')
    const forbidden = await app.inject({ method: 'POST', url: `/organizations/${orgId}/invites`, headers: as(stranger), payload: { email: 'x@example.ao', role: 'member' } })
    expect(forbidden.json().error.code).toBe('FORBIDDEN')
    const outbox = (await owner.query("SELECT payload FROM notify.email_outbox WHERE template = 'org_invite' AND to_email = $1", [invited.email])).rows[0]
    const token = (outbox.payload.link as string).replace('/invite/', '')

    const preview = await app.inject({ method: 'GET', url: `/invites/preview?token=${encodeURIComponent(token)}` })
    expect(preview.json()).toMatchObject({ organization_name: 'Clínica Teste', role: 'member', status: 'pending' })
    expect(preview.json().email_masked).not.toBe(invited.email)
    const unknown = await app.inject({ method: 'GET', url: `/invites/preview?token=${'x'.repeat(40)}` })
    expect(unknown.json().error.code).toBe('INVITE_INVALID')

    const mismatch = await app.inject({ method: 'POST', url: '/invites/accept', headers: as(stranger), payload: { token } })
    expect(mismatch.statusCode).toBe(403)
    expect(mismatch.json().error.code).toBe('INVITE_EMAIL_MISMATCH')
    const accepted = await app.inject({ method: 'POST', url: '/invites/accept', headers: as(invited), payload: { token } })
    expect(accepted.json()).toMatchObject({ organization_id: orgId, role: 'member', status: 'active' })
    expect((await app.inject({ method: 'GET', url: '/me', headers: as(invited) })).json().roles).toContain('requester')

    const removeOwner = await app.inject({ method: 'POST', url: `/organizations/${orgId}/members/${boss.id}/remove`, headers: as(boss) })
    expect(removeOwner.statusCode).toBe(409)
    expect(removeOwner.json().error.code).toBe('LAST_OWNER')
    const again = await app.inject({ method: 'POST', url: `/organizations/${orgId}/invites`, headers: as(boss), payload: { email: invited.email, role: 'admin' } })
    expect(again.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { email: 'Esta pessoa já é membro da organização.' } })

    const transfer = await app.inject({ method: 'POST', url: `/organizations/${orgId}/transfer-ownership`, headers: as(boss), payload: { new_owner_account_id: invited.id } })
    expect(transfer.statusCode).toBe(200)
    const left = await app.inject({ method: 'POST', url: `/organizations/${orgId}/members/${boss.id}/remove`, headers: as(boss) })
    expect(left.json()).toMatchObject({ status: 'removed' })
  })
})

describe('suspension (R-ACC-03, R-ACC-05, R-ACC-06)', () => {
  it('a suspended account gets ACCOUNT_SUSPENDED on every route; reactivation gives it back (criterion 6)', async () => {
    const person = await newAccount()
    const plain = await newAccount()
    const notModerator = await app.inject({ method: 'POST', url: `/admin/accounts/${person.id}/suspend`, headers: as(plain), payload: { reason: 'Fraude' } })
    expect(notModerator.json().error.code).toBe('FORBIDDEN')
    const noReason = await app.inject({ method: 'POST', url: `/admin/accounts/${person.id}/suspend`, headers: as(moderator), payload: { reason: '' } })
    expect(noReason.json().error.code).toBe('VALIDATION_FAILED')
    const suspended = await app.inject({ method: 'POST', url: `/admin/accounts/${person.id}/suspend`, headers: as(moderator), payload: { reason: 'Fraude comprovada' } })
    expect(suspended.json()).toMatchObject({ id: person.id, status: 'suspended' })
    for (const [method, url] of [['GET', '/me'], ['POST', '/onboarding/requester'], ['POST', '/organizations']] as const) {
      const response = await app.inject({ method, url, headers: as(person), payload: {} })
      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('ACCOUNT_SUSPENDED')
    }
    const audit = (await owner.query("SELECT actor_account FROM audit.events WHERE action = 'account.suspended' AND entity_id = $1", [person.id])).rows
    expect(audit).toEqual([{ actor_account: moderator.id }])
    const back = await app.inject({ method: 'POST', url: `/admin/accounts/${person.id}/reactivate`, headers: as(moderator) })
    expect(back.json()).toMatchObject({ status: 'active' })
    expect((await app.inject({ method: 'GET', url: '/me', headers: as(person) })).statusCode).toBe(200)
  })
})
