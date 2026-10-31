import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Database } from '../../lib/db.js'
import { actor, callSql } from '../../lib/routes.js'
import { requireStaff } from '../../plugins/staff.js'

// Catalogs (api.md §11, catalogs.md): moderator and super_admin. The SQL functions own R-CAT-01
// (a used item is not deleted: IN_USE) and R-CAT-02 (a used service keeps its pricing mode), and
// the value rules are the table checks, translated in core/errors/database.ts: here only the
// shapes. A PATCH sends only what changes and never the slug, fixed once the item exists (AD-032).

const uuid = z.string().uuid()
const sort = z.number().int().min(0).max(10_000)
const slug = z.string().trim().min(2).max(80)

const bodies = {
  language: z.object({
    code: z.string().trim().toLowerCase(),
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
    platform_price_aoa: z.number().int().max(100_000_000),
    icon: z.string().max(40).nullable().default(null),
    active: z.boolean(),
    sort,
  }),
}
const patches = {
  language: bodies.language.partial(),
  specialty: bodies.specialty.omit({ slug: true }).extend({ description: z.string().max(1000).optional() }).partial(),
  service: bodies.service.omit({ slug: true }).extend({
    description: z.string().max(2000).optional(),
    icon: z.string().max(40).nullable().optional(),
  }).partial(),
}
type Body<K extends keyof typeof bodies> = { [F in keyof z.infer<(typeof bodies)[K]>]?: z.infer<(typeof bodies)[K]>[F] | undefined }
const idParam = z.object({ id: uuid })
const KINDS = { languages: 'language', specialties: 'specialty', services: 'service' } as const
const kindParam = z.object({ kind: z.enum(['languages', 'specialties', 'services']), id: uuid })

export function registerCatalogRoutes(server: FastifyInstance, deps: { db: Database }): void {
  const editors = { preHandler: requireStaff('moderator') }
  const saveLanguage = (id: string | null, body: Body<'language'>, request: Parameters<typeof actor>[0]) =>
    callSql(deps.db, request, 'SELECT * FROM catalog.save_language($1, $2, $3, $4, $5, $6, $7)', [
      actor(request), id, body.code ?? null, body.name ?? null, body.is_sign_language ?? null, body.active ?? null, body.sort ?? null,
    ])
  const saveSpecialty = (id: string | null, body: Body<'specialty'>, request: Parameters<typeof actor>[0]) =>
    callSql(deps.db, request, 'SELECT * FROM catalog.save_specialty($1, $2, $3, $4, $5, $6, $7)', [
      actor(request), id, body.slug ?? null, body.name ?? null, body.description ?? null, body.active ?? null, body.sort ?? null,
    ])
  const saveService = (id: string | null, body: Body<'service'>, request: Parameters<typeof actor>[0]) =>
    callSql(deps.db, request, 'SELECT * FROM catalog.save_service($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [
      actor(request), id, body.slug ?? null, body.title ?? null, body.description ?? null, body.pricing_mode ?? null,
      body.platform_price_aoa ?? null, body.icon === undefined ? null : body.icon ?? '', body.active ?? null, body.sort ?? null,
    ])

  server.post('/admin/catalog/languages', editors, async (request, reply) =>
    reply.status(201).send(await saveLanguage(null, bodies.language.parse(request.body), request)))
  server.patch('/admin/catalog/languages/:id', editors, async (request) =>
    saveLanguage(idParam.parse(request.params).id, patches.language.parse(request.body), request))
  server.post('/admin/catalog/specialties', editors, async (request, reply) =>
    reply.status(201).send(await saveSpecialty(null, bodies.specialty.parse(request.body), request)))
  server.patch('/admin/catalog/specialties/:id', editors, async (request) =>
    saveSpecialty(idParam.parse(request.params).id, patches.specialty.parse(request.body), request))
  server.post('/admin/catalog/services', editors, async (request, reply) =>
    reply.status(201).send(await saveService(null, bodies.service.parse(request.body), request)))
  server.patch('/admin/catalog/services/:id', editors, async (request) =>
    saveService(idParam.parse(request.params).id, patches.service.parse(request.body), request))

  // R-CAT-01: 204, or IN_USE for an item that was used.
  server.delete('/admin/catalog/:kind/:id', editors, async (request, reply) => {
    const { kind, id } = kindParam.parse(request.params)
    await callSql(deps.db, request, 'SELECT catalog.delete_item($1, $2, $3)', [actor(request), KINDS[kind], id])
    return reply.status(204).send()
  })
}
