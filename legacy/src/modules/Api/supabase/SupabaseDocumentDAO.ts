import { DocumentEntity } from '@/core/entities/system/DocumentEntity'
import { IDocumentRepository } from '@/core/interfaces/IDocumentRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseDocumentDAO
  extends BaseSupabaseDAO<DocumentEntity>
  implements IDocumentRepository
{
  constructor() {
    super('documents', ['file_name'], '*, user:users(*), reviewed_by_user:users(*)')
  }

  protected mapToEntity(data: any): DocumentEntity {
    return new DocumentEntity({
      ...data,
      user: data.user ? data.user : undefined,
      reviewed_by_user: data.reviewed_by_user ? data.reviewed_by_user : undefined,
      reviewed_at: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
