import { SystemConfigEntity } from '@/core/entities/system/SystemConfigEntity'
import { ISystemConfigRepository } from '@/core/interfaces/ISystemConfigRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseSystemConfigDAO
  extends BaseSupabaseDAO<SystemConfigEntity>
  implements ISystemConfigRepository
{
  constructor() {
    super('system_configs', ['key', 'label', 'description'], '*, updated_by_user:users(*)')
  }

  protected mapToEntity(data: any): SystemConfigEntity {
    return new SystemConfigEntity({
      ...data,
      updated_by_user: data.updated_by_user ? data.updated_by_user : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
