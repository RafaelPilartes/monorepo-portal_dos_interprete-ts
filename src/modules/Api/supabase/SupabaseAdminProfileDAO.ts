import { AdminProfileEntity } from '@/core/entities/identity/AdminProfileEntity'
import { IAdminProfileRepository } from '@/core/interfaces/IAdminProfileRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseAdminProfileDAO
  extends BaseSupabaseDAO<AdminProfileEntity>
  implements IAdminProfileRepository
{
  constructor() {
    // Fazer JOIN com a tabela users, com o nome (alias) 'user' no JS
    super('admin_profiles', ['user_id', 'department'], '*, user:users(*)')
  }

  protected mapToEntity(data: any): AdminProfileEntity {
    return new AdminProfileEntity({
      ...data,
      user: data.user ? data.user : undefined,
      last_login_at: data.last_login_at ? new Date(data.last_login_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
