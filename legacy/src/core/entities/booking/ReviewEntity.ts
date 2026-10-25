import { BaseEntity } from '../base/BaseEntity'
import { ReviewProps } from '@/type/database'
import { BookingEntity } from './BookingEntity'
import { InterpreterProfileEntity } from '../identity/InterpreterProfileEntity'
import { RequesterProfileEntity } from '../identity/RequesterProfileEntity'

export class ReviewEntity extends BaseEntity {
  public readonly booking_id: string
  public readonly booking?: BookingEntity

  public readonly author_id: string

  public readonly author_interpreter_id?: string
  public readonly author_interpreter?: InterpreterProfileEntity

  public readonly author_requester_id?: string
  public readonly author_requester?: RequesterProfileEntity

  public readonly target_interpreter_id?: string
  public readonly target_interpreter?: InterpreterProfileEntity

  public readonly target_requester_id?: string
  public readonly target_requester?: RequesterProfileEntity

  public readonly rating: number
  public readonly comment?: string

  public readonly is_visible: boolean

  constructor(
    props: ReviewProps & {
      booking?: BookingEntity
      author_interpreter?: InterpreterProfileEntity
      author_requester?: RequesterProfileEntity
      target_interpreter?: InterpreterProfileEntity
      target_requester?: RequesterProfileEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.booking_id = props.booking_id
    this.booking = props.booking

    this.author_id = props.author_id

    this.author_interpreter_id = props.author_interpreter_id
    this.author_interpreter = props.author_interpreter

    this.author_requester_id = props.author_requester_id
    this.author_requester = props.author_requester

    this.target_interpreter_id = props.target_interpreter_id
    this.target_interpreter = props.target_interpreter

    this.target_requester_id = props.target_requester_id
    this.target_requester = props.target_requester

    this.rating = props.rating
    this.comment = props.comment
    this.is_visible = props.is_visible
  }
}
