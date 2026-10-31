import {
  catalogMessage,
  ERROR_CATALOG,
  paramsFromMessage,
} from '@portal-dos-interpretes/core/errors'
import type { FastifyError, FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { answerForDatabaseError, isDatabaseError } from '../lib/dbErrors.js'
import { ApiError, sendApiError } from '../lib/sendApiError.js'

// Every error leaves the API in the catalog's shape (api.md §2). What a person sees is a catalog
// message; technical text only reaches the log.

const CODES = Object.keys(ERROR_CATALOG)

/** True when the text is one of the catalog's messages, placeholders filled or not. */
export function isCatalogMessage(message: string): boolean {
  return CODES.some((code) => paramsFromMessage(code, message) !== null)
}

/** Field → message for VALIDATION_FAILED. A non-catalog message (zod's English default) is replaced. */
export function validationDetails(error: ZodError): Record<string, string> {
  const details: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_'
    if (details[field] !== undefined) continue
    details[field] = isCatalogMessage(issue.message) ? issue.message : catalogMessage('VALIDATION_FAILED')
  }
  return details
}

export function registerErrorHandling(server: FastifyInstance): void {
  server.setNotFoundHandler((_request, reply) => sendApiError(reply, 'NOT_FOUND'))

  server.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof ApiError) return sendApiError(reply, error.code, error.params, error.details)
    if (error instanceof ZodError) return sendApiError(reply, 'VALIDATION_FAILED', undefined, validationDetails(error))
    if (isDatabaseError(error)) {
      const answer = answerForDatabaseError(error, catalogMessage('VALIDATION_FAILED'))
      // Rule refusals (P0001) and refused values are expected; every other database error is logged.
      if (answer.code === 'INTERNAL_ERROR') request.log.error({ err: error }, 'database error')
      else if (error.code !== 'P0001') request.log.info({ err: error, mappedTo: answer.code }, 'database refused a value')
      return sendApiError(reply, answer.code, undefined, answer.details)
    }
    const status = (error as FastifyError).statusCode
    if (status === 429) return sendApiError(reply, 'RATE_LIMITED')
    if (status !== undefined && status >= 400 && status < 500) {
      // A body that does not parse, a wrong content type, a body too large: a malformed request.
      request.log.info({ err: error }, 'malformed request')
      return sendApiError(reply, 'VALIDATION_FAILED')
    }
    request.log.error({ err: error }, 'unhandled error')
    return sendApiError(reply, 'INTERNAL_ERROR')
  })
}
