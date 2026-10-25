import { EventEntity } from '@/core/entities/content/EventEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class EventUseCase {
  async getEventById(id: string): Promise<EventEntity | null> {
    try {
      return await ApiRepository.event.getById(id)
    } catch (error) {
      console.error('Error fetching event:', error)
      throw error
    }
  }

  async getAllEvents(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<EventEntity[]>> {
    try {
      return await ApiRepository.event.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }

  async updateEvent(
    id: string,
    data: Partial<EventEntity>
  ): Promise<EventEntity> {
    try {
      return await ApiRepository.event.update(id, data)
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }
}

export const eventUseCase = new EventUseCase()
