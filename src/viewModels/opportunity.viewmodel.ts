import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { opportunityUseCase } from '@/domain/usecases/OpportunityUseCase'
import { OpportunityEntity } from '@/core/entities/platform/OpportunityEntity'
import { toast } from 'sonner'

export const OPPORTUNITY_KEYS = {
  all: ['opportunities'] as const,
  lists: () => [...OPPORTUNITY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...OPPORTUNITY_KEYS.lists(), { filters }] as const,
  details: () => [...OPPORTUNITY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...OPPORTUNITY_KEYS.details(), id] as const
}

export function useOpportunityViewModel() {
  const queryClient = useQueryClient()

  const getAllOpportunities = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: OPPORTUNITY_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => opportunityUseCase.getAllOpportunities(limit, offset, searchTerm)
    })
  }

  const getOpportunityById = (id: string) => {
    return useQuery({
      queryKey: OPPORTUNITY_KEYS.detail(id),
      queryFn: () => opportunityUseCase.getOpportunityById(id),
      enabled: !!id
    })
  }

  const updateOpportunity = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpportunityEntity> }) =>
      opportunityUseCase.updateOpportunity(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: OPPORTUNITY_KEYS.all })
      queryClient.setQueryData(OPPORTUNITY_KEYS.detail(updatedData.id), updatedData)
      toast.success('Oportunidade atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar oportunidade', {
        description: error.message
      })
    }
  })

  return {
    getAllOpportunities,
    getOpportunityById,
    updateOpportunity
  }
}
