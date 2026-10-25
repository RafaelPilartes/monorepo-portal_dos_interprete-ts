import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userUseCase } from '@/domain/usecases/UserUseCase'
import { UserEntity } from '@/core/entities/identity/UserEntity'
import { toast } from 'sonner'

export const USER_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_KEYS.all, 'list'] as const,
  list: (filters: string) => [...USER_KEYS.lists(), { filters }] as const,
  details: () => [...USER_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USER_KEYS.details(), id] as const
}

export const useUserViewModel = () => {
  const queryClient = useQueryClient()

  const getAllUsers = (
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<UserEntity>
  ) => {
    return useQuery({
      queryKey: USER_KEYS.list(
        JSON.stringify({ limit, offset, searchTerm, filters })
      ),
      queryFn: () => userUseCase.executeGetAll(limit, offset, searchTerm, filters)
    })
  }

  const getUserById = (id: string) => {
    return useQuery({
      queryKey: USER_KEYS.detail(id),
      queryFn: () => userUseCase.executeGetById(id),
      enabled: !!id
    })
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserEntity> }) =>
      userUseCase.executeUpdate(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all })
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(data.id) })
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar utilizador: ${error.message}`)
    }
  })

  return {
    getAllUsers,
    getUserById,
    updateUser: updateMutation.mutateAsync,
    isUpdatingUser: updateMutation.isPending
  }
}
