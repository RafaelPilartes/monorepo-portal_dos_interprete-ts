import { UserEntity } from '@/core/entities/identity/UserEntity'
import { IUserRepository } from '@/core/interfaces/IUserRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseUserDAO
  extends BaseSupabaseDAO<UserEntity>
  implements IUserRepository
{
  constructor() {
    super('users', ['name', 'email', 'role', 'phone', 'gender'])
  }

  protected mapToEntity(data: any): UserEntity {
    return new UserEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
