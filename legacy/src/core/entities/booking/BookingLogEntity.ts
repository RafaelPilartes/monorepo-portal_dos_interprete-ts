import { BaseEntity } from '../base/BaseEntity'
import { BookingLogProps } from '@/type/database'
import { BookingStatus } from '@/type/enum'
import { BookingEntity } from './BookingEntity'
import { UserEntity } from '../identity/UserEntity'

export class BookingLogEntity extends BaseEntity {
  public readonly booking_id: string
  public readonly booking?: BookingEntity

  public readonly old_status?: BookingStatus
  public readonly new_status: BookingStatus

  public readonly changed_by_user_id: string
  public readonly changed_by_user?: UserEntity

  public readonly reason?: string

  constructor(
    props: BookingLogProps & {
      booking?: BookingEntity
      changed_by_user?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.booking_id = props.booking_id
    this.booking = props.booking
    this.old_status = props.old_status
    this.new_status = props.new_status
    this.changed_by_user_id = props.changed_by_user_id
    this.changed_by_user = props.changed_by_user
    this.reason = props.reason
  }
}
