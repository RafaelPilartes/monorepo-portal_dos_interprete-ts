import { OpportunityEntity } from '@/core/entities/platform/OpportunityEntity'
import { IOpportunityRepository } from '@/core/interfaces/IOpportunityRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseOpportunityDAO
  extends BaseSupabaseDAO<OpportunityEntity>
  implements IOpportunityRepository
{
  constructor() {
    super('opportunities', ['title', 'description', 'location'], '*, posted_by_user:users(*), posted_by_partner:partnerships(*)')
  }

  protected mapToEntity(data: any): OpportunityEntity {
    return new OpportunityEntity({
      ...data,
      posted_by_user: data.posted_by_user ? data.posted_by_user : undefined,
      posted_by_partner: data.posted_by_partner ? data.posted_by_partner : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
