import { ForumPostEntity } from '@/core/entities/content/ForumPostEntity'
import { IForumPostRepository } from '@/core/interfaces/IForumPostRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseForumPostDAO
  extends BaseSupabaseDAO<ForumPostEntity>
  implements IForumPostRepository
{
  constructor() {
    super(
      'forum_posts',
      ['content'],
      '*, topic:forum_topics(*), author:users(*), parent_post:forum_posts(*)'
    )
  }

  protected mapToEntity(data: any): ForumPostEntity {
    return new ForumPostEntity({
      ...data,
      topic: data.topic ? data.topic : undefined,
      author: data.author ? data.author : undefined,
      parent_post: data.parent_post ? data.parent_post : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
