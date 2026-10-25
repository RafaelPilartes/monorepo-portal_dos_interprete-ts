import { VerificationRequestEntity } from '@/core/entities/system/VerificationRequestEntity'
import { IVerificationRequestRepository } from '@/core/interfaces/IVerificationRequestRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseVerificationRequestDAO
  extends BaseSupabaseDAO<VerificationRequestEntity>
  implements IVerificationRequestRepository
{
  constructor() {
    super(
      'verification_requests',
      ['admin_notes'],
      '*, interpreter:interpreter_profiles(*, user:users(*)), admin_reviewer:admin_profiles(*, user:users(*)), payment:payments(*)'
    )
  }

  protected mapToEntity(data: any): VerificationRequestEntity {
    return new VerificationRequestEntity({
      ...data,
      interpreter: data.interpreter ? data.interpreter : undefined,
      admin_reviewer: data.admin_reviewer ? data.admin_reviewer : undefined,
      payment: data.payment ? data.payment : undefined,
      reviewed_at: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      submitted_at: new Date(data.submitted_at),
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
