import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemConfigUseCase } from '@/domain/usecases/SystemConfigUseCase'
import { SystemConfigEntity } from '@/core/entities/system/SystemConfigEntity'
import { toast } from 'sonner'

export const SYSTEM_CONFIG_KEYS = {
  all: ['systemConfigs'] as const,
  lists: () => [...SYSTEM_CONFIG_KEYS.all, 'list'] as const,
  list: (filters: string) => [...SYSTEM_CONFIG_KEYS.lists(), { filters }] as const,
  details: () => [...SYSTEM_CONFIG_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SYSTEM_CONFIG_KEYS.details(), id] as const
}

export function useSystemConfigViewModel() {
  const queryClient = useQueryClient()

  const getAllSystemConfigs = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: SYSTEM_CONFIG_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => systemConfigUseCase.getAllSystemConfigs(limit, offset, searchTerm)
    })
  }

  const getSystemConfigById = (id: string) => {
    return useQuery({
      queryKey: SYSTEM_CONFIG_KEYS.detail(id),
      queryFn: () => systemConfigUseCase.getSystemConfigById(id),
      enabled: !!id
    })
  }

  const updateSystemConfig = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SystemConfigEntity> }) =>
      systemConfigUseCase.updateSystemConfig(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: SYSTEM_CONFIG_KEYS.all })
      queryClient.setQueryData(SYSTEM_CONFIG_KEYS.detail(updatedData.id), updatedData)
      toast.success('Configuração atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar configuração', {
        description: error.message
      })
    }
  })

  return {
    getAllSystemConfigs,
    getSystemConfigById,
    updateSystemConfig
  }
}
