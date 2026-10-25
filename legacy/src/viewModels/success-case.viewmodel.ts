import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { successCaseUseCase } from '@/domain/usecases/SuccessCaseUseCase'
import { SuccessCaseEntity } from '@/core/entities/content/SuccessCaseEntity'
import { toast } from 'sonner'

export const SUCCESS_CASE_KEYS = {
  all: ['successCases'] as const,
  lists: () => [...SUCCESS_CASE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...SUCCESS_CASE_KEYS.lists(), { filters }] as const,
  details: () => [...SUCCESS_CASE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SUCCESS_CASE_KEYS.details(), id] as const
}

export function useSuccessCaseViewModel() {
  const queryClient = useQueryClient()

  const getAllSuccessCases = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: SUCCESS_CASE_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => successCaseUseCase.getAllSuccessCases(limit, offset, searchTerm)
    })
  }

  const getSuccessCaseById = (id: string) => {
    return useQuery({
      queryKey: SUCCESS_CASE_KEYS.detail(id),
      queryFn: () => successCaseUseCase.getSuccessCaseById(id),
      enabled: !!id
    })
  }

  const updateSuccessCase = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SuccessCaseEntity> }) =>
      successCaseUseCase.updateSuccessCase(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: SUCCESS_CASE_KEYS.all })
      queryClient.setQueryData(SUCCESS_CASE_KEYS.detail(updatedData.id), updatedData)
      toast.success('Caso de sucesso atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar caso de sucesso', {
        description: error.message
      })
    }
  })

  return {
    getAllSuccessCases,
    getSuccessCaseById,
    updateSuccessCase
  }
}
