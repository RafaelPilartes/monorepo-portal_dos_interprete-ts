import { BaseEntity } from '../base/BaseEntity'
import { PayoutProps } from '@/type/database'
import { PayoutStatus } from '@/type/enum'
import { InterpreterProfileEntity } from '../identity/InterpreterProfileEntity'

export class PayoutEntity extends BaseEntity {
  public readonly interpreter_profile_id: string
  public readonly interpreter_profile?: InterpreterProfileEntity

  public readonly amount: number
  public readonly currency: string
  public readonly status: PayoutStatus

  public readonly iban: string
  public readonly bank_name?: string

  public readonly reference?: string
  public readonly processed_at?: Date

  constructor(
    props: PayoutProps & {
      interpreter_profile?: InterpreterProfileEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.interpreter_profile_id = props.interpreter_profile_id
    this.interpreter_profile = props.interpreter_profile
    this.amount = props.amount
    this.currency = props.currency
    this.status = props.status
    this.iban = props.iban
    this.bank_name = props.bank_name
    this.reference = props.reference
    this.processed_at = props.processed_at
  }
}
