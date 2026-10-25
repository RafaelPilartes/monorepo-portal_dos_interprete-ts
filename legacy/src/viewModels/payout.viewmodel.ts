import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payoutUseCase } from '@/domain/usecases/PayoutUseCase'
import { PayoutEntity } from '@/core/entities/financial/PayoutEntity'
import { toast } from 'sonner'

export const PAYOUT_KEYS = {
  all: ['payouts'] as const,
  lists: () => [...PAYOUT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PAYOUT_KEYS.lists(), { filters }] as const,
  details: () => [...PAYOUT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PAYOUT_KEYS.details(), id] as const
}

export function usePayoutViewModel() {
  const queryClient = useQueryClient()

  const getAllPayouts = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: PAYOUT_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => payoutUseCase.getAllPayouts(limit, offset, searchTerm)
    })
  }

  const getPayoutById = (id: string) => {
    return useQuery({
      queryKey: PAYOUT_KEYS.detail(id),
      queryFn: () => payoutUseCase.getPayoutById(id),
      enabled: !!id
    })
  }

  const updatePayout = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PayoutEntity> }) =>
      payoutUseCase.updatePayout(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: PAYOUT_KEYS.all })
      queryClient.setQueryData(PAYOUT_KEYS.detail(updatedData.id), updatedData)
      toast.success('Saque atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar saque', {
        description: error.message
      })
    }
  })

  return {
    getAllPayouts,
    getPayoutById,
    updatePayout
  }
}
