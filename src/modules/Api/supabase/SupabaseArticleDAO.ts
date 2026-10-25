import { ArticleEntity } from '@/core/entities/content/ArticleEntity'
import { IArticleRepository } from '@/core/interfaces/IArticleRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseArticleDAO
  extends BaseSupabaseDAO<ArticleEntity>
  implements IArticleRepository
{
  constructor() {
    super('articles', ['title', 'summary', 'content'], '*, author:users(*)')
  }

  protected mapToEntity(data: any): ArticleEntity {
    return new ArticleEntity({
      ...data,
      author: data.author ? data.author : undefined,
      published_at: data.published_at ? new Date(data.published_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
