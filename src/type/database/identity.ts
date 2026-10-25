import { AdminPermissionLevel, Modality, UserRole } from '@/type/enum'

export interface UserProps {
  id: string
  avatar_url?: string
  name: string
  email: string
  phone: string
  gender: string
  birth_date: string
  role?: UserRole
  created_at?: Date
  updated_at?: Date
}

export interface AdminProfileProps {
  id: string
  user_id: string
  permission_level: AdminPermissionLevel
  department?: string
  is_active: boolean
  last_login_at?: Date
  created_at?: Date
  updated_at?: Date
}

export interface RequesterProfileProps {
  id: string
  user_id: string

  company_name?: string
  nif?: string
  address?: string
  phone_number?: string
  website?: string
  industry?: string

  is_active: boolean
  last_login_at?: Date
  created_at?: Date
  updated_at?: Date
}

export interface InterpreterProfileProps {
  id: string
  user_id: string

  bio: string
  primary_specialty: string
  years_experience: number

  modality: Modality
  minimum_hourly_rate: number
  open_to_negotiation: boolean
  accept_open_requests: boolean

  languages: string[]
  specialty: string[]

  rating: number
  review_count: number
  verified: boolean

  is_active: boolean
  last_login_at?: Date
  created_at?: Date
  updated_at?: Date
}
