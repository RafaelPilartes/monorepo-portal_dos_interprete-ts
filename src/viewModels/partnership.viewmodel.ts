import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { partnershipUseCase } from '@/domain/usecases/PartnershipUseCase'
import { PartnershipEntity } from '@/core/entities/platform/PartnershipEntity'
import { toast } from 'sonner'

export const PARTNERSHIP_KEYS = {
  all: ['partnerships'] as const,
  lists: () => [...PARTNERSHIP_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PARTNERSHIP_KEYS.lists(), { filters }] as const,
  details: () => [...PARTNERSHIP_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PARTNERSHIP_KEYS.details(), id] as const
}

export function usePartnershipViewModel() {
  const queryClient = useQueryClient()

  const getAllPartnerships = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: PARTNERSHIP_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => partnershipUseCase.getAllPartnerships(limit, offset, searchTerm)
    })
  }

  const getPartnershipById = (id: string) => {
    return useQuery({
      queryKey: PARTNERSHIP_KEYS.detail(id),
      queryFn: () => partnershipUseCase.getPartnershipById(id),
      enabled: !!id
    })
  }

  const updatePartnership = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PartnershipEntity> }) =>
      partnershipUseCase.updatePartnership(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: PARTNERSHIP_KEYS.all })
      queryClient.setQueryData(PARTNERSHIP_KEYS.detail(updatedData.id), updatedData)
      toast.success('Parceria atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar parceria', {
        description: error.message
      })
    }
  })

  return {
    getAllPartnerships,
    getPartnershipById,
    updatePartnership
  }
}
