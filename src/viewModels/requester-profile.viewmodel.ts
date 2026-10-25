import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { requesterProfileUseCase } from '@/domain/usecases/RequesterProfileUseCase'
import { RequesterProfileEntity } from '@/core/entities/identity/RequesterProfileEntity'
import { toast } from 'sonner'

export const REQUESTER_PROFILE_KEYS = {
  all: ['requester-profiles'] as const,
  lists: () => [...REQUESTER_PROFILE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...REQUESTER_PROFILE_KEYS.lists(), { filters }] as const,
  details: () => [...REQUESTER_PROFILE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...REQUESTER_PROFILE_KEYS.details(), id] as const
}

export function useRequesterProfileViewModel() {
  const queryClient = useQueryClient()

  const getAllRequesterProfiles = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: REQUESTER_PROFILE_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => requesterProfileUseCase.getAllProfiles(limit, offset, searchTerm)
    })
  }

  const getRequesterProfileById = (id: string) => {
    return useQuery({
      queryKey: REQUESTER_PROFILE_KEYS.detail(id),
      queryFn: () => requesterProfileUseCase.getProfileById(id),
      enabled: !!id
    })
  }

  const updateRequesterProfile = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RequesterProfileEntity> }) =>
      requesterProfileUseCase.updateProfile(id, data),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: REQUESTER_PROFILE_KEYS.all })
      queryClient.setQueryData(
        REQUESTER_PROFILE_KEYS.detail(updatedProfile.id),
        updatedProfile
      )
      toast.success('Perfil de cliente atualizado com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar perfil', {
        description: error.message
      })
    }
  })

  return {
    getAllRequesterProfiles,
    getRequesterProfileById,
    updateRequesterProfile
  }
}
