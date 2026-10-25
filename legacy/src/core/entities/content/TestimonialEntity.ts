import { BaseEntity } from '../base/BaseEntity'
import { TestimonialProps } from '@/type/database'
import { TestimonialStatus } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class TestimonialEntity extends BaseEntity {
  public readonly author_name: string
  public readonly author_role?: string
  public readonly author_avatar_url?: string

  public readonly author_user_id?: string
  public readonly author_user?: UserEntity

  public readonly content: string
  public readonly rating?: number

  public readonly status: TestimonialStatus
  public readonly is_featured: boolean

  public readonly approved_by_user_id?: string
  public readonly approved_by_user?: UserEntity

  public readonly approved_at?: Date

  constructor(
    props: TestimonialProps & {
      author_user?: UserEntity
      approved_by_user?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.author_name = props.author_name
    this.author_role = props.author_role
    this.author_avatar_url = props.author_avatar_url
    this.author_user_id = props.author_user_id
    this.author_user = props.author_user
    this.content = props.content
    this.rating = props.rating
    this.status = props.status
    this.is_featured = props.is_featured
    this.approved_by_user_id = props.approved_by_user_id
    this.approved_by_user = props.approved_by_user
    this.approved_at = props.approved_at
  }
}
