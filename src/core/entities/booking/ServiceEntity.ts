import { BaseEntity } from '../base/BaseEntity'
import { ServiceProps } from '@/type/database'

export class ServiceEntity extends BaseEntity {
  public readonly title: string
  public readonly description: string
  public readonly base_price?: number
  public readonly icon?: string
  public readonly is_active: boolean

  constructor(props: ServiceProps) {
    super(props.id, props.created_at, props.updated_at)
    this.title = props.title
    this.description = props.description
    this.base_price = props.base_price
    this.icon = props.icon
    this.is_active = props.is_active
  }
}
