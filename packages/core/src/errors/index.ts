import { ERROR_CATALOG, type ErrorCode } from './catalog'

export { ERROR_CATALOG, type ErrorCode } from './catalog'

/** The body every API error has (api.md §2). */
export interface ApiErrorBody {
  code: string
  message: string
  field: string | null
  details?: Record<string, string> | undefined
}

export function isErrorCode(code: string): code is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_CATALOG, code)
}

/**
 * Catalog entry for a code. An unknown code becomes INTERNAL_ERROR, so no
 * technical text ever reaches the screen (claude-code-rules.md §9).
 */
export function errorFor(code: string): { code: ErrorCode; status: number; message: string; field: string | null } {
  const key: ErrorCode = isErrorCode(code) ? code : 'INTERNAL_ERROR'
  const entry = ERROR_CATALOG[key]
  return { code: key, status: entry.status, message: entry.message, field: entry.field }
}
