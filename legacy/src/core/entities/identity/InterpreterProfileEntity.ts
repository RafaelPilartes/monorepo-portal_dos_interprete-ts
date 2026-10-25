import { BaseEntity } from '../base/BaseEntity'
import { InterpreterProfileProps } from '@/type/database'
import { Modality } from '@/type/enum'
import { UserEntity } from './UserEntity'

export class InterpreterProfileEntity extends BaseEntity {
  public readonly user_id: string
  public readonly user?: UserEntity

  public readonly bio: string
  public readonly years_experience: number
  public readonly minimum_hourly_rate: number
  public readonly open_to_negotiation: boolean
  public readonly modality: Modality

  public readonly rating: number
  public readonly review_count: number
  public readonly verified: boolean

  public readonly languages: string[]
  public readonly specialty: string[]

  public readonly is_active: boolean
  public readonly last_login_at?: Date

  constructor(props: InterpreterProfileProps & { user?: UserEntity }) {
    super(props.id, props.created_at, props.updated_at)
    this.user_id = props.user_id
    this.user = props.user
    this.bio = props.bio
    this.years_experience = props.years_experience
    this.minimum_hourly_rate = props.minimum_hourly_rate
    this.open_to_negotiation = props.open_to_negotiation
    this.modality = props.modality
    this.rating = props.rating
    this.review_count = props.review_count
    this.verified = props.verified
    this.languages = props.languages
    this.specialty = props.specialty
    this.is_active = props.is_active
    this.last_login_at = props.last_login_at
  }
}
