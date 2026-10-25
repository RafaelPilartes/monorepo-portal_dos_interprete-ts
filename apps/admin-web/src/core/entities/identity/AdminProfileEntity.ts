import type { AdminPermissionLevel } from '@/type/enum'

/** Shape of a team member as the moved AdminTeam screen reads it (legacy entity, fields only). */
export interface AdminProfileUser {
  id: string
  name: string
  email: string
}

export interface AdminProfileEntity {
  id: string
  user_id: string
  user?: AdminProfileUser
  permission_level: AdminPermissionLevel
  department?: string | undefined
  is_active: boolean
  last_login_at?: Date | undefined
  created_at?: Date
  updated_at?: Date
}
