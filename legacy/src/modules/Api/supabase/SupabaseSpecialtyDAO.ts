import { SpecialtyEntity } from '@/core/entities/platform/SpecialtyEntity'
import { ISpecialtyRepository } from '@/core/interfaces/ISpecialtyRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseSpecialtyDAO
  extends BaseSupabaseDAO<SpecialtyEntity>
  implements ISpecialtyRepository
{
  constructor() {
    super('specialties', ['name'])
  }

  protected mapToEntity(data: any): SpecialtyEntity {
    return new SpecialtyEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
