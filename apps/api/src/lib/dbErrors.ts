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

/** A database error as the API answers it: the code and, for a bad value, the field. */
export interface DatabaseErrorAnswer {
  code: ErrorCode
  details?: Record<string, string>
}

// "<table>_<column>_check": Postgres's name for a column CHECK; the column is the form field.
const COLUMN_CHECK = /^[a-z_]+?_((?:[a-z0-9]+_)*[a-z0-9]+)_check$/
const DOMAIN_CODES: Readonly<Record<string, ErrorCode>> = {
  iban_ao_check: 'INVALID_IBAN',
  nif_check: 'INVALID_NIF',
  phone_e164_check: 'INVALID_PHONE',
}

/** Like codeForDatabaseError, and for a value the database refuses, the field it belongs to. */
export function answerForDatabaseError(error: DatabaseErrorLike & { column?: string; table?: string }, fieldMessage: string): DatabaseErrorAnswer {
  const constraint = error.constraint ?? ''
  if (error.code === '23514' && DOMAIN_CODES[constraint]) return { code: DOMAIN_CODES[constraint] as ErrorCode }
  if (error.code === '23514' && error.table && constraint.startsWith(`${error.table}_`) && COLUMN_CHECK.test(constraint)) {
    const field = constraint.slice(error.table.length + 1, -'_check'.length)
    return { code: 'VALIDATION_FAILED', details: { [field]: fieldMessage } }
  }
  // A value of the wrong type for its column (e.g. text where a number goes).
  if (error.code === '22P02' || error.code === '22003') return { code: 'VALIDATION_FAILED' }
  return { code: codeForDatabaseError(error) }
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
