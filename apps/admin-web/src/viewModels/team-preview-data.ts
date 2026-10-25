import type { AdminProfileEntity, AdminProfileUser } from '@/core/entities/identity/AdminProfileEntity'
import { AdminPermissionLevel } from '@/type/enum'

/**
 * Fictitious team shown until step H1 connects the team screen to the new
 * database (AD-014). Same people as legacy/src/core/mocks/teamMocks.ts.
 */
export const PREVIEW_USERS: AdminProfileUser[] = [
  { id: 'u1', name: 'Rafael Pilartes', email: 'rafael.pilartes@gracemind.com' },
  { id: 'u2', name: 'Ana Beatriz', email: 'ana.beatriz@gracemind.com' },
  { id: 'u3', name: 'Carlos Mendes', email: 'carlos.mendes@gracemind.com' },
]

export const PREVIEW_TEAM: AdminProfileEntity[] = [
  { id: 'a1', user_id: 'u1', user: PREVIEW_USERS[0]!, permission_level: AdminPermissionLevel.SUPER_ADMIN, is_active: true, last_login_at: new Date('2026-10-25T09:00:00Z') },
  { id: 'a2', user_id: 'u2', user: PREVIEW_USERS[1]!, permission_level: AdminPermissionLevel.FINANCE, is_active: true, last_login_at: new Date('2026-10-24T15:30:00Z') },
  { id: 'a3', user_id: 'u3', user: PREVIEW_USERS[2]!, permission_level: AdminPermissionLevel.MODERATOR, is_active: false },
]

/** Shown when someone tries to change the team before the database exists. */
export const TEAM_NOT_CONNECTED_MESSAGE =
  'A gestão da equipa fica disponível quando a base de dados for ligada. Nada foi alterado.'
