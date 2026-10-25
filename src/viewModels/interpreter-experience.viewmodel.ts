import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interpreterExperienceUseCase } from '@/domain/usecases/InterpreterExperienceUseCase'
import { InterpreterExperienceEntity } from '@/core/entities/interpreter/InterpreterExperienceEntity'
import { toast } from 'sonner'

export const INTERPRETER_EXPERIENCE_KEYS = {
  all: ['interpreter-experiences'] as const,
  lists: () => [...INTERPRETER_EXPERIENCE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...INTERPRETER_EXPERIENCE_KEYS.lists(), { filters }] as const,
  byInterpreter: (profileId: string) => [...INTERPRETER_EXPERIENCE_KEYS.lists(), 'interpreter', profileId] as const,
  details: () => [...INTERPRETER_EXPERIENCE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INTERPRETER_EXPERIENCE_KEYS.details(), id] as const
}

export function useInterpreterExperienceViewModel() {
  const queryClient = useQueryClient()

  const getAllExperiences = (limit?: number, offset?: number) => {
    return useQuery({
      queryKey: INTERPRETER_EXPERIENCE_KEYS.list(`${limit}-${offset}`),
      queryFn: () => interpreterExperienceUseCase.getAllExperiences(limit, offset)
    })
  }

  const updateExperience = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterpreterExperienceEntity> }) =>
      interpreterExperienceUseCase.updateExperience(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: INTERPRETER_EXPERIENCE_KEYS.all })
      queryClient.setQueryData(
        INTERPRETER_EXPERIENCE_KEYS.detail(updatedData.id),
        updatedData
      )
      toast.success('Experiência atualizada')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar experiência', {
        description: error.message
      })
    }
  })

  return {
    getAllExperiences,
    updateExperience
  }
}
