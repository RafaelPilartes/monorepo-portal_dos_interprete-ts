import { NotificationEntity } from '@/core/entities/system/NotificationEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class NotificationUseCase {
  async getNotificationById(id: string): Promise<NotificationEntity | null> {
    try {
      return await ApiRepository.notification.getById(id)
    } catch (error) {
      console.error('Error fetching notification:', error)
      throw error
    }
  }

  async getAllNotifications(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<NotificationEntity[]>> {
    try {
      return await ApiRepository.notification.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  async updateNotification(
    id: string,
    data: Partial<NotificationEntity>
  ): Promise<NotificationEntity> {
    try {
      return await ApiRepository.notification.update(id, data)
    } catch (error) {
      console.error('Error updating notification:', error)
      throw error
    }
  }
}

export const notificationUseCase = new NotificationUseCase()
