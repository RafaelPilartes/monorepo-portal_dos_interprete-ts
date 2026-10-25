import { BaseEntity } from '../base/BaseEntity'
import { SupportTicketProps } from '@/type/database'
import { TicketPriority, TicketStatus, TicketCategory } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class SupportTicketEntity extends BaseEntity {
  public readonly user_id: string
  public readonly user?: UserEntity

  public readonly assigned_user_id?: string
  public readonly assigned_user?: UserEntity

  public readonly subject: string
  public readonly description: string
  public readonly category: TicketCategory

  public readonly priority: TicketPriority
  public readonly status: TicketStatus

  public readonly resolution_notes?: string
  public readonly resolved_at?: Date

  constructor(
    props: SupportTicketProps & {
      user?: UserEntity
      assigned_user?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.user_id = props.user_id
    this.user = props.user
    this.assigned_user_id = props.assigned_user_id
    this.assigned_user = props.assigned_user
    this.subject = props.subject
    this.description = props.description
    this.category = props.category
    this.priority = props.priority
    this.status = props.status
    this.resolution_notes = props.resolution_notes
    this.resolved_at = props.resolved_at
  }
}
