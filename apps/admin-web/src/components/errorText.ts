import { errorFor } from '@portal-dos-interpretes/core/errors'
import { DataError } from '@portal-dos-interpretes/data'

/** The catalog message of an error; never technical text (api.md §2). */
export function errorMessage(error: unknown): string {
  return error instanceof DataError ? error.message : errorFor('INTERNAL_ERROR').message
}

/** The field-level messages of a VALIDATION_FAILED, if any. */
export function errorDetails(error: unknown): Record<string, string> {
  return error instanceof DataError && error.details ? error.details : {}
}
