import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'

/** The catalog message of an error; never technical text (api.md §2). */
export function errorMessage(error: unknown): string {
  return error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message
}

/** The field-level messages of a VALIDATION_FAILED, if any. */
export function errorDetails(error: unknown): Record<string, string> {
  if (!(error instanceof DataError)) return {}
  // The catalog's own field (e.g. ACCOUNT_NOT_FOUND → email) and the per-field details; zod nests
  // body fields ("values.academia_iban"), the form knows them by their last part.
  const details: Record<string, string> = error.field ? { [error.field]: error.message } : {}
  for (const [key, message] of Object.entries(error.details ?? {})) details[key.split('.').pop() ?? key] = message
  return details
}
