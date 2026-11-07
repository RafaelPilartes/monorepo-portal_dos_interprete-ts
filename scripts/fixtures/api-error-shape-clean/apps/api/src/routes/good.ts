import { ApiError } from '../lib/sendApiError.js'
export function handler(): never {
  // message: comments do not count
  throw new ApiError('FORBIDDEN', { reason: 'message: inside a string' })
}
