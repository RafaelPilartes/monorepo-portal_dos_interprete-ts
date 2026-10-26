import type { ErrorCode } from './catalog'

// A value the database refused, as the screen must show it (api.md §2): the catalog code and, for
// a form value, the field. One place for the API (pg errors) and for the direct writes of
// packages/data (PostgREST errors, which name the constraint only in the message).

export interface DatabaseErrorInput {
  code?: string | undefined
  message?: string | undefined
  constraint?: string | undefined
  table?: string | undefined
  /** "<field>:<reason>" when a SQL function refuses one form value (RAISE ... HINT). */
  hint?: string | undefined
}

export interface DatabaseErrorAnswer {
  code: ErrorCode
  details?: Record<string, string>
}

/** Constraint name → catalog code; feature steps add their unique and check constraints here. */
export const CONSTRAINT_CODES: Readonly<Record<string, ErrorCode>> = {
  organizations_nif_key: 'NIF_IN_USE',
}

/** Unique constraints whose duplicate is a form error: the field and what the person reads. */
export const UNIQUE_FIELDS: Readonly<Record<string, { field: string; message: string }>> = {
  verification_document_types_code_key: { field: 'code', message: 'Já existe um tipo de documento com este código.' },
}

/** What the person reads for a value a SQL function refused, by the reason in its HINT. */
export const FIELD_REASONS: Readonly<Record<string, string>> = {
  already_member: 'Esta pessoa já é membro da organização.',
  required: 'Preenche este campo.',
  invalid: 'Valor inválido.',
}

/** Shared domains (util.*) → their own catalog code, whose field the catalog names. */
export const DOMAIN_CODES: Readonly<Record<string, ErrorCode>> = {
  iban_ao_check: 'INVALID_IBAN',
  nif_check: 'INVALID_NIF',
  phone_e164_check: 'INVALID_PHONE',
}

const FIELD_HINT = /^([a-z_]+):([a-z_]+)$/
// "<table>_<column>_check": Postgres's name for a column CHECK; the column is the form field.
const COLUMN_CHECK = /^[a-z_]+?_((?:[a-z0-9]+_)*[a-z0-9]+)_check$/

/** The constraint and table of an error: pg gives them as fields; PostgREST only in the message. */
function constraintOf(error: DatabaseErrorInput): { constraint: string; table: string } {
  const message = error.message ?? ''
  return {
    constraint: error.constraint ?? /constraint "([^"]+)"/.exec(message)?.[1] ?? '',
    table: error.table ?? /relation "([^"]+)"/.exec(message)?.[1] ?? '',
  }
}

/**
 * A refused value → the code and the field, or null when the error is not about a value (the
 * caller decides: a rule code, a permission, an internal error).
 */
export function answerForValueError(error: DatabaseErrorInput, fieldMessage: string): DatabaseErrorAnswer | null {
  const hint = error.code === 'P0001' && error.message?.trim() === 'VALIDATION_FAILED' ? FIELD_HINT.exec(error.hint ?? '') : null
  if (hint?.[1] && hint[2]) return { code: 'VALIDATION_FAILED', details: { [hint[1]]: FIELD_REASONS[hint[2]] ?? fieldMessage } }
  const { constraint, table } = constraintOf(error)
  if (error.code === '23505') {
    const unique = UNIQUE_FIELDS[constraint]
    if (unique) return { code: 'VALIDATION_FAILED', details: { [unique.field]: unique.message } }
    if (CONSTRAINT_CODES[constraint]) return { code: CONSTRAINT_CODES[constraint] as ErrorCode }
  }
  if (error.code === '23514') {
    if (DOMAIN_CODES[constraint]) return { code: DOMAIN_CODES[constraint] as ErrorCode }
    if (table && constraint.startsWith(`${table}_`) && COLUMN_CHECK.test(constraint)) {
      return { code: 'VALIDATION_FAILED', details: { [constraint.slice(table.length + 1, -'_check'.length)]: fieldMessage } }
    }
  }
  // A value of the wrong type for its column (e.g. text where a number goes).
  if (error.code === '22P02' || error.code === '22003') return { code: 'VALIDATION_FAILED' }
  return null
}
