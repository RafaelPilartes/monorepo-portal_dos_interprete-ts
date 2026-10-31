import { describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { runEmailBatch } from './emailOutbox.js'
import { renderEmail } from '../integrations/email/templates.js'
import { fakeDatabase } from '../testing/fakes.js'

const log = Fastify({ logger: false }).log
const APPS = { site: 'http://localhost:5170', requester: 'http://localhost:5171', interpreter: 'http://localhost:5172', admin: 'http://localhost:5173' }
const rows = [
  { id: 'e1', to_email: 'ana@example.ao', template: 'request_accepted', payload: { app: 'requester', link: '/requests/1' } },
  { id: 'e2', to_email: 'bruno@example.ao', template: 'org_invite', payload: {} },
]

describe('runEmailBatch', () => {
  it('sends each claimed email and records the outcome in SQL', async () => {
    const db = fakeDatabase((sql) => ({ rows: sql.includes('claim_emails') ? rows : [] }))
    const sent: string[] = []
    const result = await runEmailBatch({
      db, log, appUrls: APPS,
      adapter: { send: async (email) => { if (email.to.startsWith('bruno')) throw new Error('smtp down'); sent.push(email.to) } },
    })
    expect(result).toEqual({ sent: 1, failed: 1 })
    expect(sent).toEqual(['ana@example.ao'])
    expect(db.queries.map((q) => q.sql.match(/notify\.\w+/)?.[0])).toEqual(['notify.claim_emails', 'notify.mark_email_sent', 'notify.mark_email_failed'])
    expect(db.queries[0]?.params).toEqual([20])
    expect(db.queries[2]?.params).toEqual(['e2', 'Error: smtp down'])
  })

  it('keeps going when recording a failure fails (the row is re-claimed after 15 minutes)', async () => {
    const db = fakeDatabase((sql) => {
      if (sql.includes('claim_emails')) return { rows }
      if (sql.includes('mark_email_failed')) throw new Error('db down')
      return { rows: [] }
    })
    const result = await runEmailBatch({ db, log, adapter: { send: async () => { throw new Error('smtp down') } } })
    expect(result).toEqual({ sent: 0, failed: 2 })
  })
})

describe('runEmailBatch: delivered means delivered', () => {
  it('never records a delivered email as failed when recording the success fails', async () => {
    const db = fakeDatabase((sql) => {
      if (sql.includes('claim_emails')) return { rows: [rows[0]] }
      if (sql.includes('mark_email_sent')) throw new Error('connection reset')
      return { rows: [] }
    })
    const result = await runEmailBatch({ db, log, adapter: { send: async () => undefined } })
    expect(result).toEqual({ sent: 1, failed: 0 })
    expect(db.queries.some((q) => q.sql.includes('mark_email_failed'))).toBe(false)
  })

  it('stops sending once the safe part of the lease is over', async () => {
    const db = fakeDatabase((sql) => ({ rows: sql.includes('claim_emails') ? rows : [] }))
    let clock = 0
    const sent: string[] = []
    const result = await runEmailBatch({
      db, log, now: () => clock,
      adapter: { send: async (email) => { sent.push(email.to); clock += 11 * 60_000 } },
    })
    expect(sent).toEqual(['ana@example.ao'])
    expect(result).toEqual({ sent: 1, failed: 0 })
  })
})

describe('renderEmail', () => {
  it('uses the generic Portuguese template with the full link inside the portal', () => {
    const email = renderEmail('request_accepted', { app: 'interpreter', link: '/requests/1' }, APPS)
    expect(email.subject).toBe('Tens um novo aviso no Portal dos Intérpretes')
    expect(email.text).toContain('http://localhost:5172/requests/1')
    // Without the app, no link at all rather than a link into the wrong app.
    expect(renderEmail('request_accepted', { link: '/requests/1' }, APPS).text).not.toContain('Abre aqui')
  })

  it('never builds a link that leaves the portal', () => {
    expect(renderEmail('x', { app: 'site', link: '//evil.example' }, APPS).text).not.toContain('evil')
    expect(renderEmail('x', { app: 'site', link: 'https://evil.example' }, APPS).text).not.toContain('evil')
  })
})
