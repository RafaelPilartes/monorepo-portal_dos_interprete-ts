// What the person reads about requests and notices (data-model.md §5, notifications.md). One
// vocabulary for every app: the status badges, the lists and the bell read it from here.

/** The status of a request (booking.requests.status). */
export const REQUEST_STATUS_LABELS = {
  awaiting_approval: 'Aguarda aprovação',
  quoting: 'Em orçamento',
  awaiting_interpreters: 'À espera de intérpretes',
  awaiting_payment: 'Aguarda pagamento',
  payment_review: 'Pagamento em validação',
  confirmed: 'Confirmado',
  delivered: 'Realizado',
  disputed: 'Em disputa',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  expired: 'Expirado',
} as const

/** The status of an interpreter in a request (booking.request_assignments.status). */
export const ASSIGNMENT_STATUS_LABELS = {
  invited: 'Convidado',
  applied: 'Candidato',
  accepted: 'Aceite',
  declined: 'Recusou',
  expired: 'Expirou',
  not_selected: 'Não seleccionado',
  withdrawn: 'Desistiu',
  cancelled: 'Cancelado',
  delivered: 'Realizado',
  disputed: 'Em disputa',
  completed: 'Concluído',
} as const

export const REQUEST_KIND_LABELS = {
  direct: 'Directo',
  open: 'Aberto',
  managed: 'Gerido pela plataforma',
} as const

export const MODALITY_TEXT = { online: 'Online', in_person: 'Presencial' } as const

type Payload = Record<string, unknown>
const text = (value: unknown): string => (typeof value === 'string' ? value : '')

/**
 * The title and the line of a notice in the bell, by its kind and payload (R-NOT-01; the emails
 * have their own texts in the API). A kind without a text here shows a neutral line.
 */
export function notificationText(kind: string, payload: Payload): { title: string; body: string } {
  const request = text(payload.code) ? `${text(payload.code)} · ${text(payload.service)}` : text(payload.service)
  const who = text(payload.interpreter_name) || 'Um intérprete'
  switch (kind) {
    case 'request_invited': return { title: 'Novo convite para um serviço', body: request }
    case 'request_invite_expired': return { title: 'Um convite expirou', body: `${who} não respondeu a tempo. ${request}` }
    case 'request_accepted': return { title: `${who} aceitou o pedido`, body: request }
    case 'request_declined': return { title: `${who} recusou o pedido`, body: text(payload.reason) ? `Motivo: ${text(payload.reason)}` : request }
    case 'request_confirmed': return { title: 'Pedido confirmado', body: request }
    case 'request_understaffed_warning': return { title: 'Ainda faltam intérpretes', body: `${request}. Convida mais ou segue com os que tens.` }
    case 'request_expired': return { title: 'O pedido expirou', body: `Não houve intérpretes suficientes a tempo. ${request}` }
    case 'meeting_link_changed': return { title: 'O link da reunião mudou', body: request }
    case 'org_invite_accepted': return { title: 'Um convite foi aceite', body: text(payload.organization_name) }
    case 'content_removed': return { title: 'A equipa removeu um conteúdo teu', body: text(payload.reason) ? `Motivo: ${text(payload.reason)}` : text(payload.title) }
    default: return { title: 'Nova notificação', body: '' }
  }
}

export const NOTIFICATION_TEXTS = {
  bellLabel: (unread: number): string => (unread === 0 ? 'Notificações' : `Notificações, ${unread} por ler`),
  markAllRead: 'Marcar todas como lidas',
  seeAll: 'Ver todas',
  empty: 'Não tens notificações.',
  pageTitle: 'Notificações',
} as const
