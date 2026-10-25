import { readFileSync } from 'node:fs'
import type { FastifyInstance } from 'fastify'

// One version for the whole monorepo (architecture.md §9); the API's own
// package.json carries it, so it is also present inside the Docker image.
const version: string = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version

export interface HealthResponse {
  status: 'ok'
  version: string
  commit: string
  /** Last migration bundled with this build; filled in by step F. */
  migration_in_build: string | null
  /** Last migration applied to the database; filled in by step F. */
  migration_in_database: string | null
}

export function registerHealthRoute(server: FastifyInstance, commit: string): void {
  server.get('/health', async (): Promise<HealthResponse> => ({
    status: 'ok',
    version,
    commit,
    migration_in_build: null,
    migration_in_database: null,
  }))
}
