import type { FastifyInstance } from 'fastify'
import type { Database } from '../lib/db.js'
import { ApiError } from '../lib/sendApiError.js'

// GET /me (api.md §4): who the caller is. Reachable with pending terms ('session'), so the apps can
// show the acceptance screen (R-PRIV-02, from H2). Step H1 returns the account, roles and staff level.
export function registerMeRoute(server: FastifyInstance, deps: { db: Database }): void {
  server.get('/me', { config: { access: 'session' } }, async (request) => {
    const accountId = request.account?.id
    if (!accountId) throw new ApiError('UNAUTHENTICATED')
    const me = await deps.db.transaction(async (client) => {
      const result = await client.query<{ me: unknown }>('SELECT identity.me($1) AS me', [accountId])
      return result.rows[0]?.me ?? null
    })
    if (!me) throw new ApiError('UNAUTHENTICATED')
    return me
  })
}
