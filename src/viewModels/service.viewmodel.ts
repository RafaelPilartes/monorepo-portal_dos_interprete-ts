import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceUseCase } from '@/domain/usecases/ServiceUseCase'
import { ServiceEntity } from '@/core/entities/booking/ServiceEntity'
import { toast } from 'sonner'

export const SERVICE_KEYS = {
  all: ['services'] as const,
  lists: () => [...SERVICE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...SERVICE_KEYS.lists(), { filters }] as const,
  details: () => [...SERVICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SERVICE_KEYS.details(), id] as const
}

export function useServiceViewModel() {
  const queryClient = useQueryClient()

  const getAllServices = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: SERVICE_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => serviceUseCase.getAllServices(limit, offset, searchTerm)
    })
  }

  const getServiceById = (id: string) => {
    return useQuery({
      queryKey: SERVICE_KEYS.detail(id),
      queryFn: () => serviceUseCase.getServiceById(id),
      enabled: !!id
    })
  }

  const updateService = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceEntity> }) =>
      serviceUseCase.updateService(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_KEYS.all })
      queryClient.setQueryData(SERVICE_KEYS.detail(updatedData.id), updatedData)
      toast.success('Serviço global atualizado')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar serviço global', {
        description: error.message
      })
    }
  })

  return {
    getAllServices,
    getServiceById,
    updateService
  }
}
