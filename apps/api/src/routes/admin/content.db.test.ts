import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createConfirmedAccount, type TestAccount } from '../../integrations/testing/localAuth.js'
import { createDatabase } from '../../lib/db.js'
import { createTokenVerifier } from '../../lib/tokens.js'
import { buildServer } from '../../server.js'
import { local } from '../../testing/localSupabase.js'
import { acceptCurrentTerms } from '../../testing/terms.js'

// Step H4 content removal against the local database (interpreter-profile-and-directory.md criterion 5).

const db = createDatabase(local.DB_URL)
const owner = new pg.Pool({ connectionString: local.DB_URL, max: 2 })
let app: FastifyInstance
let moderator: TestAccount
let author: TestAccount
const as = (account: TestAccount) => ({ authorization: `Bearer ${account.accessToken}` })

beforeAll(async () => {
  app = await buildServer({ db, verifyToken: createTokenVerifier({ supabaseUrl: local.API_URL }) })
  moderator = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  author = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  await owner.query("INSERT INTO identity.staff_members (account_id, level) VALUES ($1, 'moderator')", [moderator.id])
  for (const account of [moderator, author]) await acceptCurrentTerms(owner, account.id)
  await owner.query('SELECT identity.become_interpreter($1, NULL, NULL)', [author.id])
})

afterAll(async () => {
  await app.close()
  await db.close()
  await owner.end()
})

async function article(): Promise<string> {
  const result = await owner.query<{ id: string }>(
    "INSERT INTO directory.articles (interpreter_id, slug, title, body) VALUES ($1, 'a-' || substr(md5(random()::text), 1, 8), 'Artigo', 'Texto.') RETURNING id",
    [author.id],
  )
  return result.rows[0]!.id
}

describe('content removal by the team (R-DIR-07)', () => {
  it('removes an article with a reason, tells the author and audits it (criterion 5)', async () => {
    const id = await article()
    const response = await app.inject({ method: 'POST', url: `/admin/content/articles/${id}/remove`, headers: as(moderator), payload: { reason: 'Conteúdo copiado' } })
    expect(response.statusCode).toBe(204)
    const row = await owner.query('SELECT status, removed_reason FROM directory.articles WHERE id = $1', [id])
    expect(row.rows[0]).toEqual({ status: 'removed', removed_reason: 'Conteúdo copiado' })
    const told = await owner.query("SELECT 1 FROM notify.notifications WHERE kind = 'content_removed' AND account_id = $1", [author.id])
    expect(told.rowCount).toBe(1)
    const audited = await owner.query("SELECT 1 FROM audit.events WHERE action = 'content.removed' AND entity_id = $1", [id])
    expect(audited.rowCount).toBe(1)
    const again = await app.inject({ method: 'POST', url: `/admin/content/articles/${id}/remove`, headers: as(moderator), payload: { reason: 'Outra vez' } })
    expect(again.json().error.code).toBe('STATE_CHANGED')
  })

  it('asks for a reason, and refuses anyone outside the team', async () => {
    const id = await article()
    const noReason = await app.inject({ method: 'POST', url: `/admin/content/articles/${id}/remove`, headers: as(moderator), payload: { reason: ' ' } })
    expect(noReason.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { reason: 'Preenche este campo.' } })
    const outsider = await app.inject({ method: 'POST', url: `/admin/content/articles/${id}/remove`, headers: as(author), payload: { reason: 'Quero' } })
    expect(outsider.json().error.code).toBe('FORBIDDEN')
    const missing = await app.inject({ method: 'POST', url: '/admin/content/videos/00000000-0000-4000-8000-000000000000/remove', headers: as(moderator), payload: { reason: 'Copiado' } })
    expect(missing.json().error.code).toBe('NOT_FOUND')
  })
})
