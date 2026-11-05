import type { FastifyInstance } from 'fastify'
import { amountAoaSchema } from '@portal-dos-interpretes/core'
import { z } from 'zod'
import type { Database } from '../lib/db.js'
import { actor, callSql } from '../lib/routes.js'
import { RATE_LIMITS } from '../plugins/rateLimit.js'

// Requests, assignments and the price negotiation (api.md §7, §8; requests-core.md,
// requests-direct.md, requests-open.md, negotiation.md). Every rule — who
// may, the price, the deadlines, the overlap — is in the booking functions; here only the shapes.
// The totals are computed by booking.preview_request_total, never by a screen (R-REQ-02).

const uuid = z.string().uuid()
const optionalText = (max: number) => z.string().trim().max(max).optional()

const shape = {
  kind: z.enum(['direct', 'open', 'managed']).optional(),
  open_mode: z.enum(['first_accept', 'requester_chooses']).optional(),
  budget_per_interpreter_aoa: z.number().int().optional(),
  interpreters_needed: z.number().int().optional(),
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
  proposal: z.object({ amount_aoa: amountAoaSchema }),
  application: z.object({ message: z.string().trim().max(1000).optional() }),
  select: z.object({ assignment_id: uuid }),
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

  // R-OPN-02: "first to accept".
  server.post('/requests/:id/accept', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.accept_open_request($1, $2)', [actor(request), idParam.parse(request.params).id]))

  // R-OPN-03: "I choose", the application.
  server.post('/requests/:id/applications', async (request, reply) =>
    reply.status(201).send(await callSql(deps.db, request, 'SELECT * FROM booking.apply_to_request($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.application.parse(request.body ?? {}).message ?? null,
    ])))

  // R-OPN-04: the requester chooses.
  server.post('/requests/:id/select', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.select_candidate($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.select.parse(request.body).assignment_id,
    ]))

  // R-OPN-03
  server.post('/assignments/:id/withdraw', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.withdraw_application($1, $2)', [actor(request), idParam.parse(request.params).id]))

  // R-DRC-03
  server.post('/assignments/:id/accept', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.accept_assignment($1, $2)', [actor(request), idParam.parse(request.params).id]))

  // R-NEG-01 to R-NEG-05 (api.md §8): the value is checked by the database (INVALID_AMOUNT).
  server.post('/threads/:id/proposals', async (request, reply) =>
    reply.status(201).send(await callSql(deps.db, request, 'SELECT * FROM booking.make_proposal($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.proposal.parse(request.body).amount_aoa,
    ])))
  server.post('/proposals/:id/accept', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.respond_proposal($1, $2, true)', [actor(request), idParam.parse(request.params).id]))
  server.post('/proposals/:id/reject', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.respond_proposal($1, $2, false)', [actor(request), idParam.parse(request.params).id]))

  // R-DRC-04
  server.post('/assignments/:id/decline', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM booking.decline_assignment($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.decline.parse(request.body).reason,
    ]))
}
