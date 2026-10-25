import { randomUUID } from 'node:crypto'
import Fastify from 'fastify'
import pg from 'pg'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createSmtpAdapter } from '../integrations/email/adapter.js'
import { mailpitMessages } from '../integrations/testing/localAuth.js'
import { createDatabase } from '../lib/db.js'
import { local } from '../testing/localSupabase.js'
import { runEmailBatch } from './emailOutbox.js'

// The email worker against the local database and Mailpit (api.md §15, R-NOT-03). The owner
// connection moves the test clock (util.test_clock) and cleans the outbox; the worker runs as
// service_role, like in production.

const db = createDatabase(local.DB_URL)
const owner = new pg.Pool({ connectionString: local.DB_URL, max: 2 })
const log = Fastify({ logger: false }).log
const smtpPort = Number(new URL(local.MAILPIT_URL).port) + 1
const adapter = createSmtpAdapter({ host: '127.0.0.1', port: smtpPort, secure: false, from: 'Portal <no-reply@example.ao>' })
const failing = { send: async () => { throw new Error('smtp refused') } }

async function enqueue(email: string): Promise<string> {
  return db.transaction(async (client) => {
    const result = await client.query<{ id: string }>("SELECT notify.enqueue_email('org_invite', $1, '{}') AS id", [email])
    return result.rows[0]?.id as string
  })
}

async function row(id: string) {
  const result = await owner.query('SELECT status, attempts, next_attempt_at, sent_at, util.now() AS now FROM notify.email_outbox WHERE id = $1', [id])
  return result.rows[0]
}

async function setClock(at: string | null) {
  await owner.query('DELETE FROM util.test_clock')
  if (at) await owner.query('INSERT INTO util.test_clock (frozen_at) VALUES ($1)', [at])
}

beforeEach(async () => {
  await setClock(null)
  await owner.query("DELETE FROM notify.email_outbox WHERE to_email LIKE 'worker-%'")
})

afterAll(async () => {
  await setClock(null)
  await owner.query("DELETE FROM notify.email_outbox WHERE to_email LIKE 'worker-%'")
  await db.close()
  await owner.end()
})

describe('email worker', () => {
  it('delivers a queued email to the local mail server and marks it sent', async () => {
    const to = `worker-${randomUUID()}@example.ao`
    const id = await enqueue(to)
    expect(await runEmailBatch({ db, adapter, log })).toMatchObject({ sent: 1 })
    expect(await row(id)).toMatchObject({ status: 'sent', attempts: 1 })
    const messages = await mailpitMessages(local.MAILPIT_URL, to)
    expect(messages.map((m) => m.Subject)).toEqual(['Tens um novo aviso no Portal dos Intérpretes'])
  })

  it('retries after 1, 5 and 30 minutes and marks failed at the fourth failure', async () => {
    const id = await enqueue(`worker-${randomUUID()}@example.ao`)
    let clock = (await row(id)).next_attempt_at.getTime() + 1000
    await setClock(new Date(clock).toISOString())
    for (const [attempt, waitMinutes] of [[1, 1], [2, 5], [3, 30]] as const) {
      expect(await runEmailBatch({ db, adapter: failing, log })).toMatchObject({ failed: 1 })
      const state = await row(id)
      expect(state).toMatchObject({ status: 'queued', attempts: attempt })
      expect((state.next_attempt_at as Date).getTime() - clock).toBe(waitMinutes * 60_000)
      // Not due yet: nothing is claimed one second before the retry time.
      await setClock(new Date(clock + waitMinutes * 60_000 - 1000).toISOString())
      expect(await runEmailBatch({ db, adapter: failing, log })).toEqual({ sent: 0, failed: 0 })
      clock += waitMinutes * 60_000
      await setClock(new Date(clock).toISOString())
    }
    await runEmailBatch({ db, adapter: failing, log })
    expect(await row(id)).toMatchObject({ status: 'failed', attempts: 4 })
    expect(await runEmailBatch({ db, adapter: failing, log })).toEqual({ sent: 0, failed: 0 })
  })

  it('never lets two workers claim the same email', async () => {
    const ids = await Promise.all(Array.from({ length: 30 }, () => enqueue(`worker-${randomUUID()}@example.ao`)))
    const claim = () => db.transaction(async (client) => (await client.query<{ id: string }>('SELECT id FROM notify.claim_emails(20)')).rows.map((r) => r.id))
    const [first, second] = await Promise.all([claim(), claim()])
    const all = [...(first ?? []), ...(second ?? [])]
    expect(new Set(all).size).toBe(all.length)
    expect(all.length).toBe(30)
    expect(new Set(all)).toEqual(new Set(ids))
  })

  it('re-claims an email left in sending by a worker that died, after 15 minutes', async () => {
    const id = await enqueue(`worker-${randomUUID()}@example.ao`)
    const start = (await row(id)).next_attempt_at.getTime() + 1000
    const at = (minutes: number) => new Date(start + minutes * 60_000).toISOString()
    await setClock(at(0))
    await db.transaction((client) => client.query('SELECT notify.claim_emails(20)'))
    await setClock(at(14))
    expect(await runEmailBatch({ db, adapter, log })).toEqual({ sent: 0, failed: 0 })
    await setClock(at(16))
    expect(await runEmailBatch({ db, adapter, log })).toMatchObject({ sent: 1 })
    expect(await row(id)).toMatchObject({ status: 'sent', attempts: 2 })
  })
})
