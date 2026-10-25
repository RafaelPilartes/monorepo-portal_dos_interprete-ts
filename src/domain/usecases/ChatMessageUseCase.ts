import { ChatMessageEntity } from '@/core/entities/booking/ChatMessageEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class ChatMessageUseCase {
  async getMessageById(id: string): Promise<ChatMessageEntity | null> {
    try {
      return await ApiRepository.chatMessage.getById(id)
    } catch (error) {
      console.error('Error fetching chat message:', error)
      throw error
    }
  }

  async getMessagesByBookingId(
    bookingId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<ChatMessageEntity[]>> {
    try {
      return await ApiRepository.chatMessage.getAllByField(
        'booking_id',
        bookingId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching chat messages by booking ID:', error)
      throw error
    }
  }
}

export const chatMessageUseCase = new ChatMessageUseCase()
