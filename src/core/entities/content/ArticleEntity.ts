import { BaseEntity } from '../base/BaseEntity'
import { ArticleProps } from '@/type/database'
import { ArticleStatus } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class ArticleEntity extends BaseEntity {
  public readonly title: string
  public readonly slug: string
  public readonly summary: string
  public readonly content: string

  public readonly cover_image_url?: string
  public readonly tags?: string[]

  public readonly status: ArticleStatus
  public readonly author_id: string
  public readonly author?: UserEntity
  public readonly author_name?: string

  public readonly published_at?: Date
  public readonly view_count?: number

  constructor(
    props: ArticleProps & {
      author?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.title = props.title
    this.slug = props.slug
    this.summary = props.summary
    this.content = props.content
    this.cover_image_url = props.cover_image_url
    this.tags = props.tags
    this.status = props.status
    this.author_id = props.author_id
    this.author = props.author
    this.author_name = props.author_name
    this.published_at = props.published_at
    this.view_count = props.view_count
  }
}
