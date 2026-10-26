import { ERROR_CATALOG, type ErrorCode } from './catalog'

export { ERROR_CATALOG, type ErrorCode } from './catalog'
export { answerForValueError, CONSTRAINT_CODES, DOMAIN_CODES, FIELD_REASONS, UNIQUE_FIELDS } from './database'
export type { DatabaseErrorAnswer, DatabaseErrorInput } from './database'

/** The body every API error has (api.md §2). `params` fills placeholders such as {min}. */
export interface ApiErrorBody {
  code: string
  message: string
  field: string | null
  params?: Record<string, string | number> | undefined
  details?: Record<string, string> | undefined
}

export type MessageParams = Record<string, string | number>

const PLACEHOLDER = /\{([a-z_]+)\}/g

export function isErrorCode(code: string): code is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_CATALOG, code)
}

/** Fills the catalog's {placeholders}; one that has no value becomes "…", never raw braces. */
export function fillMessage(template: string, params: MessageParams = {}): string {
  return template.replace(PLACEHOLDER, (_match, name: string) => {
    const value = params[name]
    return value === undefined ? '…' : String(value)
  })
}

/**
 * Reads the placeholder values back from a message the API rendered from the
 * same catalog template. Returns null when the text does not follow the
 * template, so unknown server text is never shown.
 */
export function paramsFromMessage(code: string, message: string): MessageParams | null {
  if (!isErrorCode(code)) return null
  const template: string = ERROR_CATALOG[code].message
  const names: string[] = []
  const pattern = template
    .split(PLACEHOLDER)
    .map((part, index) => {
      if (index % 2 === 1) {
        names.push(part)
        return '(.+?)'
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('')
  const match = new RegExp(`^${pattern}$`).exec(message)
  if (!match) return null
  return Object.fromEntries(names.map((name, index) => [name, match[index + 1] ?? '']))
}

/**
 * Catalog entry for a code. An unknown code becomes INTERNAL_ERROR, so no
 * technical text ever reaches the screen (claude-code-rules.md §9).
 */
export function errorFor(
  code: string,
  params?: MessageParams,
): { code: ErrorCode; status: number; message: string; field: string | null } {
  const key: ErrorCode = isErrorCode(code) ? code : 'INTERNAL_ERROR'
  const entry = ERROR_CATALOG[key]
  return { code: key, status: entry.status, message: fillMessage(entry.message, params), field: entry.field }
}

/** Shorthand for form messages that come from the catalog. */
export const catalogMessage = (code: ErrorCode, params?: MessageParams): string => errorFor(code, params).message
