import { InterpreterServiceEntity } from '@/core/entities/interpreter/InterpreterServiceEntity'
import { IInterpreterServiceRepository } from '@/core/interfaces/IInterpreterServiceRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseInterpreterServiceDAO
  extends BaseSupabaseDAO<InterpreterServiceEntity>
  implements IInterpreterServiceRepository
{
  constructor() {
    super('interpreter_services', ['name'])
  }

  protected mapToEntity(data: any): InterpreterServiceEntity {
    return new InterpreterServiceEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
