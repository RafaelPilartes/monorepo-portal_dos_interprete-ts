import { PaymentStatus, PaymentMethod, PayoutStatus } from '@/type/enum'

export interface PaymentProps {
  id: string
  booking_id: string
  requester_profile_id: string

  amount: number
  currency: string
  status: PaymentStatus
  method: PaymentMethod

  provider_transaction_id?: string
  receipt_url?: string
  created_at?: Date
  updated_at?: Date
}

export interface PayoutProps {
  id: string
  interpreter_profile_id: string
  amount: number
  currency: string
  status: PayoutStatus

  iban: string
  bank_name?: string

  reference?: string
  processed_at?: Date
  created_at?: Date
  updated_at?: Date
}
