import { PayoutEntity } from '@/core/entities/financial/PayoutEntity'
import { IPayoutRepository } from '@/core/interfaces/IPayoutRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabasePayoutDAO
  extends BaseSupabaseDAO<PayoutEntity>
  implements IPayoutRepository
{
  constructor() {
    super('payouts', ['iban', 'reference'], '*, interpreter_profile:interpreter_profiles(*, user:users(*))')
  }

  protected mapToEntity(data: any): PayoutEntity {
    return new PayoutEntity({
      ...data,
      interpreter_profile: data.interpreter_profile ? data.interpreter_profile : undefined,
      processed_at: data.processed_at ? new Date(data.processed_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
