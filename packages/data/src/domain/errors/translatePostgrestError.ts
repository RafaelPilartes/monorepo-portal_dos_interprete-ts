import { answerForValueError, catalogMessage, isErrorCode } from '@portal-dos-interpretes/core/errors'
import { DataError } from './DataError'

export interface PostgrestLikeError {
  code?: string | undefined
  message: string
  hint?: string | null | undefined
}

/**
 * Database error -> catalog code. A SQL function raises P0001 with the catalog
 * code as its message (architecture.md §6); a permission denial (RLS or grant)
 * is FORBIDDEN; anything else is INTERNAL_ERROR and the real text is only logged.
 */
export function translatePostgrestError(error: PostgrestLikeError, where: string): DataError {
  if (error.code === 'P0001' && isErrorCode(error.message.trim())) {
    return new DataError(error.message.trim(), { cause: error })
  }
  // A refused value (a domain, a column check, a unique key): the code and the field, translated
  // in the same place as the API's (@portal-dos-interpretes/core/errors).
  const value = answerForValueError({ code: error.code, message: error.message, hint: error.hint ?? undefined }, catalogMessage('VALIDATION_FAILED'))
  if (value) return new DataError(value.code, { details: value.details, cause: error })
  if (error.code === '42501') {
    return new DataError('FORBIDDEN', { cause: error })
  }
  // PostgREST: JWT expired or invalid -> the session ended.
  if (error.code === 'PGRST301' || error.code === 'PGRST303') {
    return new DataError('UNAUTHENTICATED', { cause: error })
  }
  console.error(`[data] ${where}: ${error.code ?? 'no code'} ${error.message}`)
  return new DataError('INTERNAL_ERROR', { cause: error })
}
