import { BaseEntity } from '../base/BaseEntity'
import { AdminProfileProps } from '@/type/database'
import { AdminPermissionLevel } from '@/type/enum'
import { UserEntity } from './UserEntity'

export class AdminProfileEntity extends BaseEntity {
  public readonly user_id: string
  public readonly user?: UserEntity
  public readonly permission_level: AdminPermissionLevel
  public readonly department?: string
  public readonly is_active: boolean
  public readonly last_login_at?: Date

  constructor(props: AdminProfileProps & { user?: UserEntity }) {
    super(props.id, props.created_at, props.updated_at)
    this.user_id = props.user_id
    this.user = props.user
    this.permission_level = props.permission_level
    this.department = props.department
    this.is_active = props.is_active
    this.last_login_at = props.last_login_at
  }
}
