import type { FastifyInstance } from 'fastify'
import type { Database, Queryable } from '../lib/db.js'

// Staff actions, exports and staff reads of conversations go to audit.events through audit.record
// (R-AUD-02), with the request id and the caller's IP. State transitions are recorded by the SQL
// function that makes them, not here.

export interface AuditEntry {
  action: string
  entityType: string
  entityId: string | null
  before?: unknown
  after?: unknown
  note?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Records the entry; pass the route's transaction client so the record commits with the change. */
    audit(entry: AuditEntry, client?: Queryable): Promise<void>
  }
}

export function registerAudit(server: FastifyInstance, deps: { db: Database }): void {
  server.decorateRequest('audit', async function (this: import('fastify').FastifyRequest, entry: AuditEntry, client?: Queryable) {
    const actorRole = this.account?.staffLevel ?? (this.account ? 'account' : 'system')
    const write = (q: Queryable) =>
      q.query('SELECT audit.record($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [
        this.account?.id ?? null,
        actorRole,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.before === undefined ? null : JSON.stringify(entry.before),
        entry.after === undefined ? null : JSON.stringify(entry.after),
        this.id,
        this.ip,
        entry.note ?? null,
      ])
    if (client) await write(client)
    else await deps.db.transaction(write)
  })
}
