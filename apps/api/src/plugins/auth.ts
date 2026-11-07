import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { Database } from '../lib/db.js'
import { ApiError } from '../lib/sendApiError.js'
import { InvalidTokenError, type TokenVerifier } from '../lib/tokens.js'

// The account always comes from the JWT (architecture.md §6); no route takes an account id from
// the caller. Each route says who may call it in `config.access` (api.md §1); a route that says
// nothing needs an active account with the current terms accepted — closed by default.
//   public   no session needed
//   session  a valid session, even with terms to accept (GET /me, POST /me/accept-terms)
//   account  a valid session, account active and terms accepted

export type Access = 'public' | 'session' | 'account'

export interface CallerAccount {
  id: string
  staffLevel: string | null
}

declare module 'fastify' {
  interface FastifyContextConfig {
    access?: Access
  }
  interface FastifyRequest {
    account: CallerAccount | null
  }
}

/** auth_helper.account_status: what SQL says about the account (H1 adds suspension and terms). */
type AccountStatus = 'active' | 'suspended' | 'terms_required' | 'unknown'

export function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization
  if (typeof header !== 'string') return null
  const match = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(header.trim())
  return match?.[1] ?? null
}

export function registerAuth(server: FastifyInstance, deps: { db: Database; verifyToken: TokenVerifier }): void {
  server.decorateRequest('account', null)

  server.addHook('onRequest', async (request) => {
    const access: Access = request.routeOptions.config.access ?? 'account'
    // An unknown route answers 404 whoever asks; there is nothing behind it to protect.
    if (access === 'public' || request.is404) return

    const token = bearerToken(request)
    if (!token) throw new ApiError('UNAUTHENTICATED')
    let accountId: string
    try {
      accountId = (await deps.verifyToken(token)).accountId
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        request.log.info({ reason: error.message }, 'token refused')
        throw new ApiError('UNAUTHENTICATED')
      }
      throw error
    }

    const { status, staffLevel } = await deps.db.transaction(async (client) => {
      const result = await client.query<{ status: AccountStatus; staff_level: string | null }>(
        'SELECT auth_helper.account_status($1) AS status, auth_helper.staff_level_of($1) AS staff_level',
        [accountId],
      )
      const row = result.rows[0]
      return { status: row?.status ?? 'unknown', staffLevel: row?.staff_level ?? null }
    })
    if (status === 'unknown') throw new ApiError('UNAUTHENTICATED')
    if (status === 'suspended') throw new ApiError('ACCOUNT_SUSPENDED')
    if (status === 'terms_required' && access === 'account') throw new ApiError('TERMS_ACCEPTANCE_REQUIRED')
    request.account = { id: accountId, staffLevel }
  })
}
