import { ForumPostEntity } from '@/core/entities/content/ForumPostEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class ForumPostUseCase {
  async getForumPostById(id: string): Promise<ForumPostEntity | null> {
    try {
      return await ApiRepository.forumPost.getById(id)
    } catch (error) {
      console.error('Error fetching forumPost:', error)
      throw error
    }
  }

  async getAllForumPosts(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<ForumPostEntity[]>> {
    try {
      return await ApiRepository.forumPost.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching forumPosts:', error)
      throw error
    }
  }

  async updateForumPost(
    id: string,
    data: Partial<ForumPostEntity>
  ): Promise<ForumPostEntity> {
    try {
      return await ApiRepository.forumPost.update(id, data)
    } catch (error) {
      console.error('Error updating forumPost:', error)
      throw error
    }
  }
}

export const forumPostUseCase = new ForumPostUseCase()
