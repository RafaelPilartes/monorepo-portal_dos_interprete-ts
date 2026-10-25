import { InterpreterAvailabilityEntity } from '@/core/entities/interpreter/InterpreterAvailabilityEntity'
import { IInterpreterAvailabilityRepository } from '@/core/interfaces/IInterpreterAvailabilityRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseInterpreterAvailabilityDAO
  extends BaseSupabaseDAO<InterpreterAvailabilityEntity>
  implements IInterpreterAvailabilityRepository
{
  constructor() {
    super('interpreter_availabilities')
  }

  protected mapToEntity(data: any): InterpreterAvailabilityEntity {
    return new InterpreterAvailabilityEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
