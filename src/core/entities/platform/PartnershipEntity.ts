import { BaseEntity } from '../base/BaseEntity'
import { PartnershipProps } from '@/type/database'
import { PartnershipType } from '@/type/enum'

export class PartnershipEntity extends BaseEntity {
  public readonly name: string
  public readonly description: string
  public readonly type: PartnershipType

  public readonly logo_url?: string
  public readonly website_url?: string
  public readonly contact_email?: string

  public readonly discount_percentage?: number
  public readonly benefit_description?: string

  public readonly is_active: boolean
  public readonly start_date?: Date
  public readonly end_date?: Date

  constructor(props: PartnershipProps) {
    super(props.id, props.created_at, props.updated_at)
    this.name = props.name
    this.description = props.description
    this.type = props.type
    this.logo_url = props.logo_url
    this.website_url = props.website_url
    this.contact_email = props.contact_email
    this.discount_percentage = props.discount_percentage
    this.benefit_description = props.benefit_description
    this.is_active = props.is_active
    this.start_date = props.start_date
    this.end_date = props.end_date
  }
}
