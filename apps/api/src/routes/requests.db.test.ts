import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createConfirmedAccount, type TestAccount } from '../integrations/testing/localAuth.js'
import { createDatabase } from '../lib/db.js'
import { createTokenVerifier } from '../lib/tokens.js'
import { buildServer } from '../server.js'
import { local } from '../testing/localSupabase.js'
import { acceptCurrentTerms } from '../testing/terms.js'

// Step H5 routes against the local database (requests-direct.md criterion 6: create a direct
// request, invite, accept, confirmed; requests-core.md criterion 1 through the API).

const db = createDatabase(local.DB_URL)
const owner = new pg.Pool({ connectionString: local.DB_URL, max: 2 })
let app: FastifyInstance
let requester: TestAccount
let interpreter: TestAccount
let serviceId = ''
let languageId = ''
const as = (account: TestAccount) => ({ authorization: `Bearer ${account.accessToken}` })

beforeAll(async () => {
  app = await buildServer({ db, verifyToken: createTokenVerifier({ supabaseUrl: local.API_URL }) })
  requester = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  interpreter = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  await owner.query(`UPDATE config.platform_versions SET status = 'published', published_at = now()
                      WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published')`)
  for (const account of [requester, interpreter]) await acceptCurrentTerms(owner, account.id)
  await owner.query('SELECT identity.become_requester($1, NULL, NULL, NULL)', [requester.id])
  await owner.query('SELECT identity.become_interpreter($1, NULL, NULL)', [interpreter.id])
  serviceId = (await owner.query<{ id: string }>("SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1")).rows[0]!.id
  languageId = (await owner.query<{ id: string }>("SELECT id FROM catalog.languages WHERE code = 'lga'")).rows[0]!.id
  // Test setup: a complete profile (the interpreter's own screens are H4's).
  await owner.query(`UPDATE identity.interpreter_profiles SET modality = 'both', city = 'Luanda', travel_fee_aoa = 1500,
                       bio = repeat('Intérprete de Língua Gestual Angolana em consultas e tribunais. ', 2) WHERE account_id = $1`, [interpreter.id])
  await owner.query("INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level) VALUES ($1, $2, 'fluent')", [interpreter.id, languageId])
  await owner.query('INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa) VALUES ($1, $2, 8000)', [interpreter.id, serviceId])
})

afterAll(async () => {
  await app.close()
  await db.close()
  await owner.end()
})

const inThreeDays = () => new Date(Date.now() + 3 * 24 * 3600_000).toISOString()

function request(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'direct', service_id: serviceId, language_ids: [languageId], modality: 'in_person', address: 'Rua da Missão, 12',
    city: 'Luanda', starts_at: inThreeDays(), duration_minutes: 90, interpreters_needed: 1, interpreter_ids: [interpreter.id],
    beneficiary_name: 'Sr. Beneficiário', expected_total_aoa: 13500, ...overrides,
  }
}

describe('direct request through the API (requests-direct.md criterion 6)', () => {
  it('previews the total on the server: 90 minutes at 8000/h plus the travel fee in person', async () => {
    const preview = await app.inject({ method: 'POST', url: '/requests/preview', headers: as(requester), payload: {
      service_id: serviceId, duration_minutes: 90, modality: 'in_person', interpreter_ids: [interpreter.id],
    } })
    expect(preview.json()).toEqual({ total_aoa: 13500, lines: [{ interpreter_id: interpreter.id, price_aoa: 12000, travel_fee_aoa: 1500 }] })
  })

  it('creates, invites, and the interpreter accepts: the request is confirmed at the agreed price', async () => {
    const created = await app.inject({ method: 'POST', url: '/requests', headers: as(requester), payload: request() })
    expect(created.statusCode).toBe(201)
    expect(created.json()).toMatchObject({ kind: 'direct', status: 'awaiting_interpreters' })
    const assignment = (await owner.query<{ id: string }>('SELECT id FROM booking.request_assignments WHERE request_id = $1', [created.json().id])).rows[0]!
    const accepted = await app.inject({ method: 'POST', url: `/assignments/${assignment.id}/accept`, headers: as(interpreter) })
    expect(accepted.json()).toMatchObject({ status: 'accepted', agreed_price_aoa: 12000, agreed_travel_fee_aoa: 1500 })
    const status = await owner.query('SELECT status FROM booking.requests WHERE id = $1', [created.json().id])
    expect(status.rows[0]).toEqual({ status: 'confirmed' })
    const again = await app.inject({ method: 'POST', url: `/assignments/${assignment.id}/accept`, headers: as(interpreter) })
    expect(again.json().error.code).toBe('STATE_CHANGED')
  })

  it('answers each refusal with its code, its field and the values of its message (core criterion 1)', async () => {
    const soon = await app.inject({ method: 'POST', url: '/requests', headers: as(requester), payload: request({ starts_at: new Date(Date.now() + 20 * 60_000).toISOString() }) })
    expect(soon.json().error).toMatchObject({ code: 'START_TOO_SOON', message: 'O serviço tem de começar pelo menos 30 minutos a partir de agora.', field: 'starts_at' })
    const changed = await app.inject({ method: 'POST', url: '/requests', headers: as(requester), payload: request({ expected_total_aoa: 1 }) })
    expect(changed.json().error.code).toBe('PRICE_CHANGED')
    const address = await app.inject({ method: 'POST', url: '/requests', headers: as(requester), payload: request({ address: undefined }) })
    expect(address.json().error).toMatchObject({ code: 'ADDRESS_REQUIRED', field: 'address' })
    const notRequester = await app.inject({ method: 'POST', url: '/requests', headers: as(interpreter), payload: request() })
    expect(notRequester.json().error.code).toBe('FORBIDDEN')
  })

  it('a decline needs a reason; the requester is told why', async () => {
    const created = await app.inject({ method: 'POST', url: '/requests', headers: as(requester), payload: request({ starts_at: new Date(Date.now() + 9 * 24 * 3600_000).toISOString() }) })
    const assignment = (await owner.query<{ id: string }>('SELECT id FROM booking.request_assignments WHERE request_id = $1', [created.json().id])).rows[0]!
    const empty = await app.inject({ method: 'POST', url: `/assignments/${assignment.id}/decline`, headers: as(interpreter), payload: { reason: '' } })
    expect(empty.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { reason: 'Preenche este campo.' } })
    const declined = await app.inject({ method: 'POST', url: `/assignments/${assignment.id}/decline`, headers: as(interpreter), payload: { reason: 'Estou de férias' } })
    expect(declined.json()).toMatchObject({ status: 'declined', decline_reason: 'Estou de férias' })
    const told = await owner.query("SELECT payload->>'reason' AS reason FROM notify.notifications WHERE kind = 'request_declined' AND account_id = $1", [requester.id])
    expect(told.rows[0]).toEqual({ reason: 'Estou de férias' })
  })
})

describe('price negotiation through the API (negotiation.md)', () => {
  it('proposal, counter-proposal, accept; the interpreter then accepts at the negotiated price', async () => {
    const created = await app.inject({ method: 'POST', url: '/requests', headers: as(requester), payload: request({ starts_at: new Date(Date.now() + 12 * 24 * 3600_000).toISOString() }) })
    const thread = (await owner.query<{ id: string; assignment_id: string }>(
      'SELECT t.id, t.assignment_id FROM booking.threads AS t JOIN booking.request_assignments AS a ON a.id = t.assignment_id WHERE a.request_id = $1', [created.json().id])).rows[0]!
    const zero = await app.inject({ method: 'POST', url: `/threads/${thread.id}/proposals`, headers: as(requester), payload: { amount_aoa: 0 } })
    expect(zero.json().error).toMatchObject({ code: 'INVALID_AMOUNT', field: 'amount_aoa' })
    const first = await app.inject({ method: 'POST', url: `/threads/${thread.id}/proposals`, headers: as(requester), payload: { amount_aoa: 10000 } })
    expect(first.statusCode).toBe(201)
    const counter = await app.inject({ method: 'POST', url: `/threads/${thread.id}/proposals`, headers: as(interpreter), payload: { amount_aoa: 11000 } })
    const own = await app.inject({ method: 'POST', url: `/proposals/${counter.json().id}/accept`, headers: as(interpreter) })
    expect(own.json().error.code).toBe('OWN_PROPOSAL')
    const accepted = await app.inject({ method: 'POST', url: `/proposals/${counter.json().id}/accept`, headers: as(requester) })
    expect(accepted.json()).toMatchObject({ status: 'accepted', amount_aoa: 11000 })
    const confirmed = await app.inject({ method: 'POST', url: `/assignments/${thread.assignment_id}/accept`, headers: as(interpreter) })
    expect(confirmed.json()).toMatchObject({ status: 'accepted', agreed_price_aoa: 11000, agreed_travel_fee_aoa: 1500 })
    const closed = await app.inject({ method: 'POST', url: `/threads/${thread.id}/proposals`, headers: as(requester), payload: { amount_aoa: 9000 } })
    expect(closed.json().error.code).toBe('NEGOTIATION_CLOSED')
  })
})
