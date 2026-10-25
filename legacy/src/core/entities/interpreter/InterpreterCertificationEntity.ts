import { BaseEntity } from '../base/BaseEntity'
import { InterpreterCertificationProps } from '@/type/database'

export class InterpreterCertificationEntity extends BaseEntity {
  public readonly interpreter_profile_id: string
  public readonly name: string
  public readonly issuer: string
  public readonly issue_date?: Date
  public readonly expiry_date?: Date
  public readonly credential_id?: string
  public readonly credential_url?: string

  constructor(props: InterpreterCertificationProps) {
    super(props.id, props.created_at, props.updated_at)
    this.interpreter_profile_id = props.interpreter_profile_id
    this.name = props.name
    this.issuer = props.issuer
    this.issue_date = props.issue_date
    this.expiry_date = props.expiry_date
    this.credential_id = props.credential_id
    this.credential_url = props.credential_url
  }
}
