import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createConfirmedAccount, type TestAccount } from '../integrations/testing/localAuth.js'
import { createDatabase } from '../lib/db.js'
import { createTokenVerifier } from '../lib/tokens.js'
import { buildServer } from '../server.js'
import { local } from '../testing/localSupabase.js'
import { acceptCurrentTerms } from '../testing/terms.js'

// Step H10 routes against the local database (payments.md criterion 3, the concurrent one, and the
// proof flow through the API with the receipt PDF). Intents are inserted by fixture: their subjects
// arrive with H11, H12 and H17 (MASTER-PLAN H10).

const db = createDatabase(local.DB_URL)
const owner = new pg.Pool({ connectionString: local.DB_URL, max: 2 })
let app: FastifyInstance
let payer: TestAccount
let finance: TestAccount
const as = (account: TestAccount) => ({ authorization: `Bearer ${account.accessToken}` })

beforeAll(async () => {
  app = await buildServer({ db, verifyToken: createTokenVerifier({ supabaseUrl: local.API_URL }) })
  payer = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  finance = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  await owner.query(`UPDATE config.platform_versions SET status = 'published', published_at = now()
                      WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published')`)
  for (const account of [payer, finance]) await acceptCurrentTerms(owner, account.id)
  await owner.query("INSERT INTO identity.staff_members (account_id, level) VALUES ($1, 'finance')", [finance.id])
})

afterAll(async () => {
  await app.close()
  await db.close()
  await owner.end()
})

/** Test setup: an intent as billing.create_intent leaves it, with fictitious bank data. */
async function intent(status: 'awaiting_proof' | 'confirmed', total: number): Promise<string> {
  const row = await owner.query<{ id: string }>(`
    INSERT INTO billing.payment_intents (context, subject_id, payer_account, description, amount_base_aoa, tax_aoa, amount_total_aoa,
      config_version_id, reference, bank_snapshot, status, due_at, confirmed_at)
    VALUES ('verification', gen_random_uuid(), $1, 'Taxa de verificação', $2, 0, $2, config.current_version_id(), util.next_code('PAG'),
      '{"bank_name": "Banco de Teste", "iban": "AO06000000000000000000001", "beneficiary": "Academia (teste)"}', $3,
      now() + interval '3 days', CASE WHEN $3 = 'confirmed' THEN now() END)
    RETURNING id`, [payer.id, total, status])
  return row.rows[0]!.id
}

describe('payments through the API (payments.md)', () => {
  it('two refunds at once that pass the total: exactly one fails with REFUND_EXCEEDS_TOTAL (criterion 3)', async () => {
    const id = await intent('confirmed', 10000)
    const refund = () => app.inject({ method: 'POST', url: '/admin/refunds', headers: as(finance),
      payload: { intent_id: id, amount_aoa: 6000, reason_code: 'manual', note: 'Acerto combinado.' } })
    const answers = await Promise.all([refund(), refund()])
    expect(answers.map((answer) => answer.statusCode).sort()).toEqual([201, 409])
    expect(answers.find((answer) => answer.statusCode === 409)!.json().error.code).toBe('REFUND_EXCEEDS_TOTAL')
    const total = await owner.query('SELECT sum(amount_aoa)::int AS sum FROM billing.refunds WHERE intent_id = $1', [id])
    expect(total.rows[0]).toEqual({ sum: 6000 })
  })

  it('send a proof, finance accepts, the payer downloads the receipt PDF; a stranger cannot (criterion 7, R-PAY-12)', async () => {
    const id = await intent('awaiting_proof', 15000)
    const path = `payment_proof/${id}/${crypto.randomUUID()}-comprovativo.pdf`
    await owner.query("INSERT INTO storage.objects (bucket_id, name) VALUES ('payment-proofs', $1)", [path])
    const sent = await app.inject({ method: 'POST', url: `/payment-intents/${id}/proofs`, headers: as(payer), payload: { file_path: path } })
    expect(sent.statusCode).toBe(201)
    const again = await app.inject({ method: 'POST', url: `/payment-intents/${id}/proofs`, headers: as(payer), payload: { file_path: path } })
    expect(again.json().error.code).toBe('PROOF_ALREADY_PENDING')
    const notFinance = await app.inject({ method: 'POST', url: `/admin/proofs/${sent.json().id}/accept`, headers: as(payer) })
    expect(notFinance.json().error.code).toBe('FORBIDDEN')
    const accepted = await app.inject({ method: 'POST', url: `/admin/proofs/${sent.json().id}/accept`, headers: as(finance) })
    expect(accepted.json()).toMatchObject({ status: 'confirmed' })
    const twice = await app.inject({ method: 'POST', url: `/admin/proofs/${sent.json().id}/accept`, headers: as(finance) })
    expect(twice.json().error.code).toBe('STATE_CHANGED')
    const receipt = (await owner.query<{ id: string; number: string }>("SELECT id, number FROM billing.receipts WHERE intent_id = $1", [id])).rows[0]!
    const pdf = await app.inject({ method: 'GET', url: `/receipts/${receipt.id}/pdf`, headers: as(payer) })
    expect(pdf.headers['content-type']).toBe('application/pdf')
    expect(pdf.rawPayload.subarray(0, 8).toString('latin1')).toBe('%PDF-1.4')
    expect(pdf.rawPayload.toString('latin1')).toContain(receipt.number)
    const stranger = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
    await acceptCurrentTerms(owner, stranger.id)
    const denied = await app.inject({ method: 'GET', url: `/receipts/${receipt.id}/pdf`, headers: as(stranger) })
    expect(denied.json().error.code).toBe('NOT_FOUND')
  })

  it('payout details: an interpreter only; an IBAN that is not Angolan is refused on its field (R-PAY-11)', async () => {
    const notInterpreter = await app.inject({ method: 'PUT', url: '/me/payout-details', headers: as(payer),
      payload: { account_holder: 'Paula', bank_name: 'Banco', iban: 'AO06000000000000000000001' } })
    expect(notInterpreter.json().error.code).toBe('FORBIDDEN')
    await owner.query('SELECT identity.become_interpreter($1, NULL, NULL)', [payer.id])
    const wrong = await app.inject({ method: 'PUT', url: '/me/payout-details', headers: as(payer),
      payload: { account_holder: 'Paula', bank_name: 'Banco', iban: 'PT50000000000000000000000' } })
    expect(wrong.json().error.code).toBe('INVALID_IBAN')
    const saved = await app.inject({ method: 'PUT', url: '/me/payout-details', headers: as(payer),
      payload: { account_holder: 'Paula', bank_name: 'Banco', iban: 'AO06 0000 0000 0000 0000 0000 1' } })
    expect(saved.json()).toMatchObject({ iban: 'AO06000000000000000000001' })
  })
})
