import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { Database, RequestContext } from '../../lib/db.js'
import { ApiError } from '../../lib/sendApiError.js'
import { requireStaff, STAFF_LEVELS } from '../../plugins/staff.js'

// Team, configuration versions, legal documents and verification document types (api.md §11,
// staff-and-config.md). The API checks the level for an early, clear 403; the SQL functions check
// it again and own every rule. Reads are by RLS through packages/data (api.md §16).

const uuid = z.string().uuid()
const level = z.enum(STAFF_LEVELS)
/** Configuration values: numbers, booleans, text or null ("por definir"); the database checks ranges. */
const configValue = z.union([z.number().finite(), z.boolean(), z.string().max(200), z.null()])

const bodies = {
  addStaff: z.object({ email: z.string().trim().email().max(254), level }),
  changeStaff: z.object({ level: level.optional(), active: z.boolean().optional() }).refine((b) => b.level !== undefined || b.active !== undefined),
  createDraft: z.object({ from_version_id: uuid.optional() }),
  updateDraft: z.object({ values: z.record(configValue).default({}), notes: z.string().max(1000).optional() }),
  publish: z.object({ expected_current_version_id: uuid.nullable() }),
  legalCreate: z.object({ kind: z.enum(['terms', 'privacy']), body: z.string().max(200_000) }),
  legalUpdate: z.object({ body: z.string().max(200_000) }),
  documentType: z.object({
    code: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
    name: z.string().trim().min(2).max(120),
    description: z.string().max(1000).default(''),
    required: z.boolean(),
    active: z.boolean(),
    sort: z.number().int().min(0).max(10_000),
  }),
}

const idParam = z.object({ id: uuid })
const accountParam = z.object({ accountId: uuid })

function context(request: FastifyRequest): RequestContext {
  return { requestId: request.id, ip: request.ip }
}

function actor(request: FastifyRequest): string {
  if (!request.account) throw new ApiError('UNAUTHENTICATED')
  return request.account.id
}

/** Runs one SQL function as the caller, in a transaction that carries the request for the audit. */
async function call<T>(db: Database, request: FastifyRequest, sql: string, params: unknown[]): Promise<T> {
  return db.transaction(async (client) => {
    const result = await client.query(sql, params)
    return result.rows[0] as T
  }, context(request))
}

export function registerStaffConfigRoutes(server: FastifyInstance, deps: { db: Database }): void {
  const superOnly = { preHandler: requireStaff('super_admin') }
  const catalogEditors = { preHandler: requireStaff('moderator') }

  // Team (R-STF-01, R-STF-02)
  server.post('/admin/staff', superOnly, async (request, reply) => {
    const body = bodies.addStaff.parse(request.body)
    const row = await call(deps.db, request, 'SELECT * FROM identity.add_staff_member($1, $2, $3)', [actor(request), body.email, body.level])
    return reply.status(201).send(row)
  })

  server.patch('/admin/staff/:accountId', superOnly, async (request) => {
    const { accountId } = accountParam.parse(request.params)
    const body = bodies.changeStaff.parse(request.body)
    // A missing field keeps its value; SQL reads it under the same lock as the change.
    return call(deps.db, request, 'SELECT * FROM identity.set_staff_member($1, $2, $3, $4)', [
      actor(request), accountId, body.level ?? null, body.active ?? null,
    ])
  })

  // Configuration versions (R-CFG-01, R-CFG-02)
  server.post('/admin/config/versions', superOnly, async (request, reply) => {
    const body = bodies.createDraft.parse(request.body ?? {})
    const row = await call(deps.db, request, 'SELECT * FROM config.create_draft($1, $2)', [actor(request), body.from_version_id ?? null])
    return reply.status(201).send(row)
  })

  server.patch('/admin/config/versions/:id', superOnly, async (request) => {
    const { id } = idParam.parse(request.params)
    const body = bodies.updateDraft.parse(request.body)
    return call(deps.db, request, 'SELECT * FROM config.update_draft($1, $2, $3, $4)', [actor(request), id, JSON.stringify(body.values), body.notes ?? null])
  })

  server.post('/admin/config/versions/:id/publish', superOnly, async (request) => {
    const { id } = idParam.parse(request.params)
    const body = bodies.publish.parse(request.body)
    return call(deps.db, request, 'SELECT * FROM config.publish_version($1, $2, $3)', [actor(request), id, body.expected_current_version_id])
  })

  // Legal documents (D-55, PC-05)
  server.post('/admin/legal-documents', superOnly, async (request, reply) => {
    const body = bodies.legalCreate.parse(request.body)
    const row = await call(deps.db, request, 'SELECT * FROM identity.create_legal_draft($1, $2, $3)', [actor(request), body.kind, body.body])
    return reply.status(201).send(row)
  })

  server.patch('/admin/legal-documents/:id', superOnly, async (request) => {
    const { id } = idParam.parse(request.params)
    const body = bodies.legalUpdate.parse(request.body)
    return call(deps.db, request, 'SELECT * FROM identity.update_legal_draft($1, $2, $3)', [actor(request), id, body.body])
  })

  server.post('/admin/legal-documents/:id/publish', superOnly, async (request) => {
    const { id } = idParam.parse(request.params)
    return call(deps.db, request, 'SELECT * FROM identity.publish_legal_document($1, $2)', [actor(request), id])
  })

  // Verification document types (PC-07)
  server.post('/admin/document-types', catalogEditors, async (request, reply) => {
    const body = bodies.documentType.parse(request.body)
    const row = await call(deps.db, request, 'SELECT * FROM config.save_document_type($1, NULL, $2, $3, $4, $5, $6, $7)', [
      actor(request), body.code, body.name, body.description, body.required, body.active, body.sort,
    ])
    return reply.status(201).send(row)
  })

  server.patch('/admin/document-types/:id', catalogEditors, async (request) => {
    const { id } = idParam.parse(request.params)
    const body = bodies.documentType.parse(request.body)
    return call(deps.db, request, 'SELECT * FROM config.save_document_type($1, $2, $3, $4, $5, $6, $7, $8)', [
      actor(request), id, body.code, body.name, body.description, body.required, body.active, body.sort,
    ])
  })

  server.delete('/admin/document-types/:id', catalogEditors, async (request, reply) => {
    const { id } = idParam.parse(request.params)
    await call(deps.db, request, 'SELECT config.delete_document_type($1, $2)', [actor(request), id])
    return reply.status(204).send()
  })
}
