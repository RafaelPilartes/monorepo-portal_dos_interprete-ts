import { BaseEntity } from '../base/BaseEntity'
import { InterpreterServiceProps } from '@/type/database'

export class InterpreterServiceEntity extends BaseEntity {
  public readonly interpreter_profile_id: string
  public readonly name: string
  public readonly description: string
  public readonly base_price: number
  public readonly is_active: boolean

  constructor(props: InterpreterServiceProps) {
    super(props.id, props.created_at, props.updated_at)
    this.interpreter_profile_id = props.interpreter_profile_id
    this.name = props.name
    this.description = props.description
    this.base_price = props.base_price
    this.is_active = props.is_active
  }
}
