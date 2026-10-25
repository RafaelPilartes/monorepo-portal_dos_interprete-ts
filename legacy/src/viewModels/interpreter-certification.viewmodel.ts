import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interpreterCertificationUseCase } from '@/domain/usecases/InterpreterCertificationUseCase'
import { InterpreterCertificationEntity } from '@/core/entities/interpreter/InterpreterCertificationEntity'
import { toast } from 'sonner'

export const INTERPRETER_CERTIFICATION_KEYS = {
  all: ['interpreter-certifications'] as const,
  lists: () => [...INTERPRETER_CERTIFICATION_KEYS.all, 'list'] as const,
  byInterpreter: (profileId: string) => [...INTERPRETER_CERTIFICATION_KEYS.lists(), 'interpreter', profileId] as const,
  details: () => [...INTERPRETER_CERTIFICATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INTERPRETER_CERTIFICATION_KEYS.details(), id] as const
}

export function useInterpreterCertificationViewModel() {
  const queryClient = useQueryClient()

  const getCertificationsByInterpreterId = (interpreterProfileId: string) => {
    return useQuery({
      queryKey: INTERPRETER_CERTIFICATION_KEYS.byInterpreter(interpreterProfileId),
      queryFn: () => interpreterCertificationUseCase.getCertificationsByInterpreterId(interpreterProfileId),
      enabled: !!interpreterProfileId
    })
  }

  const updateCertification = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterpreterCertificationEntity> }) =>
      interpreterCertificationUseCase.updateCertification(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: INTERPRETER_CERTIFICATION_KEYS.all })
      queryClient.setQueryData(
        INTERPRETER_CERTIFICATION_KEYS.detail(updatedData.id),
        updatedData
      )
      toast.success('Certificação atualizada')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar certificação', {
        description: error.message
      })
    }
  })

  return {
    getCertificationsByInterpreterId,
    updateCertification
  }
}
