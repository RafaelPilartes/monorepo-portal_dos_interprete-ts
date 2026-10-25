import { BaseEntity } from '../base/BaseEntity'
import { ForumPostProps } from '@/type/database'
import { ForumTopicEntity } from './ForumTopicEntity'
import { UserEntity } from '../identity/UserEntity'

export class ForumPostEntity extends BaseEntity {
  public readonly topic_id: string
  public readonly topic?: ForumTopicEntity

  public readonly author_id: string
  public readonly author?: UserEntity

  public readonly content: string

  public readonly parent_post_id?: string
  public readonly parent_post?: ForumPostEntity

  public readonly is_solution: boolean
  public readonly like_count: number

  constructor(
    props: ForumPostProps & {
      topic?: ForumTopicEntity
      author?: UserEntity
      parent_post?: ForumPostEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.topic_id = props.topic_id
    this.topic = props.topic
    this.author_id = props.author_id
    this.author = props.author
    this.content = props.content
    this.parent_post_id = props.parent_post_id
    this.parent_post = props.parent_post
    this.is_solution = props.is_solution
    this.like_count = props.like_count
  }
}
