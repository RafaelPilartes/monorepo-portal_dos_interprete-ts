import { BaseEntity } from '../base/BaseEntity'
import { InterpreterEducationProps } from '@/type/database'

export class InterpreterEducationEntity extends BaseEntity {
  public readonly interpreter_profile_id: string
  public readonly institution: string
  public readonly degree: string
  public readonly start_date?: Date
  public readonly end_date?: Date
  public readonly graduation_year?: string
  public readonly description?: string
  public readonly certificate_url?: string

  constructor(props: InterpreterEducationProps) {
    super(props.id, props.created_at, props.updated_at)
    this.interpreter_profile_id = props.interpreter_profile_id
    this.institution = props.institution
    this.degree = props.degree
    this.start_date = props.start_date
    this.end_date = props.end_date
    this.graduation_year = props.graduation_year
    this.description = props.description
    this.certificate_url = props.certificate_url
  }
}
