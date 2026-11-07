// The payment vocabulary the person reads (payments.md "Ecrãs"). Keys are the database values.

export const PAYMENT_STATUS_LABELS = {
  awaiting_proof: 'À espera do comprovativo',
  proof_submitted: 'Comprovativo em análise',
  confirmed: 'Pago',
  cancelled: 'Cancelado',
  expired: 'Expirou',
} as const

export const PROOF_STATUS_LABELS = { pending: 'Por validar', accepted: 'Aceite', rejected: 'Recusado' } as const
export const REFUND_STATUS_LABELS = { pending: 'Por pagar', paid: 'Pago' } as const
export const PAYOUT_STATUS_LABELS = { queued: 'Em fila', paid: 'Pago', cancelled: 'Cancelado' } as const

export const PAYMENT_CONTEXT_LABELS = {
  managed_request: 'Pedido gerido',
  verification: 'Verificação',
  event_registration: 'Inscrição em evento',
} as const

export const REFUND_REASON_LABELS = {
  managed_cancel_early: 'Cancelamento com antecedência',
  managed_cancel_late: 'Cancelamento tardio',
  managed_reduce: 'Menos intérpretes',
  provider_failure: 'Serviço não prestado',
  suspension: 'Suspensão',
  dispute: 'Disputa',
  verification_rejected: 'Verificação recusada',
  event_cancelled: 'Evento cancelado',
  event_cancel_early: 'Inscrição cancelada',
  manual: 'Manual',
} as const
