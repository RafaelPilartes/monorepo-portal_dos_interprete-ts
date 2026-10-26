import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Database } from '../lib/db.js'
import { actor, callSql } from '../lib/routes.js'
import { ApiError } from '../lib/sendApiError.js'
import { RATE_LIMITS } from '../plugins/rateLimit.js'
import { requireStaff } from '../plugins/staff.js'

// Organisations, members and invites (api.md §5, R-ORG-01..05), and the team's suspension and
// reactivation of accounts and organisations (api.md §12, R-ACC-05, R-ACC-06). Every rule — who may,
// LAST_OWNER, the exact invited email — is in the identity functions.

const uuid = z.string().uuid()
const optionalText = (max: number) => z.string().trim().max(max).optional()

const bodies = {
  organization: z.object({
    name: z.string().trim().min(2).max(160),
    nif: z.string().trim().min(1).max(14),
    sector: optionalText(120),
    address: optionalText(300),
    city: optionalText(120),
    phone: optionalText(20),
    website_url: optionalText(300),
  }),
  invite: z.object({ email: z.string().trim().toLowerCase().email().max(254), role: z.enum(['admin', 'member']) }),
  accept: z.object({ token: z.string().min(20).max(200) }),
  memberRole: z.object({ role: z.enum(['admin', 'member']) }),
  transfer: z.object({ new_owner_account_id: uuid }),
  reason: z.object({ reason: z.string().trim().min(3).max(1000) }),
}
const orgParam = z.object({ id: uuid })
const inviteParam = z.object({ id: uuid, inviteId: uuid })
const memberParam = z.object({ id: uuid, accountId: uuid })
const previewQuery = z.object({ token: z.string().min(20).max(200) })

export function registerOrganizationRoutes(server: FastifyInstance, deps: { db: Database }): void {
  // R-ORG-01
  server.post('/organizations', { config: { rateLimit: RATE_LIMITS.create } }, async (request, reply) => {
    const body = bodies.organization.parse(request.body)
    const row = await callSql(deps.db, request, 'SELECT * FROM identity.create_organization($1, $2, $3, $4, $5, $6, $7, $8)', [
      actor(request), body.name, body.nif.toUpperCase(), body.sector ?? null, body.address ?? null, body.city ?? null,
      body.phone ?? null, body.website_url ?? null,
    ])
    return reply.status(201).send(row)
  })

  // R-ORG-02: the token goes only in the email; the answer is the invite without it.
  server.post('/organizations/:id/invites', { config: { rateLimit: RATE_LIMITS.create } }, async (request, reply) => {
    const { id } = orgParam.parse(request.params)
    const body = bodies.invite.parse(request.body)
    const row = await callSql<{ result: { invite: unknown } }>(deps.db, request,
      'SELECT identity.create_invite($1, $2, $3, $4) AS result', [actor(request), id, body.email, body.role])
    return reply.status(201).send(row.result.invite)
  })

  server.post('/organizations/:id/invites/:inviteId/revoke', async (request) => {
    const { id, inviteId } = inviteParam.parse(request.params)
    const row = await callSql<Record<string, unknown>>(deps.db, request, 'SELECT * FROM identity.revoke_invite($1, $2, $3)', [actor(request), id, inviteId])
    const { token_hash: _hidden, ...invite } = row
    return invite
  })

  // What /invite/:token shows before accepting (AD-030): organisation, role, masked email, state.
  server.get('/invites/preview', { config: { access: 'public' } }, async (request) => {
    const { token } = previewQuery.parse(request.query)
    const row = await callSql<{ preview: unknown }>(deps.db, request, 'SELECT identity.invite_preview($1) AS preview', [token])
    if (!row.preview) throw new ApiError('INVITE_INVALID')
    return row.preview
  })

  server.post('/invites/accept', async (request) => {
    const body = bodies.accept.parse(request.body)
    return callSql(deps.db, request, 'SELECT * FROM identity.accept_invite($1, $2)', [actor(request), body.token])
  })

  // R-ORG-03, R-ORG-04
  server.patch('/organizations/:id/members/:accountId', async (request) => {
    const { id, accountId } = memberParam.parse(request.params)
    const body = bodies.memberRole.parse(request.body)
    return callSql(deps.db, request, 'SELECT * FROM identity.set_member_role($1, $2, $3, $4)', [actor(request), id, accountId, body.role])
  })

  server.post('/organizations/:id/members/:accountId/remove', async (request) => {
    const { id, accountId } = memberParam.parse(request.params)
    return callSql(deps.db, request, 'SELECT * FROM identity.remove_member($1, $2, $3)', [actor(request), id, accountId])
  })

  server.post('/organizations/:id/transfer-ownership', async (request) => {
    const { id } = orgParam.parse(request.params)
    const body = bodies.transfer.parse(request.body)
    return callSql(deps.db, request, 'SELECT * FROM identity.transfer_ownership($1, $2, $3)', [actor(request), id, body.new_owner_account_id])
  })

  // The team (api.md §12): moderator; super_admin passes every check.
  const moderators = { preHandler: requireStaff('moderator') }
  server.post('/admin/accounts/:id/suspend', moderators, async (request) => {
    const { id } = orgParam.parse(request.params)
    const body = bodies.reason.parse(request.body)
    return callSql(deps.db, request, 'SELECT id, status, suspended_at, suspended_reason FROM identity.suspend_account($1, $2, $3)', [actor(request), id, body.reason])
  })
  server.post('/admin/accounts/:id/reactivate', moderators, async (request) => {
    const { id } = orgParam.parse(request.params)
    return callSql(deps.db, request, 'SELECT id, status FROM identity.reactivate_account($1, $2)', [actor(request), id])
  })
  server.post('/admin/organizations/:id/suspend', moderators, async (request) => {
    const { id } = orgParam.parse(request.params)
    const body = bodies.reason.parse(request.body)
    return callSql(deps.db, request, 'SELECT * FROM identity.suspend_organization($1, $2, $3)', [actor(request), id, body.reason])
  })
  server.post('/admin/organizations/:id/reactivate', moderators, async (request) => {
    const { id } = orgParam.parse(request.params)
    return callSql(deps.db, request, 'SELECT * FROM identity.reactivate_organization($1, $2)', [actor(request), id])
  })
}
