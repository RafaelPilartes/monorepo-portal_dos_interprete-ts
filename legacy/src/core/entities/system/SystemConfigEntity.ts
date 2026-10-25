import { BaseEntity } from '../base/BaseEntity'
import { SystemConfigProps } from '@/type/database'
import { UserEntity } from '../identity/UserEntity'

export class SystemConfigEntity extends BaseEntity {
  public readonly key: string
  public readonly value: string
  public readonly value_type: 'string' | 'number' | 'boolean' | 'json'

  public readonly label: string
  public readonly description?: string
  public readonly group: string

  public readonly is_public: boolean

  public readonly updated_by_user_id?: string
  public readonly updated_by_user?: UserEntity

  constructor(
    props: SystemConfigProps & {
      updated_by_user?: UserEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.key = props.key
    this.value = props.value
    this.value_type = props.value_type
    this.label = props.label
    this.description = props.description
    this.group = props.group
    this.is_public = props.is_public
    this.updated_by_user_id = props.updated_by_user_id
    this.updated_by_user = props.updated_by_user
  }
}
