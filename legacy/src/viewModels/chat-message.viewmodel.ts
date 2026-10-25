import { useQuery } from '@tanstack/react-query'
import { chatMessageUseCase } from '@/domain/usecases/ChatMessageUseCase'

export const CHAT_MESSAGE_KEYS = {
  all: ['chat-messages'] as const,
  lists: () => [...CHAT_MESSAGE_KEYS.all, 'list'] as const,
  byBooking: (bookingId: string) => [...CHAT_MESSAGE_KEYS.lists(), 'booking', bookingId] as const,
  details: () => [...CHAT_MESSAGE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CHAT_MESSAGE_KEYS.details(), id] as const
}

export function useChatMessageViewModel() {
  const getMessagesByBookingId = (bookingId: string, limit?: number, offset?: number) => {
    return useQuery({
      queryKey: CHAT_MESSAGE_KEYS.byBooking(bookingId),
      queryFn: () => chatMessageUseCase.getMessagesByBookingId(bookingId, limit, offset),
      enabled: !!bookingId
    })
  }

  return {
    getMessagesByBookingId
  }
}
