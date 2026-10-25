import {
  AuditSeverity,
  NotificationType,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  DocumentType,
  VerificationStatus,
  VerificationType
} from '@/type/enum'

export interface AuditLogProps {
  id: string

  // Who
  user_id: string
  user_name: string
  user_email: string
  user_role?: string

  // What
  action: string
  module: string
  description: string
  severity: AuditSeverity

  // Target
  target_id: string
  target_type: string
  target_label: string

  // Change
  previous_data?: Record<string, unknown> | null
  new_data?: Record<string, unknown> | null
  changed_fields?: string[]

  // Context
  ip_address: string
  user_agent: string
  session_id: string
  location?: string

  // Outcome
  success: boolean
  error_message?: string | null

  created_at?: Date
}

export interface NotificationProps {
  id: string
  target_scope: 'interpreters' | 'requesters' | 'all' | 'admins'
  is_specific: boolean
  interpreter_profile_id?: string
  requester_profile_id?: string
  admin_profile_id?: string

  title: string
  message: string
  type: NotificationType

  metadata?: Record<string, any>
  action_url?: string
  created_at?: Date
  updated_at?: Date
}

export interface SupportTicketProps {
  id: string
  user_id: string
  assigned_user_id?: string

  subject: string
  description: string
  category: TicketCategory

  priority: TicketPriority
  status: TicketStatus

  resolution_notes?: string
  resolved_at?: Date

  created_at?: Date
  updated_at?: Date
}

export interface SystemConfigProps {
  id: string
  key: string
  value: string
  value_type: 'string' | 'number' | 'boolean' | 'json'

  label: string
  description?: string
  group: string

  is_public: boolean

  updated_by_user_id?: string
  created_at?: Date
  updated_at?: Date
}

export interface DocumentProps {
  id: string
  user_id: string
  type: DocumentType
  file_url: string
  file_name: string

  status: VerificationStatus
  admin_notes?: string
  reviewed_by_user_id?: string
  reviewed_at?: Date
  created_at?: Date
  updated_at?: Date
}

export interface VerificationRequestProps {
  id: string
  interpreter_id: string
  type: VerificationType

  status: VerificationStatus

  document_ids: string[]

  admin_reviewer_id?: string
  admin_notes?: string
  reviewed_at?: Date

  payment_id?: string
  amount?: number

  submitted_at: Date
  created_at?: Date
  updated_at?: Date
}
