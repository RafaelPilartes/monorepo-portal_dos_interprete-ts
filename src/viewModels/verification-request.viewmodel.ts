import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { verificationRequestUseCase } from '@/domain/usecases/VerificationRequestUseCase'
import { VerificationRequestEntity } from '@/core/entities/system/VerificationRequestEntity'
import { toast } from 'sonner'

export const VERIFICATION_REQUEST_KEYS = {
  all: ['verificationRequests'] as const,
  lists: () => [...VERIFICATION_REQUEST_KEYS.all, 'list'] as const,
  list: (filters: string) => [...VERIFICATION_REQUEST_KEYS.lists(), { filters }] as const,
  details: () => [...VERIFICATION_REQUEST_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VERIFICATION_REQUEST_KEYS.details(), id] as const
}

export function useVerificationRequestViewModel() {
  const queryClient = useQueryClient()

  const getAllVerificationRequests = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: VERIFICATION_REQUEST_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => verificationRequestUseCase.getAllVerificationRequests(limit, offset, searchTerm)
    })
  }

  const getVerificationRequestById = (id: string) => {
    return useQuery({
      queryKey: VERIFICATION_REQUEST_KEYS.detail(id),
      queryFn: () => verificationRequestUseCase.getVerificationRequestById(id),
      enabled: !!id
    })
  }

  const updateVerificationRequest = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VerificationRequestEntity> }) =>
      verificationRequestUseCase.updateVerificationRequest(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: VERIFICATION_REQUEST_KEYS.all })
      queryClient.setQueryData(VERIFICATION_REQUEST_KEYS.detail(updatedData.id), updatedData)
      toast.success('Solicitação atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar solicitação', {
        description: error.message
      })
    }
  })

  return {
    getAllVerificationRequests,
    getVerificationRequestById,
    updateVerificationRequest
  }
}
