import { errorFor, type ErrorCode, type MessageParams } from '@portal-dos-interpretes/core/errors'
import type { FastifyReply } from 'fastify'

// Errors the API sends (api.md §2). Code, status, message and field all come from the catalog in
// @portal-dos-interpretes/core/errors; a route only names the code.
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly params?: MessageParams,
    readonly details?: Record<string, string>,
  ) {
    super(code)
    this.name = 'ApiError'
  }
}

export interface ApiErrorEnvelope {
  error: {
    code: ErrorCode
    message: string
    field: string | null
    params?: MessageParams
    details?: Record<string, string>
  }
}

export function apiErrorBody(code: ErrorCode, params?: MessageParams, details?: Record<string, string>): ApiErrorEnvelope {
  const entry = errorFor(code, params)
  return {
    error: {
      code: entry.code,
      message: entry.message,
      field: entry.field,
      ...(params ? { params } : {}),
      ...(details ? { details } : {}),
    },
  }
}

export function sendApiError(
  reply: FastifyReply,
  code: ErrorCode,
  params?: MessageParams,
  details?: Record<string, string>,
): FastifyReply {
  return reply.status(errorFor(code, params).status).send(apiErrorBody(code, params, details))
}
