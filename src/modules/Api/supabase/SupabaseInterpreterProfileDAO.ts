import { InterpreterProfileEntity } from '@/core/entities/identity/InterpreterProfileEntity'
import { IInterpreterProfileRepository } from '@/core/interfaces/IInterpreterProfileRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseInterpreterProfileDAO
  extends BaseSupabaseDAO<InterpreterProfileEntity>
  implements IInterpreterProfileRepository
{
  constructor() {
    // JOIN with users table to eagerly load user details
    super('interpreter_profiles', ['bio', 'primary_specialty'], '*, user:users(*)')
  }

  protected mapToEntity(data: any): InterpreterProfileEntity {
    return new InterpreterProfileEntity({
      ...data,
      user: data.user ? data.user : undefined,
      last_login_at: data.last_login_at ? new Date(data.last_login_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
