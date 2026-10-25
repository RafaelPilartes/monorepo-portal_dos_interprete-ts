import { PartnershipEntity } from '@/core/entities/platform/PartnershipEntity'
import { IPartnershipRepository } from '@/core/interfaces/IPartnershipRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabasePartnershipDAO
  extends BaseSupabaseDAO<PartnershipEntity>
  implements IPartnershipRepository
{
  constructor() {
    super('partnerships', ['name', 'description'])
  }

  protected mapToEntity(data: any): PartnershipEntity {
    return new PartnershipEntity({
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
