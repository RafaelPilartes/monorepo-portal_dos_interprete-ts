import type { FastifyInstance } from 'fastify'
import type { Database } from '../lib/db.js'
import { API_VERSION as version } from '../lib/version.js'

export interface HealthResponse {
  status: 'ok' | 'degraded'
  version: string
  commit: string
  /** Last migration bundled with this build. */
  migration_in_build: string | null
  /** Last migration applied to the database; null when the database does not answer. */
  migration_in_database: string | null
}

// GET /health (api.md §3): 200 "ok" when the database answers and has exactly the migrations this
// build expects; otherwise 503 "degraded" with the same fields, so a deploy check catches a
// missing migration or an unreachable database (AD-027).
export function registerHealthRoute(
  server: FastifyInstance,
  deps: { commit: string; migrationInBuild: string | null; db?: Database | undefined },
): void {
  server.get('/health', { config: { access: 'public' } }, async (request, reply): Promise<HealthResponse> => {
    let inDatabase: string | null = null
    if (deps.db) {
      try {
        inDatabase = await deps.db.transaction(async (client) => {
          const result = await client.query<{ name: string | null }>(
            "SELECT max(name) AS name FROM util.applied_migrations WHERE name NOT LIKE '%/%'",
          )
          return result.rows[0]?.name ?? null
        })
      } catch (error) {
        request.log.error({ err: error }, 'health: database unreachable')
      }
    }
    const healthy = inDatabase !== null && inDatabase === deps.migrationInBuild
    reply.status(healthy ? 200 : 503)
    return {
      status: healthy ? 'ok' : 'degraded',
      version,
      commit: deps.commit,
      migration_in_build: deps.migrationInBuild,
      migration_in_database: inDatabase,
    }
  })
}
