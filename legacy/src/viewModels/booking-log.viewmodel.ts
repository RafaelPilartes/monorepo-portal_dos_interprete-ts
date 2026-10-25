import { useQuery } from '@tanstack/react-query'
import { bookingLogUseCase } from '@/domain/usecases/BookingLogUseCase'

export const BOOKING_LOG_KEYS = {
  all: ['booking-logs'] as const,
  lists: () => [...BOOKING_LOG_KEYS.all, 'list'] as const,
  byBooking: (bookingId: string) => [...BOOKING_LOG_KEYS.lists(), 'booking', bookingId] as const,
  details: () => [...BOOKING_LOG_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BOOKING_LOG_KEYS.details(), id] as const
}

export function useBookingLogViewModel() {
  const getLogsByBookingId = (bookingId: string, limit?: number, offset?: number) => {
    return useQuery({
      queryKey: BOOKING_LOG_KEYS.byBooking(bookingId),
      queryFn: () => bookingLogUseCase.getLogsByBookingId(bookingId, limit, offset),
      enabled: !!bookingId
    })
  }

  return {
    getLogsByBookingId
  }
}
