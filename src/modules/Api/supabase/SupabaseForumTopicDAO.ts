import { ForumTopicEntity } from '@/core/entities/content/ForumTopicEntity'
import { IForumTopicRepository } from '@/core/interfaces/IForumTopicRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseForumTopicDAO
  extends BaseSupabaseDAO<ForumTopicEntity>
  implements IForumTopicRepository
{
  constructor() {
    super('forum_topics', ['title'], '*, author:users(*)')
  }

  protected mapToEntity(data: any): ForumTopicEntity {
    return new ForumTopicEntity({
      ...data,
      author: data.author ? data.author : undefined,
      last_post_at: data.last_post_at ? new Date(data.last_post_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
