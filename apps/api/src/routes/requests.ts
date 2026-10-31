import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Database } from '../lib/db.js'
import { actor, callSql } from '../lib/routes.js'
import { RATE_LIMITS } from '../plugins/rateLimit.js'

// Requests and assignments (api.md §7, requests-core.md, requests-direct.md). Every rule — who
// may, the price, the deadlines, the overlap — is in the booking functions; here only the shapes.
// The totals are computed by booking.preview_request_total, never by a screen (R-REQ-02).

const uuid = z.string().uuid()
const optionalText = (max: number) => z.string().trim().max(max).optional()

const shape = {
  service_id: uuid,
  duration_minutes: z.number().int(),
  modality: z.enum(['online', 'in_person']),
  interpreter_ids: z.array(uuid).max(20).default([]),
}
const bodies = {
  preview: z.object(shape),
  create: z.object({
    ...shape,
    kind: z.enum(['direct', 'open', 'managed']),
    organization_id: uuid.optional(),
    language_ids: z.array(uuid).max(10),
    starts_at: z.string().datetime({ offset: true }),
    interpreters_needed: z.number().int(),
    meeting_link: optionalText(500),
    address: optionalText(300),
    city: optionalText(120),
    notes: optionalText(2000),
    beneficiary_name: optionalText(160),
    beneficiary_contact: optionalText(160),
    expected_total_aoa: z.number().int().nonnegative(),
  }),
  invite: z.object({ interpreter_id: uuid }),
  reduce: z.object({ interpreters_needed: z.number().int() }),
  meetingLink: z.object({ meeting_link: z.string().trim().max(500) }),
  decline: z.object({ reason: z.string().trim().max(1000) }),
}
const idParam = z.object({ id: uuid })

export function registerRequestRoutes(server: FastifyInstance, deps: { db: Database }): void {
  // R-REQ-02: the totals the review shows, per interpreter and in all.
  server.post('/requests/preview', async (request) =>
    (await callSql<{ preview: unknown }>(deps.db, request, 'SELECT booking.preview_request_total($1) AS preview', [bodies.preview.parse(request.body)])).preview)

  // R-REQ-01: 201 only once the request exists.
  server.post('/requests', { config: { rateLimit: RATE_LIMITS.create } }, async (request, reply) =>
    reply.status(201).send(await callSql(deps.db, request, 'SELECT * FROM booking.create_request($1, $2)', [actor(request), bodies.create.parse(request.body)])))

  // R-DRC-01, R-DRC-05
  server.post('/requests/:id/invites', async (request, reply) =>
    reply.status(201).send(await callSql(deps.db, request, 'SELECT * FROM booking.invite_interpreter($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.invite.parse(request.body).interpreter_id,
    ])))

  // R-REQ-09
  server.post('/requests/:id/reduce', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.reduce_interpreters_needed($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.reduce.parse(request.body).interpreters_needed,
    ]))

  // R-REQ-06, D-20
  server.patch('/requests/:id/meeting-link', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.update_meeting_link($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.meetingLink.parse(request.body).meeting_link,
    ]))

  // R-DRC-03
  server.post('/assignments/:id/accept', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.accept_assignment($1, $2)', [actor(request), idParam.parse(request.params).id]))

  // R-DRC-04
  server.post('/assignments/:id/decline', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.decline_assignment($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.decline.parse(request.body).reason,
    ]))
}
