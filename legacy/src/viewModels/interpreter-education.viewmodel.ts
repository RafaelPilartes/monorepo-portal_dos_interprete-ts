import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interpreterEducationUseCase } from '@/domain/usecases/InterpreterEducationUseCase'
import { InterpreterEducationEntity } from '@/core/entities/interpreter/InterpreterEducationEntity'
import { toast } from 'sonner'

export const INTERPRETER_EDUCATION_KEYS = {
  all: ['interpreter-educations'] as const,
  lists: () => [...INTERPRETER_EDUCATION_KEYS.all, 'list'] as const,
  byInterpreter: (profileId: string) => [...INTERPRETER_EDUCATION_KEYS.lists(), 'interpreter', profileId] as const,
  details: () => [...INTERPRETER_EDUCATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INTERPRETER_EDUCATION_KEYS.details(), id] as const
}

export function useInterpreterEducationViewModel() {
  const queryClient = useQueryClient()

  const getEducationsByInterpreterId = (interpreterProfileId: string) => {
    return useQuery({
      queryKey: INTERPRETER_EDUCATION_KEYS.byInterpreter(interpreterProfileId),
      queryFn: () => interpreterEducationUseCase.getEducationsByInterpreterId(interpreterProfileId),
      enabled: !!interpreterProfileId
    })
  }

  const updateEducation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterpreterEducationEntity> }) =>
      interpreterEducationUseCase.updateEducation(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: INTERPRETER_EDUCATION_KEYS.all })
      queryClient.setQueryData(
        INTERPRETER_EDUCATION_KEYS.detail(updatedData.id),
        updatedData
      )
      toast.success('Formação acadêmica atualizada')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar formação', {
        description: error.message
      })
    }
  })

  return {
    getEducationsByInterpreterId,
    updateEducation
  }
}
