import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventUseCase } from '@/domain/usecases/EventUseCase'
import { EventEntity } from '@/core/entities/content/EventEntity'
import { toast } from 'sonner'

export const EVENT_KEYS = {
  all: ['events'] as const,
  lists: () => [...EVENT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...EVENT_KEYS.lists(), { filters }] as const,
  details: () => [...EVENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EVENT_KEYS.details(), id] as const
}

export function useEventViewModel() {
  const queryClient = useQueryClient()

  const getAllEvents = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: EVENT_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => eventUseCase.getAllEvents(limit, offset, searchTerm)
    })
  }

  const getEventById = (id: string) => {
    return useQuery({
      queryKey: EVENT_KEYS.detail(id),
      queryFn: () => eventUseCase.getEventById(id),
      enabled: !!id
    })
  }

  const updateEvent = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventEntity> }) =>
      eventUseCase.updateEvent(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.all })
      queryClient.setQueryData(EVENT_KEYS.detail(updatedData.id), updatedData)
      toast.success('Evento atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar evento', {
        description: error.message
      })
    }
  })

  return {
    getAllEvents,
    getEventById,
    updateEvent
  }
}
