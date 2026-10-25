import { InterpreterExperienceEntity } from '@/core/entities/interpreter/InterpreterExperienceEntity'
import { IInterpreterExperienceRepository } from '@/core/interfaces/IInterpreterExperienceRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseInterpreterExperienceDAO
  extends BaseSupabaseDAO<InterpreterExperienceEntity>
  implements IInterpreterExperienceRepository
{
  constructor() {
    super('interpreter_experiences', ['role', 'company'])
  }

  protected mapToEntity(data: any): InterpreterExperienceEntity {
    return new InterpreterExperienceEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
