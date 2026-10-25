import { isErrorCode, type ErrorCode } from '@portal-dos-interpretes/core/errors'

// Database error → catalog code, in one place (api.md §2). A SQL function refuses by a rule with
// RAISE ... ERRCODE 'P0001', MESSAGE '<CODE>'; constraint violations are mapped by constraint name
// as each feature adds them. Anything else is INTERNAL_ERROR and its real text goes to the log.

export interface DatabaseErrorLike {
  code?: string
  message?: string
  constraint?: string
}

/** Constraint name → catalog code; feature steps add their unique and check constraints here. */
export const CONSTRAINT_CODES: Readonly<Record<string, ErrorCode>> = {}

const SQLSTATE = /^[0-9A-Z]{5}$/

export function isDatabaseError(error: unknown): error is DatabaseErrorLike & { code: string } {
  return typeof error === 'object' && error !== null && typeof (error as DatabaseErrorLike).code === 'string'
    && SQLSTATE.test((error as DatabaseErrorLike).code ?? '') && 'severity' in error
}

export function codeForDatabaseError(error: DatabaseErrorLike): ErrorCode {
  const message = (error.message ?? '').trim()
  if (error.code === 'P0001' && isErrorCode(message)) return message
  if (error.constraint && CONSTRAINT_CODES[error.constraint]) return CONSTRAINT_CODES[error.constraint] as ErrorCode
  if (error.code === '42501') return 'FORBIDDEN'
  // Serialization failure and deadlock: someone else changed the same rows first.
  if (error.code === '40001' || error.code === '40P01') return 'STATE_CHANGED'
  return 'INTERNAL_ERROR'
}
