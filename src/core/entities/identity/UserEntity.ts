import { BaseEntity } from '../base/BaseEntity'
import { UserProps } from '@/type/database'
import { UserRole } from '@/type/enum'

export class UserEntity extends BaseEntity {
  public readonly avatar_url?: string
  public readonly name: string
  public readonly email: string
  public readonly phone: string
  public readonly gender: string
  public readonly birth_date: string
  public readonly role?: UserRole

  constructor(props: UserProps) {
    super(props.id, props.created_at, props.updated_at)
    this.avatar_url = props.avatar_url
    this.name = props.name
    this.email = props.email
    this.phone = props.phone
    this.gender = props.gender
    this.birth_date = props.birth_date
    this.role = props.role
  }
}
