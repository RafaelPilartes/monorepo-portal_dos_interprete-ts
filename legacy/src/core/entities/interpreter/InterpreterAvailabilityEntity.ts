import { BaseEntity } from '../base/BaseEntity'
import { InterpreterAvailabilityProps } from '@/type/database'

export class InterpreterAvailabilityEntity extends BaseEntity {
  public readonly interpreter_id: string

  public readonly day_of_week?: number
  public readonly start_time: string
  public readonly end_time: string

  public readonly specific_date?: Date
  public readonly is_unavailable?: boolean

  constructor(props: InterpreterAvailabilityProps) {
    super(props.id, props.created_at, props.updated_at)
    this.interpreter_id = props.interpreter_id
    this.day_of_week = props.day_of_week
    this.start_time = props.start_time
    this.end_time = props.end_time
    this.specific_date = props.specific_date
    this.is_unavailable = props.is_unavailable
  }
}
