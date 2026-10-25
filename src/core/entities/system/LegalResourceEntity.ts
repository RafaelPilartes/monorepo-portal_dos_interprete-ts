import { BaseEntity } from '../base/BaseEntity'
import { LegalResourceProps } from '@/type/database'
import { LegalResourceType } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class LegalResourceEntity extends BaseEntity {
  public readonly title: string
  public readonly content: string
  public readonly type: LegalResourceType

  public readonly category?: string
  public readonly file_url?: string
  public readonly is_published: boolean

  public readonly author_user_id: string
  public readonly author_user?: UserEntity

  constructor(
    props: LegalResourceProps & {
      author_user?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.title = props.title
    this.content = props.content
    this.type = props.type
    this.category = props.category
    this.file_url = props.file_url
    this.is_published = props.is_published
    this.author_user_id = props.author_user_id
    this.author_user = props.author_user
  }
}
