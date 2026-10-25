import { BaseEntity } from '../base/BaseEntity'
import { EventProps } from '@/type/database'
import { EventType, EventStatus } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class EventEntity extends BaseEntity {
  public readonly title: string
  public readonly description: string

  public readonly type: EventType
  public readonly status: EventStatus

  public readonly start_date: Date
  public readonly end_date: Date

  public readonly location?: string
  public readonly meeting_link?: string

  public readonly capacity?: number
  public readonly registered_count?: number

  public readonly cover_image_url?: string
  public readonly tags?: string[]

  public readonly organizer_id: string
  public readonly organizer?: UserEntity

  constructor(
    props: EventProps & {
      organizer?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.title = props.title
    this.description = props.description
    this.type = props.type
    this.status = props.status
    this.start_date = props.start_date
    this.end_date = props.end_date
    this.location = props.location
    this.meeting_link = props.meeting_link
    this.capacity = props.capacity
    this.registered_count = props.registered_count
    this.cover_image_url = props.cover_image_url
    this.tags = props.tags
    this.organizer_id = props.organizer_id
    this.organizer = props.organizer
  }
}
