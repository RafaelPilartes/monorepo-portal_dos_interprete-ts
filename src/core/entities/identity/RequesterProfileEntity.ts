import { BaseEntity } from '../base/BaseEntity'
import { RequesterProfileProps } from '@/type/database'
import { UserEntity } from './UserEntity'

export class RequesterProfileEntity extends BaseEntity {
  public readonly user_id: string
  public readonly user?: UserEntity

  public readonly company_name?: string
  public readonly nif?: string
  public readonly address?: string
  public readonly phone_number?: string
  public readonly website?: string
  public readonly industry?: string

  public readonly is_active: boolean
  public readonly last_login_at?: Date

  constructor(props: RequesterProfileProps & { user?: UserEntity }) {
    super(props.id, props.created_at, props.updated_at)
    this.user_id = props.user_id
    this.user = props.user
    this.company_name = props.company_name
    this.nif = props.nif
    this.address = props.address
    this.phone_number = props.phone_number
    this.website = props.website
    this.industry = props.industry
    this.is_active = props.is_active
    this.last_login_at = props.last_login_at
  }
}
