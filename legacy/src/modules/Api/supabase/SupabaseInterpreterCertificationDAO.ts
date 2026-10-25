import { InterpreterCertificationEntity } from '@/core/entities/interpreter/InterpreterCertificationEntity'
import { IInterpreterCertificationRepository } from '@/core/interfaces/IInterpreterCertificationRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseInterpreterCertificationDAO
  extends BaseSupabaseDAO<InterpreterCertificationEntity>
  implements IInterpreterCertificationRepository
{
  constructor() {
    super('interpreter_certifications', ['name', 'issuer'])
  }

  protected mapToEntity(data: any): InterpreterCertificationEntity {
    return new InterpreterCertificationEntity({
      ...data,
      issue_date: data.issue_date ? new Date(data.issue_date) : undefined,
      expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
