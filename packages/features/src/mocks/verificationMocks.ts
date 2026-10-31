export type RequestStatus = "pending" | "approved" | "rejected" | "expired"
export type VerificationStatus = "active" | "pending" | "expired" | "rejected" | "suspended"
export type HistoryStatus = "approved" | "rejected" | "expired" | "suspended"

export interface VerificationRequest {
  id: string
  interpreter_name?: string // Optional para reuso
  interpreter_email?: string
  request_date: string
  amount: number
  status: RequestStatus | VerificationStatus | HistoryStatus
  plan: string
  payment_proof?: string
  admin_message?: string
  approved_at?: string
  rejected_at?: string
  expires_at?: string
  interpreter_photo?: string
  interpreter_phone?: string
  previous_verifications?: number
  last_verification_date?: string
  expiration_date?: string
  notes?: string
}

export interface VerificationHistoryItem {
  id: string
  interpreter_name: string
  interpreter_email: string
  interpreter_photo: string
  plan: string
  amount: number
  status: HistoryStatus
  request_date: string
  processed_date: string
  processed_by: string
  expiration_date?: string
  notes?: string
}

export interface InterpreterVerification {
  id: string
  name: string
  email: string
  photo: string
  status: VerificationStatus
  last_payment_date?: string
  last_payment_amount?: number
  expiration_date?: string
  request_date?: string
  payment_proof?: string
}

export const mockVerificationRequests: VerificationRequest[] = [
  {
    id: "VR-2024-015",
    interpreter_name: "João Silva",
    interpreter_email: "joao.silva@email.com",
    plan: "Verificação Profissional",
    amount: 15000,
    status: "pending",
    request_date: "2024-01-15T10:30:00",
    payment_proof: "comprovativo_joao.pdf",
    interpreter_photo: "/placeholder.svg",
    interpreter_phone: "+244 923 456 789",
    previous_verifications: 2,
    last_verification_date: "2023-01-15",
    expiration_date: "2024-01-15",
    notes: "Tudo em ordem",
  },
  {
    id: "VR-2024-014",
    interpreter_name: "Maria Santos",
    interpreter_email: "maria.santos@email.com",
    plan: "Verificação Profissional",
    amount: 15000,
    status: "pending",
    request_date: "2024-01-14T15:45:00",
    payment_proof: "comprovativo_maria.pdf",
    interpreter_photo: "/placeholder.svg",
    previous_verifications: 0,
  },
]

export const mockHistory: VerificationHistoryItem[] = [
  {
    id: "VR-2024-013",
    interpreter_name: "Ana Costa",
    interpreter_email: "ana.costa@email.com",
    interpreter_photo: "/placeholder.svg",
    plan: "Verificação Profissional",
    amount: 15000,
    status: "approved",
    request_date: "2024-01-10T11:00:00",
    processed_date: "2024-01-11T14:30:00",
    processed_by: "Admin João",
    expiration_date: "2024-02-11",
  },
  {
    id: "VR-2024-010",
    interpreter_name: "Pedro Fernandes",
    interpreter_email: "pedro.fernandes@email.com",
    interpreter_photo: "/placeholder.svg",
    plan: "Verificação Profissional",
    amount: 15000,
    status: "rejected",
    request_date: "2024-01-05T08:00:00",
    processed_date: "2024-01-05T16:00:00",
    processed_by: "Admin Maria",
    notes: "Comprovativo ilegível",
  },
  {
    id: "VR-2023-050",
    interpreter_name: "Carla Mendes",
    interpreter_email: "carla.mendes@email.com",
    interpreter_photo: "/placeholder.svg",
    plan: "Verificação Profissional",
    amount: 15000,
    status: "expired",
    request_date: "2023-12-01T14:00:00",
    processed_date: "2023-12-02T10:00:00",
    processed_by: "Admin João",
    expiration_date: "2024-01-02",
  },
]

export const mockInterpreterVerifications: InterpreterVerification[] = [
  {
    id: "1",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    photo: "/placeholder.svg",
    status: "active",
    last_payment_date: "2024-01-05",
    last_payment_amount: 15000,
    expiration_date: "2024-02-05",
  },
  {
    id: "2",
    name: "João Silva",
    email: "joao.silva@email.com",
    photo: "/placeholder.svg",
    status: "pending",
    request_date: "2024-01-10",
    last_payment_amount: 15000,
    payment_proof: "comprovativo.pdf",
  },
  {
    id: "3",
    name: "Ana Costa",
    email: "ana.costa@email.com",
    photo: "/placeholder.svg",
    status: "expired",
    last_payment_date: "2023-11-15",
    expiration_date: "2023-12-15",
  },
  {
    id: "4",
    name: "Pedro Fernandes",
    email: "pedro.fernandes@email.com",
    photo: "/placeholder.svg",
    status: "suspended",
    last_payment_date: "2023-12-01",
  },
]

export const mockRequestsForInterpreter: VerificationRequest[] = [
  {
    id: "VR-2024-001",
    request_date: "2024-01-15T10:30:00",
    amount: 15000,
    status: "approved",
    plan: "Verificação Profissional",
    payment_proof: "comprovativo_janeiro.pdf",
    approved_at: "2024-01-16T14:00:00",
    expires_at: "2024-02-15",
  },
  {
    id: "VR-2024-002",
    request_date: "2024-01-10T09:00:00",
    amount: 15000,
    status: "pending",
    plan: "Verificação Profissional",
    payment_proof: "comprovativo_renovacao.pdf",
  },
  {
    id: "VR-2023-012",
    request_date: "2023-12-05T11:00:00",
    amount: 15000,
    status: "approved",
    plan: "Verificação Profissional",
    payment_proof: "comprovativo_dezembro.pdf",
    approved_at: "2023-12-06T16:30:00",
    expires_at: "2024-01-05",
  },
  {
    id: "VR-2023-008",
    request_date: "2023-08-20T08:00:00",
    amount: 15000,
    status: "rejected",
    plan: "Verificação Profissional",
    payment_proof: "comprovativo_agosto.pdf",
    rejected_at: "2023-08-21T10:00:00",
    admin_message: "O comprovativo de pagamento está ilegível. Por favor, envie uma versão mais clara.",
  },
]
