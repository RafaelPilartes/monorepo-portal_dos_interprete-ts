import { IBAN_AO_PATTERN } from '@portal-dos-interpretes/core'
import { formatAoa } from '@portal-dos-interpretes/i18n'
import type { ConfigVersionRow } from '@/data/repositories'

// The configuration values of data-model.md §4, grouped by theme as /settings/config shows them
// (staff-and-config.md). `blocksProduction`: empty in production until the Academia decides
// (PC-02 margin, PC-03 fee, PC-06 bank details, decisions.md §10).

export type FieldKind = 'integer' | 'percent' | 'money' | 'boolean' | 'text' | 'iban'
export type ConfigField = keyof ConfigVersionRow & string

export interface FieldDefinition {
  field: ConfigField
  label: string
  kind: FieldKind
  unit?: string
  blocksProduction?: boolean
}

export interface FieldGroup {
  title: string
  fields: FieldDefinition[]
}

export const CONFIG_GROUPS: FieldGroup[] = [
  {
    title: 'Pedidos',
    fields: [
      { field: 'request_min_lead_minutes', label: 'Antecedência mínima de um pedido', kind: 'integer', unit: 'minutos' },
      { field: 'urgent_threshold_hours', label: 'Pedido urgente a menos de', kind: 'integer', unit: 'horas' },
      { field: 'max_interpreters_per_request', label: 'Máximo de intérpretes por pedido', kind: 'integer' },
      { field: 'two_interpreters_suggest_minutes', label: 'Sugerir dois intérpretes a partir de', kind: 'integer', unit: 'minutos' },
      { field: 'billing_minimum_minutes', label: 'Duração mínima cobrada', kind: 'integer', unit: 'minutos' },
      { field: 'billing_round_minutes', label: 'Arredondamento da duração', kind: 'integer', unit: 'minutos' },
      { field: 'invite_expiry_hours', label: 'Validade de um convite a intérprete', kind: 'integer', unit: 'horas' },
      { field: 'staffing_warning_hours', label: 'Aviso de pedido incompleto antes do início', kind: 'integer', unit: 'horas' },
      { field: 'overlap_buffer_minutes', label: 'Intervalo entre serviços do mesmo intérprete', kind: 'integer', unit: 'minutos' },
    ],
  },
  {
    title: 'Cancelamento e conclusão',
    fields: [
      { field: 'cancellation_free_until_hours', label: 'Cancelamento sem penalização até', kind: 'integer', unit: 'horas antes' },
      { field: 'completion_auto_confirm_hours', label: 'Confirmação automática da conclusão', kind: 'integer', unit: 'horas' },
      { field: 'chat_close_days', label: 'Fecho da conversa depois do serviço', kind: 'integer', unit: 'dias' },
    ],
  },
  {
    title: 'Avaliações',
    fields: [
      { field: 'review_window_days', label: 'Prazo para avaliar', kind: 'integer', unit: 'dias' },
      { field: 'review_reveal_days', label: 'Revelação das avaliações', kind: 'integer', unit: 'dias' },
    ],
  },
  {
    title: 'Gerido',
    fields: [
      { field: 'managed_interpreter_share_pct', label: 'Percentagem do intérprete', kind: 'percent', blocksProduction: true },
      { field: 'managed_payment_deadline_hours', label: 'Prazo de pagamento', kind: 'integer', unit: 'horas' },
      { field: 'managed_refund_full_until_hours', label: 'Reembolso total até', kind: 'integer', unit: 'horas antes' },
      { field: 'managed_refund_late_pct', label: 'Reembolso de um cancelamento tardio', kind: 'percent' },
    ],
  },
  {
    title: 'Verificação',
    fields: [
      { field: 'verification_fee_aoa', label: 'Taxa de verificação', kind: 'money', blocksProduction: true },
      { field: 'verification_validity_months', label: 'Validade do selo', kind: 'integer', unit: 'meses' },
      { field: 'verification_renewal_notice_days', label: 'Aviso de renovação', kind: 'integer', unit: 'dias antes' },
      { field: 'verification_refund_on_reject_pct', label: 'Reembolso de uma verificação recusada', kind: 'percent' },
      { field: 'verification_free_resubmissions', label: 'Novas submissões sem custo', kind: 'integer' },
      { field: 'verification_payment_deadline_days', label: 'Prazo de pagamento', kind: 'integer', unit: 'dias' },
    ],
  },
  {
    title: 'Eventos',
    fields: [
      { field: 'event_payment_deadline_hours', label: 'Prazo de pagamento', kind: 'integer', unit: 'horas' },
      { field: 'event_refund_until_hours', label: 'Reembolso até', kind: 'integer', unit: 'horas antes' },
    ],
  },
  {
    title: 'Impostos',
    fields: [
      { field: 'tax_rate_pct', label: 'Taxa de imposto', kind: 'percent' },
      { field: 'prices_include_tax', label: 'Os preços incluem o imposto', kind: 'boolean' },
    ],
  },
  {
    title: 'Dados bancários da Academia',
    fields: [
      { field: 'academia_bank_name', label: 'Banco', kind: 'text', blocksProduction: true },
      { field: 'academia_iban', label: 'IBAN', kind: 'iban', blocksProduction: true },
      { field: 'academia_beneficiary', label: 'Beneficiário', kind: 'text', blocksProduction: true },
    ],
  },
  {
    title: 'Outros',
    fields: [
      { field: 'content_reports_autohide_threshold', label: 'Denúncias para esconder um conteúdo', kind: 'integer' },
      { field: 'org_invite_expiry_days', label: 'Validade de um convite de organização', kind: 'integer', unit: 'dias' },
      { field: 'support_autoclose_days', label: 'Fecho automático de um ticket resolvido', kind: 'integer', unit: 'dias' },
      { field: 'mentorship_max_per_mentor', label: 'Mentorias por mentor', kind: 'integer' },
    ],
  },
]

export const ALL_FIELDS: FieldDefinition[] = CONFIG_GROUPS.flatMap((group) => group.fields)

export type FieldValue = number | boolean | string | null

/** Text in a form field → the value to send, or the reason it is not valid (Portuguese). */
export function parseFieldInput(definition: FieldDefinition, raw: string): { value: FieldValue } | { error: string } {
  const text = raw.trim()
  if (text === '') return { value: null }
  switch (definition.kind) {
    case 'integer':
    case 'money': {
      if (!/^\d+$/.test(text)) return { error: 'Indica um número inteiro, zero ou maior.' }
      const value = Number(text)
      return Number.isSafeInteger(value) ? { value } : { error: 'Número demasiado grande.' }
    }
    case 'percent': {
      const value = Number(text.replace(',', '.'))
      if (!Number.isFinite(value) || value < 0 || value > 100) return { error: 'Indica uma percentagem entre 0 e 100.' }
      return { value: Math.round(value * 100) / 100 }
    }
    case 'iban':
      return IBAN_AO_PATTERN.test(text.replace(/\s/g, '')) ? { value: text.replace(/\s/g, '') } : { error: 'IBAN inválido. Um IBAN angolano começa por AO06 e tem 25 caracteres.' }
    case 'text':
      return { value: text }
    case 'boolean':
      return { value: text === 'true' }
  }
}

export function displayValue(definition: FieldDefinition, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (definition.kind === 'boolean') return value ? 'Sim' : 'Não'
  if (definition.kind === 'percent') return `${String(Number(value)).replace('.', ',')} %`
  if (definition.kind === 'money') return Number.isSafeInteger(Number(value)) ? formatAoa(Number(value)) : String(value)
  return definition.unit ? `${String(value)} ${definition.unit}` : String(value)
}

/** A value as compared: numbers by value (the API may send 80 or "80.00" for the same numeric). */
function comparable(definition: FieldDefinition, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (definition.kind === 'integer' || definition.kind === 'money' || definition.kind === 'percent') return String(Number(value))
  return String(value)
}

/** The fields whose value differs between two versions. */
export function differences(from: ConfigVersionRow | null, to: ConfigVersionRow): FieldDefinition[] {
  return ALL_FIELDS.filter((definition) => comparable(definition, from?.[definition.field]) !== comparable(definition, to[definition.field]))
}
