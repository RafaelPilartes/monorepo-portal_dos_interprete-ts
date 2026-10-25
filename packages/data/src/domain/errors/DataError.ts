import { errorFor, type ErrorCode } from '@portal-dos-interpretes/core/errors'

/**
 * The only error the data layer throws. It carries the catalog code (the app
 * decides by it), the Portuguese message and the form field from the catalog,
 * never database text (api.md §2). The raw cause stays in `cause` for logs.
 */
export class DataError extends Error {
  readonly code: ErrorCode
  readonly field: string | null
  readonly details: Record<string, string> | undefined

  constructor(code: string, options: { field?: string | null; details?: Record<string, string>; cause?: unknown } = {}) {
    const entry = errorFor(code)
    super(entry.message, { cause: options.cause })
    this.name = 'DataError'
    this.code = entry.code
    this.field = options.field !== undefined ? options.field : entry.field
    this.details = options.details
  }
}
