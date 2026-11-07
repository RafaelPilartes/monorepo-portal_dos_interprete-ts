import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { AppUrls } from '../integrations/email/templates.js'
import type { AuthServer } from '../integrations/auth.js'
import type { Database } from '../lib/db.js'
import { actor, callSql } from '../lib/routes.js'
import { ApiError } from '../lib/sendApiError.js'
import { RATE_LIMITS } from '../plugins/rateLimit.js'

// Registration, consent, active role and onboarding (api.md §4; accounts-and-organizations.md,
// personal-data.md R-PRIV-01/02). The rules live in the identity functions; these routes check the
// shape, call them with the account from the JWT and translate errors.

/** An internal path to come back to after confirming the email (never another site). */
const internalPath = z.string().max(500).regex(/^\/([^/\\]|$)/)
const uuid = z.string().uuid()
const optionalText = (max: number) => z.string().trim().max(max).optional()

const bodies = {
  register: z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(72),
    full_name: z.string().trim().min(2).max(120),
    intended_role: z.enum(['requester', 'interpreter', 'organization']),
    accept_terms: z.boolean(),
    legal_document_ids: z.array(uuid).max(10).default([]),
    return_to: internalPath.optional(),
  }),
  acceptTerms: z.object({ legal_document_ids: z.array(uuid).min(1).max(10) }),
  activeRole: z.object({ role: z.enum(['requester', 'interpreter']) }),
  requester: z.object({ nif: optionalText(14), address: optionalText(300), city: optionalText(120) }),
  interpreter: z.object({ bio: optionalText(4000), city: optionalText(120) }),
}

export function registerAccountRoutes(
  server: FastifyInstance,
  deps: { db: Database; authServer: AuthServer; appUrls: AppUrls },
): void {
  const appOf = (role: 'requester' | 'interpreter' | 'organization') =>
    role === 'interpreter' ? deps.appUrls.interpreter : deps.appUrls.requester

  // R-ACC-01, R-PRIV-01: the account in the Auth server (which sends the confirmation email), then
  // the consent to the versions shown. No role is created here.
  server.post('/auth/register', { config: { access: 'public', rateLimit: RATE_LIMITS.publicForm } }, async (request, reply) => {
    const body = bodies.register.parse(request.body)
    if (!body.accept_terms) throw new ApiError('TERMS_NOT_ACCEPTED')
    await callSql(deps.db, request, 'SELECT identity.assert_acceptable_documents($1::uuid[])', [body.legal_document_ids])
    const inUse = await callSql<{ in_use: boolean }>(deps.db, request, 'SELECT identity.email_in_use($1) AS in_use', [body.email])
    if (inUse.in_use) throw new ApiError('EMAIL_IN_USE')

    // An invite is accepted in requester-web (R-ORG-02), whatever the role chosen at sign-up.
    const confirmIn = body.return_to?.startsWith('/invite/') ? deps.appUrls.requester : appOf(body.intended_role)
    const redirect = new URL('/verify-email', confirmIn)
    if (body.return_to) redirect.searchParams.set('returnTo', body.return_to)
    const result = await deps.authServer.signUp({
      email: body.email,
      password: body.password,
      fullName: body.full_name,
      intendedRole: body.intended_role,
      redirectTo: redirect.toString(),
    })
    if (!result.ok) {
      if (result.reason === 'weak_password') throw new ApiError('WEAK_PASSWORD')
      if (result.reason === 'email_in_use') throw new ApiError('EMAIL_IN_USE')
      throw new ApiError('VALIDATION_FAILED', undefined, { email: 'Indica um email válido.' })
    }
    if (body.legal_document_ids.length > 0) {
      // The account exists already (and the email went): a failure here is logged, not answered
      // as a failed registration. The terms screen asks for the consent at the first sign-in
      // (R-PRIV-02), so nothing is used without it.
      try {
        await callSql(deps.db, request, 'SELECT identity.record_consents($1, $2::uuid[], $3, $4)', [
          result.accountId, body.legal_document_ids, request.ip, request.headers['user-agent'] ?? null,
        ])
      } catch (error) {
        request.log.error({ err: error, accountId: result.accountId }, 'consent not recorded at sign-up')
      }
    }
    return reply.status(201).send({ account_id: result.accountId, email_confirmation_sent: true })
  })

  // R-PRIV-02: reachable with documents to accept ('session').
  server.post('/me/accept-terms', { config: { access: 'session' } }, async (request) => {
    const body = bodies.acceptTerms.parse(request.body)
    const row = await callSql<{ pending: number }>(deps.db, request,
      'SELECT identity.record_consents($1, $2::uuid[], $3, $4) AS pending',
      [actor(request), body.legal_document_ids, request.ip, request.headers['user-agent'] ?? null])
    return { ok: true, pending: row.pending }
  })

  // R-ACC-04
  server.post('/me/active-role', async (request) => {
    const body = bodies.activeRole.parse(request.body)
    await callSql(deps.db, request, 'SELECT identity.set_active_role($1, $2)', [actor(request), body.role])
    return { last_active_role: body.role, app_url: appOf(body.role) }
  })

  // R-ACC-01: the role is created after the email is confirmed (the Auth server refuses a sign-in
  // before, so a session here means a confirmed email).
  server.post('/onboarding/requester', { config: { rateLimit: RATE_LIMITS.create } }, async (request, reply) => {
    const body = bodies.requester.parse(request.body ?? {})
    const row = await callSql(deps.db, request, 'SELECT * FROM identity.become_requester($1, $2, $3, $4)', [
      actor(request), body.nif ? body.nif.toUpperCase() : null, body.address ?? null, body.city ?? null,
    ])
    return reply.status(201).send(row)
  })

  server.post('/onboarding/interpreter', { config: { rateLimit: RATE_LIMITS.create } }, async (request, reply) => {
    const body = bodies.interpreter.parse(request.body ?? {})
    const row = await callSql(deps.db, request, 'SELECT * FROM identity.become_interpreter($1, $2, $3)', [
      actor(request), body.bio ?? null, body.city ?? null,
    ])
    return reply.status(201).send(row)
  })
}
