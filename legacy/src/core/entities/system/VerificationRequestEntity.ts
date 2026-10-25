import { BaseEntity } from '../base/BaseEntity'
import { VerificationRequestProps } from '@/type/database'
import { VerificationType, VerificationStatus } from '@/type/enum'
import { InterpreterProfileEntity } from '../identity/InterpreterProfileEntity'
import { AdminProfileEntity } from '../identity/AdminProfileEntity'
import { PaymentEntity } from '../financial/PaymentEntity'

export class VerificationRequestEntity extends BaseEntity {
  public readonly interpreter_id: string
  public readonly interpreter?: InterpreterProfileEntity

  public readonly type: VerificationType
  public readonly status: VerificationStatus

  public readonly document_ids: string[]

  public readonly admin_reviewer_id?: string
  public readonly admin_reviewer?: AdminProfileEntity

  public readonly admin_notes?: string
  public readonly reviewed_at?: Date

  public readonly payment_id?: string
  public readonly payment?: PaymentEntity

  public readonly amount?: number
  public readonly submitted_at: Date

  constructor(
    props: VerificationRequestProps & {
      interpreter?: InterpreterProfileEntity
      admin_reviewer?: AdminProfileEntity
      payment?: PaymentEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.interpreter_id = props.interpreter_id
    this.interpreter = props.interpreter
    this.type = props.type
    this.status = props.status
    this.document_ids = props.document_ids
    this.admin_reviewer_id = props.admin_reviewer_id
    this.admin_reviewer = props.admin_reviewer
    this.admin_notes = props.admin_notes
    this.reviewed_at = props.reviewed_at
    this.payment_id = props.payment_id
    this.payment = props.payment
    this.amount = props.amount
    this.submitted_at = props.submitted_at
  }
}
