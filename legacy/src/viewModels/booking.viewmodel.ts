import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingUseCase } from '@/domain/usecases/BookingUseCase'
import { BookingEntity } from '@/core/entities/booking/BookingEntity'
import { toast } from 'sonner'

export const BOOKING_KEYS = {
  all: ['bookings'] as const,
  lists: () => [...BOOKING_KEYS.all, 'list'] as const,
  list: (filters: string) => [...BOOKING_KEYS.lists(), { filters }] as const,
  byInterpreter: (interpreterId: string) => [...BOOKING_KEYS.lists(), 'interpreter', interpreterId] as const,
  byRequester: (requesterId: string) => [...BOOKING_KEYS.lists(), 'requester', requesterId] as const,
  details: () => [...BOOKING_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BOOKING_KEYS.details(), id] as const
}

export function useBookingViewModel() {
  const queryClient = useQueryClient()

  const getAllBookings = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: BOOKING_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => bookingUseCase.getAllBookings(limit, offset, searchTerm)
    })
  }

  const getBookingsByInterpreterId = (interpreterId: string, limit?: number, offset?: number) => {
    return useQuery({
      queryKey: BOOKING_KEYS.byInterpreter(interpreterId),
      queryFn: () => bookingUseCase.getBookingsByInterpreterId(interpreterId, limit, offset),
      enabled: !!interpreterId
    })
  }

  const getBookingsByRequesterId = (requesterId: string, limit?: number, offset?: number) => {
    return useQuery({
      queryKey: BOOKING_KEYS.byRequester(requesterId),
      queryFn: () => bookingUseCase.getBookingsByRequesterId(requesterId, limit, offset),
      enabled: !!requesterId
    })
  }

  const getBookingById = (id: string) => {
    return useQuery({
      queryKey: BOOKING_KEYS.detail(id),
      queryFn: () => bookingUseCase.getBookingById(id),
      enabled: !!id
    })
  }

  const updateBooking = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookingEntity> }) =>
      bookingUseCase.updateBooking(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all })
      queryClient.setQueryData(BOOKING_KEYS.detail(updatedData.id), updatedData)
      toast.success('Agendamento atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar agendamento', {
        description: error.message
      })
    }
  })

  return {
    getAllBookings,
    getBookingsByInterpreterId,
    getBookingsByRequesterId,
    getBookingById,
    updateBooking
  }
}
