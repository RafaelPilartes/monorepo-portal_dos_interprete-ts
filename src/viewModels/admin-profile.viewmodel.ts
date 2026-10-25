import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminProfileUseCase } from '@/domain/usecases/AdminProfileUseCase'
import { AdminProfileEntity } from '@/core/entities/identity/AdminProfileEntity'
import { toast } from 'sonner'

export const ADMIN_PROFILE_KEYS = {
  all: ['admin-profiles'] as const,
  lists: () => [...ADMIN_PROFILE_KEYS.all, 'list'] as const,
  list: (filters: string) =>
    [...ADMIN_PROFILE_KEYS.lists(), { filters }] as const,
  details: () => [...ADMIN_PROFILE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ADMIN_PROFILE_KEYS.details(), id] as const
}

export const useAdminProfileViewModel = () => {
  const queryClient = useQueryClient()

  const getAllAdminProfiles = (
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<AdminProfileEntity>
  ) => {
    return useQuery({
      queryKey: ADMIN_PROFILE_KEYS.list(
        JSON.stringify({ limit, offset, searchTerm, filters })
      ),
      queryFn: () =>
        adminProfileUseCase.executeGetAll(limit, offset, searchTerm, filters)
    })
  }

  const getAdminProfileById = (id: string) => {
    return useQuery({
      queryKey: ADMIN_PROFILE_KEYS.detail(id),
      queryFn: () => adminProfileUseCase.executeGetById(id),
      enabled: !!id
    })
  }

  const createMutation = useMutation({
    mutationFn: (
      data: Omit<AdminProfileEntity, 'id' | 'created_at' | 'updated_at'>
    ) => adminProfileUseCase.executeCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PROFILE_KEYS.all })
      toast.success('Perfil de administrador criado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar perfil: ${error.message}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data: Partial<AdminProfileEntity>
    }) => adminProfileUseCase.executeUpdate(id, data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PROFILE_KEYS.all })
      queryClient.invalidateQueries({
        queryKey: ADMIN_PROFILE_KEYS.detail(data.id)
      })
      toast.success('Perfil de administrador atualizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminProfileUseCase.executeDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PROFILE_KEYS.all })
      toast.success('Perfil de administrador removido com sucesso')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover perfil: ${error.message}`)
    }
  })

  return {
    getAllAdminProfiles,
    getAdminProfileById,
    createAdminProfile: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAdminProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteAdminProfile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending
  }
}
