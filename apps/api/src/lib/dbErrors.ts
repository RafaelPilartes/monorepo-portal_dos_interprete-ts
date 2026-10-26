import {
  answerForValueError,
  CONSTRAINT_CODES,
  isErrorCode,
  type DatabaseErrorAnswer,
  type ErrorCode,
} from '@portal-dos-interpretes/core/errors'

// Database error → catalog code for the API (api.md §2). The value errors (domains, column
// checks, unique keys, field hints) are translated in @portal-dos-interpretes/core/errors, the same
// place the direct writes of packages/data use; here only what is the API's own: rule codes,
// permissions (a deploy bug for service_role) and concurrency.

export interface DatabaseErrorLike {
  code?: string
  message?: string
  constraint?: string
  hint?: string
}

const SQLSTATE = /^[0-9A-Z]{5}$/

export function isDatabaseError(error: unknown): error is DatabaseErrorLike & { code: string } {
  return typeof error === 'object' && error !== null && typeof (error as DatabaseErrorLike).code === 'string'
    && SQLSTATE.test((error as DatabaseErrorLike).code ?? '') && 'severity' in error
}

export type { DatabaseErrorAnswer }

/** A database error as the API answers it: the code and, for a bad value, the field. */
export function answerForDatabaseError(error: DatabaseErrorLike & { column?: string; table?: string }, fieldMessage: string): DatabaseErrorAnswer {
  return answerForValueError(error, fieldMessage) ?? { code: codeForDatabaseError(error) }
}

export function codeForDatabaseError(error: DatabaseErrorLike): ErrorCode {
  const message = (error.message ?? '').trim()
  if (error.code === 'P0001' && isErrorCode(message)) return message
  if (error.constraint && CONSTRAINT_CODES[error.constraint]) return CONSTRAINT_CODES[error.constraint] as ErrorCode
  // The API always runs as service_role: a permission error is a missing grant (a deploy bug),
  // never the caller's permission, so it is an internal error and goes to the log.
  if (error.code === '42501') return 'INTERNAL_ERROR'
  // Serialization failure and deadlock: someone else changed the same rows first.
  if (error.code === '40001' || error.code === '40P01') return 'STATE_CHANGED'
  return 'INTERNAL_ERROR'
}
