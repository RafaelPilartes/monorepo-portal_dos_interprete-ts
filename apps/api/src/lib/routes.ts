import type { FastifyRequest } from 'fastify'
import type { Database, RequestContext } from './db.js'
import { ApiError } from './sendApiError.js'

// What every route that calls a SQL function needs: the caller from the JWT (never from the body,
// api.md §1) and a transaction that carries the request id and IP for the audit.

export function requestContext(request: FastifyRequest): RequestContext {
  return { requestId: request.id, ip: request.ip }
}

export function actor(request: FastifyRequest): string {
  if (!request.account) throw new ApiError('UNAUTHENTICATED')
  return request.account.id
}

/** Runs one SQL statement as the API, in a transaction that carries the request for the audit. */
export async function callSql<T>(db: Database, request: FastifyRequest, sql: string, params: unknown[]): Promise<T> {
  return db.transaction(async (client) => {
    const result = await client.query(sql, params)
    return result.rows[0] as T
  }, requestContext(request))
}
