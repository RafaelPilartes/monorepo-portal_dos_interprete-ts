import { LegalResourceEntity } from '@/core/entities/system/LegalResourceEntity'
import { ILegalResourceRepository } from '@/core/interfaces/ILegalResourceRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseLegalResourceDAO
  extends BaseSupabaseDAO<LegalResourceEntity>
  implements ILegalResourceRepository
{
  constructor() {
    super('legal_resources', ['title', 'content'], '*, author_user:users(*)')
  }

  protected mapToEntity(data: any): LegalResourceEntity {
    return new LegalResourceEntity({
      ...data,
      author_user: data.author_user ? data.author_user : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
