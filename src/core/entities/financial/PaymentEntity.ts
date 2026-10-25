import { BaseEntity } from '../base/BaseEntity'
import { PaymentProps } from '@/type/database'
import { PaymentStatus, PaymentMethod } from '@/type/enum'
import { BookingEntity } from '../booking/BookingEntity'
import { RequesterProfileEntity } from '../identity/RequesterProfileEntity'

export class PaymentEntity extends BaseEntity {
  public readonly booking_id: string
  public readonly booking?: BookingEntity

  public readonly requester_profile_id: string
  public readonly requester_profile?: RequesterProfileEntity

  public readonly amount: number
  public readonly currency: string
  public readonly status: PaymentStatus
  public readonly method: PaymentMethod

  public readonly provider_transaction_id?: string
  public readonly receipt_url?: string

  constructor(
    props: PaymentProps & {
      booking?: BookingEntity
      requester_profile?: RequesterProfileEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.booking_id = props.booking_id
    this.booking = props.booking
    this.requester_profile_id = props.requester_profile_id
    this.requester_profile = props.requester_profile
    this.amount = props.amount
    this.currency = props.currency
    this.status = props.status
    this.method = props.method
    this.provider_transaction_id = props.provider_transaction_id
    this.receipt_url = props.receipt_url
  }
}
