import { InterpreterEducationEntity } from '@/core/entities/interpreter/InterpreterEducationEntity'
import { IInterpreterEducationRepository } from '@/core/interfaces/IInterpreterEducationRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseInterpreterEducationDAO
  extends BaseSupabaseDAO<InterpreterEducationEntity>
  implements IInterpreterEducationRepository
{
  constructor() {
    super('interpreter_educations', ['institution', 'degree'])
  }

  protected mapToEntity(data: any): InterpreterEducationEntity {
    return new InterpreterEducationEntity({
      ...data,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
