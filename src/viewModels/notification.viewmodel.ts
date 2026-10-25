import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationUseCase } from '@/domain/usecases/NotificationUseCase'
import { NotificationEntity } from '@/core/entities/system/NotificationEntity'
import { toast } from 'sonner'

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
  list: (filters: string) => [...NOTIFICATION_KEYS.lists(), { filters }] as const,
  details: () => [...NOTIFICATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...NOTIFICATION_KEYS.details(), id] as const
}

export function useNotificationViewModel() {
  const queryClient = useQueryClient()

  const getAllNotifications = (limit?: number, offset?: number, searchTerm?: string) => {
    return useQuery({
      queryKey: NOTIFICATION_KEYS.list(`${limit}-${offset}-${searchTerm}`),
      queryFn: () => notificationUseCase.getAllNotifications(limit, offset, searchTerm)
    })
  }

  const getNotificationById = (id: string) => {
    return useQuery({
      queryKey: NOTIFICATION_KEYS.detail(id),
      queryFn: () => notificationUseCase.getNotificationById(id),
      enabled: !!id
    })
  }

  const updateNotification = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationEntity> }) =>
      notificationUseCase.updateNotification(id, data),
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
      queryClient.setQueryData(NOTIFICATION_KEYS.detail(updatedData.id), updatedData)
      toast.success('Notificação atualizada com sucesso')
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar notificação', {
        description: error.message
      })
    }
  })

  return {
    getAllNotifications,
    getNotificationById,
    updateNotification
  }
}
