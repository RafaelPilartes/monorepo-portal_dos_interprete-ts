import { ForumTopicEntity } from '@/core/entities/content/ForumTopicEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class ForumTopicUseCase {
  async getForumTopicById(id: string): Promise<ForumTopicEntity | null> {
    try {
      return await ApiRepository.forumTopic.getById(id)
    } catch (error) {
      console.error('Error fetching forumTopic:', error)
      throw error
    }
  }

  async getAllForumTopics(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<ForumTopicEntity[]>> {
    try {
      return await ApiRepository.forumTopic.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching forumTopics:', error)
      throw error
    }
  }

  async updateForumTopic(
    id: string,
    data: Partial<ForumTopicEntity>
  ): Promise<ForumTopicEntity> {
    try {
      return await ApiRepository.forumTopic.update(id, data)
    } catch (error) {
      console.error('Error updating forumTopic:', error)
      throw error
    }
  }
}

export const forumTopicUseCase = new ForumTopicUseCase()
