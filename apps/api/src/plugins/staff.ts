import type { preHandlerAsyncHookHandler } from 'fastify'
import { ApiError } from '../lib/sendApiError.js'

// Staff levels (api.md §1); super_admin passes every check (R-ADM-01). The level comes from SQL
// (auth_helper.staff_level_of), resolved by the auth plugin.
export const STAFF_LEVELS = ['super_admin', 'moderator', 'finance', 'request_operator'] as const
export type StaffLevel = (typeof STAFF_LEVELS)[number]

export function requireStaff(...levels: StaffLevel[]): preHandlerAsyncHookHandler {
  return async (request) => {
    const level = request.account?.staffLevel ?? null
    if (level === null) throw new ApiError('FORBIDDEN')
    if (level !== 'super_admin' && !levels.includes(level as StaffLevel)) throw new ApiError('FORBIDDEN')
  }
}
