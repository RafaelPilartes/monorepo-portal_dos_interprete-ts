import { NotificationEntity } from '@/core/entities/system/NotificationEntity'
import { INotificationRepository } from '@/core/interfaces/INotificationRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseNotificationDAO
  extends BaseSupabaseDAO<NotificationEntity>
  implements INotificationRepository
{
  constructor() {
    super(
      'notifications',
      ['title', 'message'],
      '*, interpreter_profile:interpreter_profiles(*, user:users(*)), requester_profile:requester_profiles(*, user:users(*)), admin_profile:admin_profiles(*, user:users(*))'
    )
  }

  protected mapToEntity(data: any): NotificationEntity {
    return new NotificationEntity({
      ...data,
      interpreter_profile: data.interpreter_profile ? data.interpreter_profile : undefined,
      requester_profile: data.requester_profile ? data.requester_profile : undefined,
      admin_profile: data.admin_profile ? data.admin_profile : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
