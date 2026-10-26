import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Database } from '../../lib/db.js'
import { actor, callSql } from '../../lib/routes.js'
import { requireStaff } from '../../plugins/staff.js'

// Catalogs (api.md §11, catalogs.md): moderator and super_admin. The SQL functions own R-CAT-01
// (a used item is not deleted: IN_USE) and R-CAT-02 (a used service keeps its pricing mode).

const uuid = z.string().uuid()
const sort = z.number().int().min(0).max(10_000)
const slug = z.string().trim().min(2).max(80)

const bodies = {
  language: z.object({
    code: z.string().trim().toLowerCase().regex(/^[a-z]{2,8}$/, 'Usa de 2 a 8 letras minúsculas (ex.: pt, lga).'),
    name: z.string().trim().min(2).max(80),
    is_sign_language: z.boolean(),
    active: z.boolean(),
    sort,
  }),
  specialty: z.object({ slug, name: z.string().trim().min(2).max(80), description: z.string().max(1000).default(''), active: z.boolean(), sort }),
  service: z.object({
    slug,
    title: z.string().trim().min(2).max(120),
    description: z.string().max(2000).default(''),
    pricing_mode: z.enum(['hourly', 'fixed']),
    platform_price_aoa: z.number().int().min(0).max(100_000_000),
    icon: z.string().max(40).nullable().default(null),
    active: z.boolean(),
    sort,
  }),
}
const idParam = z.object({ id: uuid })
const KINDS = { languages: 'language', specialties: 'specialty', services: 'service' } as const
const kindParam = z.object({ kind: z.enum(['languages', 'specialties', 'services']), id: uuid })

export function registerCatalogRoutes(server: FastifyInstance, deps: { db: Database }): void {
  const editors = { preHandler: requireStaff('moderator') }
  const saveLanguage = (id: string | null, body: z.infer<typeof bodies.language>, request: Parameters<typeof actor>[0]) =>
    callSql(deps.db, request, 'SELECT * FROM catalog.save_language($1, $2, $3, $4, $5, $6, $7)', [
      actor(request), id, body.code, body.name, body.is_sign_language, body.active, body.sort,
    ])
  const saveSpecialty = (id: string | null, body: z.infer<typeof bodies.specialty>, request: Parameters<typeof actor>[0]) =>
    callSql(deps.db, request, 'SELECT * FROM catalog.save_specialty($1, $2, $3, $4, $5, $6, $7)', [
      actor(request), id, body.slug, body.name, body.description, body.active, body.sort,
    ])
  const saveService = (id: string | null, body: z.infer<typeof bodies.service>, request: Parameters<typeof actor>[0]) =>
    callSql(deps.db, request, 'SELECT * FROM catalog.save_service($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [
      actor(request), id, body.slug, body.title, body.description, body.pricing_mode, body.platform_price_aoa, body.icon, body.active, body.sort,
    ])

  server.post('/admin/catalog/languages', editors, async (request, reply) =>
    reply.status(201).send(await saveLanguage(null, bodies.language.parse(request.body), request)))
  server.patch('/admin/catalog/languages/:id', editors, async (request) =>
    saveLanguage(idParam.parse(request.params).id, bodies.language.parse(request.body), request))
  server.post('/admin/catalog/specialties', editors, async (request, reply) =>
    reply.status(201).send(await saveSpecialty(null, bodies.specialty.parse(request.body), request)))
  server.patch('/admin/catalog/specialties/:id', editors, async (request) =>
    saveSpecialty(idParam.parse(request.params).id, bodies.specialty.parse(request.body), request))
  server.post('/admin/catalog/services', editors, async (request, reply) =>
    reply.status(201).send(await saveService(null, bodies.service.parse(request.body), request)))
  server.patch('/admin/catalog/services/:id', editors, async (request) =>
    saveService(idParam.parse(request.params).id, bodies.service.parse(request.body), request))

  // R-CAT-01: 204, or IN_USE for an item that was used.
  server.delete('/admin/catalog/:kind/:id', editors, async (request, reply) => {
    const { kind, id } = kindParam.parse(request.params)
    await callSql(deps.db, request, 'SELECT catalog.delete_item($1, $2, $3)', [actor(request), KINDS[kind], id])
    return reply.status(204).send()
  })
}
