import { BaseEntity } from '../base/BaseEntity'
import { NotificationProps } from '@/type/database'
import { NotificationType } from '@/type/enum'
import { InterpreterProfileEntity } from '../identity/InterpreterProfileEntity'
import { RequesterProfileEntity } from '../identity/RequesterProfileEntity'
import { AdminProfileEntity } from '../identity/AdminProfileEntity'

export class NotificationEntity extends BaseEntity {
  public readonly target_scope: 'interpreters' | 'requesters' | 'all' | 'admins'
  public readonly is_specific: boolean

  public readonly interpreter_profile_id?: string
  public readonly interpreter_profile?: InterpreterProfileEntity

  public readonly requester_profile_id?: string
  public readonly requester_profile?: RequesterProfileEntity

  public readonly admin_profile_id?: string
  public readonly admin_profile?: AdminProfileEntity

  public readonly title: string
  public readonly message: string
  public readonly type: NotificationType

  public readonly metadata?: Record<string, any>
  public readonly action_url?: string

  constructor(
    props: NotificationProps & {
      interpreter_profile?: InterpreterProfileEntity
      requester_profile?: RequesterProfileEntity
      admin_profile?: AdminProfileEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.target_scope = props.target_scope
    this.is_specific = props.is_specific
    this.interpreter_profile_id = props.interpreter_profile_id
    this.interpreter_profile = props.interpreter_profile
    this.requester_profile_id = props.requester_profile_id
    this.requester_profile = props.requester_profile
    this.admin_profile_id = props.admin_profile_id
    this.admin_profile = props.admin_profile
    this.title = props.title
    this.message = props.message
    this.type = props.type
    this.metadata = props.metadata
    this.action_url = props.action_url
  }
}
