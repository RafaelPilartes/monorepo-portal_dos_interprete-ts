import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { legalResourceUseCase } from '@/domain/usecases/LegalResourceUseCase'
import { LegalResourceEntity } from '@/core/entities/system/LegalResourceEntity'
import { toast } from 'sonner'

export const LEGAL_RESOURCE_KEYS = {
  all: ['legalResources'] as const,
  lists: () => [...LEGAL_RESOURCE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...LEGAL_RESOURCE_KEYS.lists(), { filters }] as const,
  details: () => [...LEGAL_RESOURCE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...LEGAL_RESOURCE_KEYS.details(), id] as const
}

export function useLegalResourceViewModel() {
  const queryClient = useQueryClient()

  const getAllLegalResources = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: LEGAL_RESOURCE_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => legalResourceUseCase.getAllLegalResources(limit, offset, searchTerm)
    })
  }

  const getLegalResourceById = (id: string) => {
    return useQuery({
      queryKey: LEGAL_RESOURCE_KEYS.detail(id),
      queryFn: () => legalResourceUseCase.getLegalResourceById(id),
      enabled: !!id
    })
  }

  const updateLegalResource = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LegalResourceEntity> }) =>
      legalResourceUseCase.updateLegalResource(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: LEGAL_RESOURCE_KEYS.all })
      queryClient.setQueryData(LEGAL_RESOURCE_KEYS.detail(updatedData.id), updatedData)
      toast.success('Recurso atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar recurso', {
        description: error.message
      })
    }
  })

  return {
    getAllLegalResources,
    getLegalResourceById,
    updateLegalResource
  }
}
