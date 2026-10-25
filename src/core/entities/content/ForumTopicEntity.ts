import { BaseEntity } from '../base/BaseEntity'
import { ForumTopicProps } from '@/type/database'
import { TopicCategory } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'

export class ForumTopicEntity extends BaseEntity {
  public readonly author_id: string
  public readonly author?: UserEntity

  public readonly title: string
  public readonly category: TopicCategory

  public readonly is_pinned: boolean
  public readonly is_locked: boolean
  public readonly post_count: number
  public readonly view_count: number

  public readonly last_post_at?: Date

  constructor(
    props: ForumTopicProps & {
      author?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.author_id = props.author_id
    this.author = props.author
    this.title = props.title
    this.category = props.category
    this.is_pinned = props.is_pinned
    this.is_locked = props.is_locked
    this.post_count = props.post_count
    this.view_count = props.view_count
    this.last_post_at = props.last_post_at
  }
}
