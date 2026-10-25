export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
  BOOKING_UPDATE = 'booking_update'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_USER = 'waiting_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  COMPLAINT = 'complaint',
  SUGGESTION = 'suggestion',
  OTHER = 'other'
}

export enum DocumentType {
  ID_CARD = 'id_card',
  CRIMINAL_RECORD = 'criminal_record',
  CERTIFICATE = 'certificate',
  OTHER = 'other'
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum VerificationType {
  FREE = 'free',
  PAID = 'paid'
}

export enum InterpreterPortfolioType {
  PRESENTATION = 'apresentacao',
  WORK_SAMPLE = 'trabalho',
  LECTURE = 'palestra',
  CLASS = 'aula'
}
