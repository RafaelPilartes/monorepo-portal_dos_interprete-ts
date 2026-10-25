import { ArticleEntity } from '@/core/entities/content/ArticleEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class ArticleUseCase {
  async getArticleById(id: string): Promise<ArticleEntity | null> {
    try {
      return await ApiRepository.article.getById(id)
    } catch (error) {
      console.error('Error fetching article:', error)
      throw error
    }
  }

  async getAllArticles(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<ArticleEntity[]>> {
    try {
      return await ApiRepository.article.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching articles:', error)
      throw error
    }
  }

  async updateArticle(
    id: string,
    data: Partial<ArticleEntity>
  ): Promise<ArticleEntity> {
    try {
      return await ApiRepository.article.update(id, data)
    } catch (error) {
      console.error('Error updating article:', error)
      throw error
    }
  }
}

export const articleUseCase = new ArticleUseCase()
