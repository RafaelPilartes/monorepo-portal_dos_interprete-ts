import { isErrorCode } from '@portal-dos-interpretes/core/errors'
import { DataError } from './DataError'

export interface PostgrestLikeError {
  code?: string | undefined
  message: string
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
  if (error.code === '42501') {
    return new DataError('FORBIDDEN', { cause: error })
  }
  console.error(`[data] ${where}: ${error.code ?? 'no code'} ${error.message}`)
  return new DataError('INTERNAL_ERROR', { cause: error })
}
