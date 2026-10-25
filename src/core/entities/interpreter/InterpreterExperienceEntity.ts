import { BaseEntity } from '../base/BaseEntity'
import { InterpreterExperienceProps } from '@/type/database'

export class InterpreterExperienceEntity extends BaseEntity {
  public readonly role: string
  public readonly company: string
  public readonly period: string
  public readonly description?: string

  constructor(props: InterpreterExperienceProps) {
    super(props.id, props.created_at, props.updated_at)
    this.role = props.role
    this.company = props.company
    this.period = props.period
    this.description = props.description
  }
}
