import { OpportunityType, OpportunityStatus, PartnershipType, LegalResourceType } from '@/type/enum'

export interface ServiceProps {
  id: string
  title: string
  description: string
  base_price?: number
  icon?: string
  is_active: boolean
  created_at?: Date
  updated_at?: Date
}

export interface LanguageProps {
  id: string
  name: string
  code: string
  is_sign_language: boolean
  created_at?: Date
  updated_at?: Date
}

export interface SpecialtyProps {
  id: string
  name: string
  slug: string
  description?: string
  created_at?: Date
  updated_at?: Date
}

export interface OpportunityProps {
  id: string
  title: string
  description: string
  requirements?: string

  type: OpportunityType
  status: OpportunityStatus

  location?: string
  is_remote: boolean
  languages_required?: string[]
  specialties_required?: string[]

  remuneration?: number
  currency?: string

  deadline?: Date
  posted_by_user_id?: string
  posted_by_partner_id?: string

  created_at?: Date
  updated_at?: Date
}

export interface PartnershipProps {
  id: string
  name: string
  description: string
  type: PartnershipType

  logo_url?: string
  website_url?: string
  contact_email?: string

  discount_percentage?: number
  benefit_description?: string

  is_active: boolean
  start_date?: Date
  end_date?: Date

  created_at?: Date
  updated_at?: Date
}

export interface LegalResourceProps {
  id: string
  title: string
  content: string
  type: LegalResourceType

  category?: string
  file_url?: string
  is_published: boolean

  author_user_id: string
  created_at?: Date
  updated_at?: Date
}
