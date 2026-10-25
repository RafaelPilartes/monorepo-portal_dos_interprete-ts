import { BaseEntity } from '../base/BaseEntity'
import { SpecialtyProps } from '@/type/database'

export class SpecialtyEntity extends BaseEntity {
  public readonly name: string
  public readonly slug: string
  public readonly description?: string

  constructor(props: SpecialtyProps) {
    super(props.id, props.created_at, props.updated_at)
    this.name = props.name
    this.slug = props.slug
    this.description = props.description
  }
}
