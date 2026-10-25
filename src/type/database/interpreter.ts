import { InterpreterPortfolioType } from '@/type/enum'

export interface InterpreterAvailabilityProps {
  id: string
  interpreter_id: string

  day_of_week?: number
  start_time: string
  end_time: string

  specific_date?: Date
  is_unavailable?: boolean
  created_at?: Date
  updated_at?: Date
}

export interface InterpreterCertificationProps {
  id: string
  interpreter_profile_id: string
  name: string
  issuer: string
  issue_date?: Date
  expiry_date?: Date
  credential_id?: string
  credential_url?: string
  created_at?: Date
  updated_at?: Date
}

export interface InterpreterEducationProps {
  id: string
  interpreter_profile_id: string
  institution: string
  degree: string
  start_date?: Date
  end_date?: Date
  graduation_year?: string
  description?: string
  certificate_url?: string
  created_at?: Date
  updated_at?: Date
}

export interface InterpreterExperienceProps {
  id: string
  role: string
  company: string
  period: string
  description?: string
  created_at?: Date
  updated_at?: Date
}

export interface InterpreterPortfolioProps {
  id: string
  interpreter_profile_id: string
  title: string
  url: string
  type: InterpreterPortfolioType
  thumbnail_url?: string
  description?: string
  tags?: string[]
  created_at?: Date
  updated_at?: Date
}

export interface InterpreterServiceProps {
  id: string
  interpreter_profile_id: string
  name: string
  description: string
  base_price: number
  is_active: boolean
  created_at?: Date
  updated_at?: Date
}
