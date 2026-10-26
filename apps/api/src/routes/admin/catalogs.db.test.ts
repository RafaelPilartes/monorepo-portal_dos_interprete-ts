import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createConfirmedAccount, type TestAccount } from '../../integrations/testing/localAuth.js'
import { createDatabase } from '../../lib/db.js'
import { createTokenVerifier } from '../../lib/tokens.js'
import { buildServer } from '../../server.js'
import { local } from '../../testing/localSupabase.js'
import { acceptCurrentTerms } from '../../testing/terms.js'

// Step H3 routes against the local database (catalogs.md criteria 1–2).

const db = createDatabase(local.DB_URL)
const owner = new pg.Pool({ connectionString: local.DB_URL, max: 2 })
let app: FastifyInstance
let moderator: TestAccount
let finance: TestAccount
const as = (account: TestAccount) => ({ authorization: `Bearer ${account.accessToken}` })

beforeAll(async () => {
  app = await buildServer({ db, verifyToken: createTokenVerifier({ supabaseUrl: local.API_URL }) })
  moderator = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  finance = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
  await owner.query("INSERT INTO identity.staff_members (account_id, level) VALUES ($1, 'moderator'), ($2, 'finance')", [moderator.id, finance.id])
  for (const account of [moderator, finance]) await acceptCurrentTerms(owner, account.id)
})

afterAll(async () => {
  await app.close()
  await db.close()
  await owner.end()
})

const service = (slug: string, pricing_mode: 'hourly' | 'fixed' = 'hourly') => ({
  slug, title: 'Serviço de teste', description: '', pricing_mode, platform_price_aoa: 9000, icon: null, active: true, sort: 1,
})

describe('catalogs (R-CAT-01, R-CAT-02)', () => {
  it('refuses finance with FORBIDDEN', async () => {
    const response = await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(finance), payload: service(`s-${randomUUID().slice(0, 8)}`) })
    expect(response.json().error.code).toBe('FORBIDDEN')
  })

  it('answers a duplicate slug on the slug field, in Portuguese', async () => {
    const slug = `s-${randomUUID().slice(0, 8)}`
    expect((await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(moderator), payload: service(slug) })).statusCode).toBe(201)
    const again = await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(moderator), payload: service(slug) })
    expect(again.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { slug: 'Já existe um serviço com este identificador.' } })
    const badSlug = await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(moderator), payload: service('Com Espaços') })
    expect(badSlug.json().error.details).toHaveProperty('slug')
  })

  it('deletes an unused item; a used one answers IN_USE and keeps its pricing mode (criteria 1–2)', async () => {
    const created = await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(moderator), payload: service(`s-${randomUUID().slice(0, 8)}`) })
    const id = created.json().id as string
    const unused = await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(moderator), payload: service(`s-${randomUUID().slice(0, 8)}`) })
    expect((await app.inject({ method: 'DELETE', url: `/admin/catalog/services/${unused.json().id}`, headers: as(moderator) })).statusCode).toBe(204)

    // Test setup: an interpreter offers the service (H4 opens this to the interpreter).
    const interpreter = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
    await owner.query('SELECT identity.become_interpreter($1, NULL, NULL)', [interpreter.id])
    await owner.query('INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa) VALUES ($1, $2, 8000)', [interpreter.id, id])

    const deleted = await app.inject({ method: 'DELETE', url: `/admin/catalog/services/${id}`, headers: as(moderator) })
    expect(deleted.statusCode).toBe(409)
    expect(deleted.json().error).toMatchObject({ code: 'IN_USE', message: 'Este item já foi usado. Desactiva-o em vez de o apagar.' })
    const mode = await app.inject({ method: 'PATCH', url: `/admin/catalog/services/${id}`, headers: as(moderator), payload: { ...service(created.json().slug, 'fixed') } })
    expect(mode.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { pricing_mode: 'O modo de preço não muda depois de usado. Cria um serviço novo e desactiva este.' } })
    const deactivated = await app.inject({ method: 'PATCH', url: `/admin/catalog/services/${id}`, headers: as(moderator), payload: { ...service(created.json().slug), active: false, platform_price_aoa: 12000 } })
    expect(deactivated.json()).toMatchObject({ active: false, platform_price_aoa: 12000 })
  })
})
