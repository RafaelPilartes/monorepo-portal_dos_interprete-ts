import { BaseEntity } from '../base/BaseEntity'
import { SuccessCaseProps } from '@/type/database'
import { InterpreterProfileEntity } from '../identity/InterpreterProfileEntity'
import { RequesterProfileEntity } from '../identity/RequesterProfileEntity'
import { BookingEntity } from '../booking/BookingEntity'
import { UserEntity } from '../identity/UserEntity'

export class SuccessCaseEntity extends BaseEntity {
  public readonly title: string
  public readonly summary: string
  public readonly content: string

  public readonly cover_image_url?: string
  public readonly gallery_urls?: string[]

  public readonly interpreter_id?: string
  public readonly interpreter?: InterpreterProfileEntity

  public readonly requester_id?: string
  public readonly requester?: RequesterProfileEntity

  public readonly booking_id?: string
  public readonly booking?: BookingEntity

  public readonly tags?: string[]
  public readonly is_published: boolean
  public readonly published_at?: Date

  public readonly author_user_id: string
  public readonly author_user?: UserEntity

  constructor(
    props: SuccessCaseProps & {
      interpreter?: InterpreterProfileEntity
      requester?: RequesterProfileEntity
      booking?: BookingEntity
      author_user?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.title = props.title
    this.summary = props.summary
    this.content = props.content
    this.cover_image_url = props.cover_image_url
    this.gallery_urls = props.gallery_urls
    this.interpreter_id = props.interpreter_id
    this.interpreter = props.interpreter
    this.requester_id = props.requester_id
    this.requester = props.requester
    this.booking_id = props.booking_id
    this.booking = props.booking
    this.tags = props.tags
    this.is_published = props.is_published
    this.published_at = props.published_at
    this.author_user_id = props.author_user_id
    this.author_user = props.author_user
  }
}
