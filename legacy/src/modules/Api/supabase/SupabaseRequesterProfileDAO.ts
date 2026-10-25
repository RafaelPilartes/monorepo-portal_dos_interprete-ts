import { RequesterProfileEntity } from '@/core/entities/identity/RequesterProfileEntity'
import { IRequesterProfileRepository } from '@/core/interfaces/IRequesterProfileRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseRequesterProfileDAO
  extends BaseSupabaseDAO<RequesterProfileEntity>
  implements IRequesterProfileRepository
{
  constructor() {
    // JOIN with users table to eagerly load user details
    super('requester_profiles', ['company_name', 'nif', 'industry'], '*, user:users(*)')
  }

  protected mapToEntity(data: any): RequesterProfileEntity {
    return new RequesterProfileEntity({
      ...data,
      user: data.user ? data.user : undefined,
      last_login_at: data.last_login_at ? new Date(data.last_login_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
