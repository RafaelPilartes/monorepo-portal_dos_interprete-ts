import cors from '@fastify/cors'
import Fastify, { type FastifyInstance } from 'fastify'
import type { StorageClient } from './integrations/storage.js'
import type { Database } from './lib/db.js'
import type { TokenVerifier } from './lib/tokens.js'
import { registerAudit } from './plugins/audit.js'
import { registerAuth } from './plugins/auth.js'
import { registerErrorHandling } from './plugins/errors.js'
import { registerRateLimit } from './plugins/rateLimit.js'
import { registerFileRoutes } from './routes/files.js'
import { registerHealthRoute } from './routes/health.js'

export interface ServerOptions {
  /** Short git commit of the build; "unknown" when not provided. */
  commit?: string
  logger?: boolean | { level: string }
  migrationInBuild?: string | null
  /** Proxies in front of the API: a fixed hop count, never "trust all" (foundation.md §G). */
  trustProxyHops?: number
  appOrigins?: string[]
  db?: Database
  verifyToken?: TokenVerifier
  storage?: StorageClient
}

/** Builds the API. Without a database only /health is served (and reports itself degraded). */
export async function buildServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const hops = options.trustProxyHops ?? 0
  const server: FastifyInstance = Fastify({
    logger: options.logger ?? false,
    // Trust exactly `hops` proxies: the client IP is the address `hops` steps back in
    // X-Forwarded-For, so a client cannot choose its own IP by sending the header.
    trustProxy: hops > 0 ? (_address: string, hop: number) => hop < hops : false,
    bodyLimit: 1024 * 1024,
  })
  registerErrorHandling(server)
  await server.register(cors, { origin: options.appOrigins ?? false, credentials: true })

  registerHealthRoute(server, {
    commit: options.commit ?? 'unknown',
    migrationInBuild: options.migrationInBuild ?? null,
    db: options.db,
  })

  if (options.db && options.verifyToken) {
    registerAuth(server, { db: options.db, verifyToken: options.verifyToken })
    registerAudit(server, { db: options.db })
    await registerRateLimit(server)
    if (options.storage) registerFileRoutes(server, { db: options.db, storage: options.storage })
  }
  return server
}
