import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supportTicketUseCase } from '@/domain/usecases/SupportTicketUseCase'
import { SupportTicketEntity } from '@/core/entities/system/SupportTicketEntity'
import { toast } from 'sonner'

export const SUPPORT_TICKET_KEYS = {
  all: ['supportTickets'] as const,
  lists: () => [...SUPPORT_TICKET_KEYS.all, 'list'] as const,
  list: (filters: string) => [...SUPPORT_TICKET_KEYS.lists(), { filters }] as const,
  details: () => [...SUPPORT_TICKET_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SUPPORT_TICKET_KEYS.details(), id] as const
}

export function useSupportTicketViewModel() {
  const queryClient = useQueryClient()

  const getAllSupportTickets = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: SUPPORT_TICKET_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => supportTicketUseCase.getAllSupportTickets(limit, offset, searchTerm)
    })
  }

  const getSupportTicketById = (id: string) => {
    return useQuery({
      queryKey: SUPPORT_TICKET_KEYS.detail(id),
      queryFn: () => supportTicketUseCase.getSupportTicketById(id),
      enabled: !!id
    })
  }

  const updateSupportTicket = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupportTicketEntity> }) =>
      supportTicketUseCase.updateSupportTicket(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_TICKET_KEYS.all })
      queryClient.setQueryData(SUPPORT_TICKET_KEYS.detail(updatedData.id), updatedData)
      toast.success('Ticket atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar ticket', {
        description: error.message
      })
    }
  })

  return {
    getAllSupportTickets,
    getSupportTicketById,
    updateSupportTicket
  }
}
