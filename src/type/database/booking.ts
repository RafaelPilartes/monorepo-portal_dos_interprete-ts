import { BookingStatus } from '@/type/enum'

export interface BookingProps {
  id: string
  requester_profile_id: string
  interpreter_profile_id?: string

  service_id?: string

  status: BookingStatus

  scheduled_date: Date
  duration_minutes: number

  total_amount: number
  currency: string

  location_type: 'online' | 'presencial'
  meeting_link?: string
  address?: string

  notes?: string

  created_at?: Date
  updated_at?: Date
}

export interface BookingLogProps {
  id: string
  booking_id: string
  old_status?: BookingStatus
  new_status: BookingStatus
  changed_by_user_id: string
  reason?: string
  created_at?: Date
  updated_at?: Date
}

export interface ChatMessageProps {
  id: string
  booking_id: string
  sender_id: string
  content: string

  read_at?: Date

  attachment_url?: string
  attachment_type?: 'image' | 'file'
  created_at?: Date
  updated_at?: Date
}

export interface ReviewProps {
  id: string
  booking_id: string
  author_id: string

  author_interpreter_id?: string
  author_requester_id?: string
  target_interpreter_id?: string
  target_requester_id?: string

  rating: number
  comment?: string

  is_visible: boolean
  created_at?: Date
  updated_at?: Date
}

export interface FavoriteProps {
  id: string
  requester_profile_id: string
  interpreter_profile_id: string
  created_at?: Date
}
