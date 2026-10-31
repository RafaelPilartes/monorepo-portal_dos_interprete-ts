import { translatePostgrestError, type ApiClient, type createSupabaseClient } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'

type SupabaseClient = ReturnType<typeof createSupabaseClient>

// Requests for the screens (requests-core.md, requests-direct.md): reads by RLS through the
// booking views, which hide what each person may not see (R-REQ-07, D-95); writes through the
// API, where booking.* owns every rule; chat messages and read marks written directly.

export type RequestRow = Tables<{ schema: 'booking' }, 'request_details'>
export type AssignmentRow = Tables<{ schema: 'booking' }, 'assignment_details'>
export type MyAssignmentRow = Tables<{ schema: 'booking' }, 'my_assignments'>
export type TimelineRow = Tables<{ schema: 'booking' }, 'request_timeline'>
export type MessageRow = Tables<{ schema: 'booking' }, 'messages'>

/** What booking.preview_request_total answers (R-REQ-02): never computed by a screen. */
export interface RequestPreview {
  lines: { interpreter_id: string; price_aoa: number; travel_fee_aoa: number }[]
  total_aoa: number
}

export interface NewRequest {
  kind: 'direct'
  organization_id?: string | undefined
  service_id: string
  language_ids: string[]
  modality: 'online' | 'in_person'
  starts_at: string
  duration_minutes: number
  interpreters_needed: number
  meeting_link?: string | undefined
  address?: string | undefined
  city?: string | undefined
  notes?: string | undefined
  beneficiary_name?: string | undefined
  beneficiary_contact?: string | undefined
  interpreter_ids: string[]
  expected_total_aoa: number
}

/** The statuses that end a request (data-model.md §5): /history lists these, /requests the rest. */
export const FINAL_REQUEST_STATUSES = ['completed', 'cancelled', 'expired'] as const

export class RequestsRepository {
  constructor(private readonly client: SupabaseClient, private readonly api: ApiClient) {}

  private booking(table: string) {
    return this.client.schema('booking').from(table)
  }

  private async rows<T>(request: PromiseLike<{ data: unknown; error: { code: string; message: string; hint?: string | null } | null }>, where: string): Promise<T[]> {
    const { data, error } = await request
    if (error) throw translatePostgrestError(error, where)
    return (data ?? []) as T[]
  }

  /**
   * /requests and /history, paginated: in an organisation's context its requests (all of them, or
   * only the ones the person created); as a private person, the person's own requests without an
   * organisation (R-REQ-07: every active member sees the organisation's requests).
   */
  async list(query: { finished: boolean; accountId: string; organizationId: string | null; mineOnly: boolean; limit: number; offset: number }): Promise<{ rows: RequestRow[]; total: number }> {
    const finals = `(${FINAL_REQUEST_STATUSES.join(',')})`
    let request = this.booking('request_details').select('*', { count: 'exact' })
    request = query.finished ? request.in('status', [...FINAL_REQUEST_STATUSES]) : request.not('status', 'in', finals)
    request = query.organizationId ? request.eq('organization_id', query.organizationId) : request.is('organization_id', null).eq('created_by', query.accountId)
    if (query.organizationId && query.mineOnly) request = request.eq('created_by', query.accountId)
    const { data, error, count } = await request.order('starts_at', { ascending: !query.finished }).range(query.offset, query.offset + query.limit - 1)
    if (error) throw translatePostgrestError(error, 'booking.request_details')
    return { rows: (data ?? []) as RequestRow[], total: count ?? 0 }
  }

  async request(id: string): Promise<RequestRow | null> {
    const rows = await this.rows<RequestRow>(this.booking('request_details').select('*').eq('id', id), 'booking.request_details')
    return rows[0] ?? null
  }

  async assignments(requestId: string): Promise<AssignmentRow[]> {
    return this.rows<AssignmentRow>(this.booking('assignment_details').select('*').eq('request_id', requestId).order('created_at'), 'booking.assignment_details')
  }

  async timeline(requestId: string): Promise<TimelineRow[]> {
    return this.rows<TimelineRow>(this.booking('request_timeline').select('*').eq('request_id', requestId).order('at'), 'booking.request_timeline')
  }

  /** interpreter-web /requests. */
  async myAssignments(): Promise<MyAssignmentRow[]> {
    return this.rows<MyAssignmentRow>(this.booking('my_assignments').select('*').order('starts_at'), 'booking.my_assignments')
  }

  // Chat (R-REQ-08) --------------------------------------------------------------------------
  async messages(threadId: string): Promise<MessageRow[]> {
    return this.rows<MessageRow>(this.booking('messages').select('*').eq('thread_id', threadId).order('created_at'), 'booking.messages')
  }

  async send(threadId: string, accountId: string, body: string): Promise<void> {
    const { error } = await this.booking('messages').insert({ thread_id: threadId, sender_account: accountId, body })
    if (error) throw translatePostgrestError(error, 'booking.messages')
  }

  async markThreadRead(threadId: string, accountId: string): Promise<void> {
    const { error } = await this.booking('thread_reads')
      .upsert({ thread_id: threadId, account_id: accountId, last_read_at: new Date().toISOString() }, { onConflict: 'thread_id,account_id' })
    if (error) throw translatePostgrestError(error, 'booking.thread_reads')
  }

  // Writes through the API ---------------------------------------------------------------------
  preview(input: Pick<NewRequest, 'service_id' | 'duration_minutes' | 'modality' | 'interpreter_ids'>): Promise<RequestPreview> {
    return this.api.post<RequestPreview>('/requests/preview', input)
  }

  create(input: NewRequest): Promise<{ id: string; code: string }> {
    return this.api.post<{ id: string; code: string }>('/requests', input)
  }

  invite(requestId: string, interpreterId: string): Promise<unknown> {
    return this.api.post(`/requests/${requestId}/invites`, { interpreter_id: interpreterId })
  }

  reduce(requestId: string, needed: number): Promise<unknown> {
    return this.api.post(`/requests/${requestId}/reduce`, { interpreters_needed: needed })
  }

  updateMeetingLink(requestId: string, link: string): Promise<unknown> {
    return this.api.patch(`/requests/${requestId}/meeting-link`, { meeting_link: link })
  }

  accept(assignmentId: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/accept`, {})
  }

  decline(assignmentId: string, reason: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/decline`, { reason })
  }
}
