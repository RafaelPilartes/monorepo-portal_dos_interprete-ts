import { BaseEntity } from '../base/BaseEntity'
import { ChatMessageProps } from '@/type/database'
import { BookingEntity } from './BookingEntity'
import { UserEntity } from '../identity/UserEntity'

export class ChatMessageEntity extends BaseEntity {
  public readonly booking_id: string
  public readonly booking?: BookingEntity

  public readonly sender_id: string
  public readonly sender?: UserEntity

  public readonly content: string
  public readonly read_at?: Date

  public readonly attachment_url?: string
  public readonly attachment_type?: 'image' | 'file'

  constructor(
    props: ChatMessageProps & {
      booking?: BookingEntity
      sender?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.booking_id = props.booking_id
    this.booking = props.booking
    this.sender_id = props.sender_id
    this.sender = props.sender
    this.content = props.content
    this.read_at = props.read_at
    this.attachment_url = props.attachment_url
    this.attachment_type = props.attachment_type
  }
}
