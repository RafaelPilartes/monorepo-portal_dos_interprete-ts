import { PaymentEntity } from '@/core/entities/financial/PaymentEntity'
import { IPaymentRepository } from '@/core/interfaces/IPaymentRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabasePaymentDAO
  extends BaseSupabaseDAO<PaymentEntity>
  implements IPaymentRepository
{
  constructor() {
    super('payments', ['provider_transaction_id'], '*, booking:bookings(*), requester_profile:requester_profiles(*, user:users(*))')
  }

  protected mapToEntity(data: any): PaymentEntity {
    return new PaymentEntity({
      ...data,
      booking: data.booking ? data.booking : undefined,
      requester_profile: data.requester_profile ? data.requester_profile : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}
