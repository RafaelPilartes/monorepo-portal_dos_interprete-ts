import { LanguageEntity } from '@/core/entities/platform/LanguageEntity'
import { ILanguageRepository } from '@/core/interfaces/ILanguageRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseLanguageDAO
  extends BaseSupabaseDAO<LanguageEntity>
  implements ILanguageRepository
{
  constructor() {
    super('languages', ['name', 'code'])
  }

  protected mapToEntity(data: any): LanguageEntity {
    return new LanguageEntity({
      ...data,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
