import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interpreterProfileUseCase } from '@/domain/usecases/InterpreterProfileUseCase'
import { InterpreterProfileEntity } from '@/core/entities/identity/InterpreterProfileEntity'
import { toast } from 'sonner'

export const INTERPRETER_PROFILE_KEYS = {
  all: ['interpreter-profiles'] as const,
  lists: () => [...INTERPRETER_PROFILE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...INTERPRETER_PROFILE_KEYS.lists(), { filters }] as const,
  details: () => [...INTERPRETER_PROFILE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INTERPRETER_PROFILE_KEYS.details(), id] as const
}

export function useInterpreterProfileViewModel() {
  const queryClient = useQueryClient()

  const getAllInterpreterProfiles = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: INTERPRETER_PROFILE_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => interpreterProfileUseCase.getAllProfiles(limit, offset, searchTerm)
    })
  }

  const getInterpreterProfileById = (id: string) => {
    return useQuery({
      queryKey: INTERPRETER_PROFILE_KEYS.detail(id),
      queryFn: () => interpreterProfileUseCase.getProfileById(id),
      enabled: !!id
    })
  }

  const updateInterpreterProfile = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterpreterProfileEntity> }) =>
      interpreterProfileUseCase.updateProfile(id, data),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: INTERPRETER_PROFILE_KEYS.all })
      queryClient.setQueryData(
        INTERPRETER_PROFILE_KEYS.detail(updatedProfile.id),
        updatedProfile
      )
      toast.success('Perfil do intérprete atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar perfil do intérprete', {
        description: error.message
      })
    }
  })

  return {
    getAllInterpreterProfiles,
    getInterpreterProfileById,
    updateInterpreterProfile
  }
}
