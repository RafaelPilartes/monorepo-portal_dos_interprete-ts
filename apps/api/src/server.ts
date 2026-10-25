import Fastify, { type FastifyInstance } from 'fastify'
import { registerHealthRoute } from './routes/health.js'

export interface ServerOptions {
  /** Short git commit of the build; "unknown" when not provided. */
  commit?: string
  logger?: boolean
}

export function buildServer(options: ServerOptions = {}): FastifyInstance {
  const server = Fastify({ logger: options.logger ?? false })
  registerHealthRoute(server, options.commit ?? 'unknown')
  return server
}
