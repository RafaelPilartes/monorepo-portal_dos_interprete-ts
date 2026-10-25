import { errorFor, type ErrorCode, type MessageParams } from '@portal-dos-interpretes/core/errors'

/**
 * The only error the data layer throws. It carries the catalog code (the app
 * decides by it), the Portuguese message and the form field from the catalog,
 * never database or server text (api.md §2). The raw cause stays in `cause` for logs.
 */
export class DataError extends Error {
  readonly code: ErrorCode
  readonly field: string | null
  readonly details: Record<string, string> | undefined

  constructor(
    code: string,
    options: { params?: MessageParams | undefined; details?: Record<string, string> | undefined; cause?: unknown } = {},
  ) {
    const entry = errorFor(code, options.params)
    super(entry.message, { cause: options.cause })
    this.name = 'DataError'
    this.code = entry.code
    // The field is decided by the catalog, never by whoever raised the error (api.md §2).
    this.field = entry.field
    this.details = options.details
  }
}
