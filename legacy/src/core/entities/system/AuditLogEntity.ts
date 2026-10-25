import { BaseEntity } from '../base/BaseEntity'
import { AuditLogProps } from '@/type/database'
import { AuditSeverity } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class AuditLogEntity extends BaseEntity {
  public readonly user_id: string
  public readonly user?: UserEntity

  public readonly user_name: string
  public readonly user_email: string
  public readonly user_role?: string

  public readonly action: string
  public readonly module: string
  public readonly description: string
  public readonly severity: AuditSeverity

  public readonly target_id: string
  public readonly target_type: string
  public readonly target_label: string

  public readonly previous_data?: Record<string, unknown> | null
  public readonly new_data?: Record<string, unknown> | null
  public readonly changed_fields?: string[]

  public readonly ip_address: string
  public readonly user_agent: string
  public readonly session_id: string
  public readonly location?: string

  public readonly success: boolean
  public readonly error_message?: string | null

  constructor(
    props: AuditLogProps & {
      user?: UserEntity
    }
  ) {
    super(props.id, props.created_at)
    this.user_id = props.user_id
    this.user = props.user
    this.user_name = props.user_name
    this.user_email = props.user_email
    this.user_role = props.user_role
    this.action = props.action
    this.module = props.module
    this.description = props.description
    this.severity = props.severity
    this.target_id = props.target_id
    this.target_type = props.target_type
    this.target_label = props.target_label
    this.previous_data = props.previous_data
    this.new_data = props.new_data
    this.changed_fields = props.changed_fields
    this.ip_address = props.ip_address
    this.user_agent = props.user_agent
    this.session_id = props.session_id
    this.location = props.location
    this.success = props.success
    this.error_message = props.error_message
  }
}
