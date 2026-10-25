import { BaseEntity } from '../base/BaseEntity'
import { OpportunityProps } from '@/type/database'
import { OpportunityType, OpportunityStatus } from '@/type/enum'
import { UserEntity } from '../identity/UserEntity'
import { PartnershipEntity } from './PartnershipEntity'

export class OpportunityEntity extends BaseEntity {
  public readonly title: string
  public readonly description: string
  public readonly requirements?: string

  public readonly type: OpportunityType
  public readonly status: OpportunityStatus

  public readonly location?: string
  public readonly is_remote: boolean
  public readonly languages_required?: string[]
  public readonly specialties_required?: string[]

  public readonly remuneration?: number
  public readonly currency?: string

  public readonly deadline?: Date

  public readonly posted_by_user_id?: string
  public readonly posted_by_user?: UserEntity

  public readonly posted_by_partner_id?: string
  public readonly posted_by_partner?: PartnershipEntity

  constructor(
    props: OpportunityProps & {
      posted_by_user?: UserEntity
      posted_by_partner?: PartnershipEntity
    }
  ) {
    super(props.id, props.created_at, props.updated_at)
    this.title = props.title
    this.description = props.description
    this.requirements = props.requirements
    this.type = props.type
    this.status = props.status
    this.location = props.location
    this.is_remote = props.is_remote
    this.languages_required = props.languages_required
    this.specialties_required = props.specialties_required
    this.remuneration = props.remuneration
    this.currency = props.currency
    this.deadline = props.deadline
    this.posted_by_user_id = props.posted_by_user_id
    this.posted_by_user = props.posted_by_user
    this.posted_by_partner_id = props.posted_by_partner_id
    this.posted_by_partner = props.posted_by_partner
  }
}
