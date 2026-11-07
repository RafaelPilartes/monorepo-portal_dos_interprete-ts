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
    const repriced = await app.inject({ method: 'PATCH', url: `/admin/catalog/services/${id}`, headers: as(moderator), payload: { platform_price_aoa: 12000 } })
    expect(repriced.json()).toMatchObject({ platform_price_aoa: 12000, active: true })
    // "Desactivar" sends only the state: the price someone just changed stays (AD-032).
    const deactivated = await app.inject({ method: 'PATCH', url: `/admin/catalog/services/${id}`, headers: as(moderator), payload: { active: false } })
    expect(deactivated.json()).toMatchObject({ active: false, platform_price_aoa: 12000, pricing_mode: 'hourly' })
  })

  it('answers a price of 0 on its field, and keeps the slug of an existing service', async () => {
    const free = await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(moderator), payload: { ...service(`s-${randomUUID().slice(0, 8)}`), platform_price_aoa: 0 } })
    expect(free.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { platform_price_aoa: 'O preço de tabela tem de ser maior que zero.' } })
    const slug = `s-${randomUUID().slice(0, 8)}`
    const created = await app.inject({ method: 'POST', url: '/admin/catalog/services', headers: as(moderator), payload: service(slug) })
    const renamed = await app.inject({ method: 'PATCH', url: `/admin/catalog/services/${created.json().id}`, headers: as(moderator), payload: { slug: 'outro', title: 'Novo título' } })
    expect(renamed.json()).toMatchObject({ slug, title: 'Novo título' })
  })
})

describe('languages and specialties (R-CAT-01)', () => {
  const code = () => `t${randomUUID().replace(/[^a-f]/g, '').slice(0, 6).padEnd(3, 'a')}`

  it('creates and edits a language; a bad code answers on the code field, from the table rule', async () => {
    const created = await app.inject({ method: 'POST', url: '/admin/catalog/languages', headers: as(moderator), payload: { code: code(), name: 'Língua de teste', is_sign_language: true, active: true, sort: 1 } })
    expect(created.statusCode).toBe(201)
    const edited = await app.inject({ method: 'PATCH', url: `/admin/catalog/languages/${created.json().id}`, headers: as(moderator), payload: { name: 'Outro nome' } })
    expect(edited.json()).toMatchObject({ name: 'Outro nome', is_sign_language: true })
    const bad = await app.inject({ method: 'POST', url: '/admin/catalog/languages', headers: as(moderator), payload: { code: 'p1', name: 'Língua', is_sign_language: false, active: true, sort: 1 } })
    expect(bad.json().error).toMatchObject({ code: 'VALIDATION_FAILED', details: { code: 'Usa de 2 a 8 letras minúsculas (ex.: pt, lga).' } })
    const twice = await app.inject({ method: 'POST', url: '/admin/catalog/languages', headers: as(moderator), payload: { code: created.json().code, name: 'Outra', is_sign_language: false, active: true, sort: 1 } })
    expect(twice.json().error.details).toEqual({ code: 'Já existe uma língua com este código.' })
  })

  it('deletes an unused specialty and answers IN_USE for a used one', async () => {
    const payload = () => ({ slug: `e-${randomUUID().slice(0, 8)}`, name: 'Especialidade de teste', active: true, sort: 1 })
    const unused = await app.inject({ method: 'POST', url: '/admin/catalog/specialties', headers: as(moderator), payload: payload() })
    expect((await app.inject({ method: 'DELETE', url: `/admin/catalog/specialties/${unused.json().id}`, headers: as(moderator) })).statusCode).toBe(204)
    const used = await app.inject({ method: 'POST', url: '/admin/catalog/specialties', headers: as(moderator), payload: payload() })
    const interpreter = await createConfirmedAccount(local.API_URL, local.SERVICE_ROLE_KEY, local.ANON_KEY)
    await owner.query('SELECT identity.become_interpreter($1, NULL, NULL)', [interpreter.id])
    await owner.query('INSERT INTO directory.interpreter_specialties (interpreter_id, specialty_id) VALUES ($1, $2)', [interpreter.id, used.json().id])
    const refused = await app.inject({ method: 'DELETE', url: `/admin/catalog/specialties/${used.json().id}`, headers: as(moderator) })
    expect(refused.json().error.code).toBe('IN_USE')
  })
})
