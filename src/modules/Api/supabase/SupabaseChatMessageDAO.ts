import { ChatMessageEntity } from '@/core/entities/booking/ChatMessageEntity'
import { IChatMessageRepository } from '@/core/interfaces/IChatMessageRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseChatMessageDAO
  extends BaseSupabaseDAO<ChatMessageEntity>
  implements IChatMessageRepository
{
  constructor() {
    super('chat_messages', ['message_content'], '*, booking:bookings(*), sender:users(*)')
  }

  protected mapToEntity(data: any): ChatMessageEntity {
    return new ChatMessageEntity({
      ...data,
      booking: data.booking ? data.booking : undefined,
      sender: data.sender ? data.sender : undefined,
      read_at: data.read_at ? new Date(data.read_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
