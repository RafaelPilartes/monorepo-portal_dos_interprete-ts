import { ServiceEntity } from '@/core/entities/booking/ServiceEntity'
import { IServiceRepository } from '@/core/interfaces/IServiceRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseServiceDAO
  extends BaseSupabaseDAO<ServiceEntity>
  implements IServiceRepository
{
  constructor() {
    super('services', ['title', 'description'])
  }

  protected mapToEntity(data: any): ServiceEntity {
    return new ServiceEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
