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
export type ProposalRow = Tables<{ schema: 'booking' }, 'proposal_details'>

/** What booking.preview_request_total answers (R-REQ-02): never computed by a screen. */
export interface RequestPreview {
  lines: { interpreter_id: string; price_aoa: number; travel_fee_aoa: number }[]
  total_aoa: number
}

export type OpenRequestRow = Tables<{ schema: 'booking' }, 'open_requests_for_me'>
export type DisputeRow = Tables<{ schema: 'booking' }, 'dispute_details'>
export type ReviewRow = Tables<{ schema: 'booking' }, 'review_details'>
export type ReviewToDoRow = Tables<{ schema: 'booking' }, 'reviews_to_do'>
export interface Rating { average: number | null; count: number }

/** Which reviews to read (R-REV-03 decides what the person may see). */
export type ReviewQuery = { authorId: string } | { targetId: string; role: 'requester' | 'interpreter' } | { requestId: string }

export interface NewRequest {
  kind: 'direct' | 'open'
  open_mode?: 'first_accept' | 'requester_chooses' | undefined
  budget_per_interpreter_aoa?: number | undefined
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

  /** The price proposals of a thread (negotiation.md), shown among the messages. */
  async proposals(threadId: string): Promise<ProposalRow[]> {
    return this.rows<ProposalRow>(this.booking('proposal_details').select('*').eq('thread_id', threadId).order('created_at'), 'booking.proposal_details')
  }

  propose(threadId: string, amount: number): Promise<unknown> {
    return this.api.post(`/threads/${threadId}/proposals`, { amount_aoa: amount })
  }

  answerProposal(proposalId: string, accept: boolean): Promise<unknown> {
    return this.api.post(`/proposals/${proposalId}/${accept ? 'accept' : 'reject'}`, {})
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
  /** interpreter-web /open-requests (R-OPN-01). */
  async openForMe(): Promise<OpenRequestRow[]> {
    return this.rows<OpenRequestRow>(this.booking('open_requests_for_me').select('*'), 'booking.open_requests_for_me')
  }

  acceptOpen(requestId: string): Promise<unknown> {
    return this.api.post(`/requests/${requestId}/accept`, {})
  }

  apply(requestId: string, message: string): Promise<unknown> {
    return this.api.post(`/requests/${requestId}/applications`, message ? { message } : {})
  }

  select(requestId: string, assignmentId: string): Promise<unknown> {
    return this.api.post(`/requests/${requestId}/select`, { assignment_id: assignmentId })
  }

  withdraw(assignmentId: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/withdraw`, {})
  }

  preview(input: Pick<NewRequest, 'kind' | 'open_mode' | 'budget_per_interpreter_aoa' | 'interpreters_needed' | 'service_id' | 'duration_minutes' | 'modality' | 'interpreter_ids'>): Promise<RequestPreview> {
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

  // The service lifecycle (service-lifecycle.md) ------------------------------------------------
  async disputes(requestId: string): Promise<DisputeRow[]> {
    return this.rows<DisputeRow>(this.booking('dispute_details').select('*').eq('request_id', requestId).order('created_at'), 'booking.dispute_details')
  }

  /** admin-web /requests: every request the team sees, the disputed first when asked. */
  async staffList(query: { status: string | null; limit: number; offset: number }): Promise<{ rows: RequestRow[]; total: number }> {
    let request = this.booking('request_details').select('*', { count: 'exact' })
    if (query.status) request = request.eq('status', query.status)
    const { data, error, count } = await request.order('starts_at', { ascending: false }).range(query.offset, query.offset + query.limit - 1)
    if (error) throw translatePostgrestError(error, 'booking.request_details')
    return { rows: (data ?? []) as RequestRow[], total: count ?? 0 }
  }

  cancelRequest(requestId: string, reason: string): Promise<unknown> {
    return this.api.post(`/requests/${requestId}/cancel`, { reason })
  }

  cancelAssignment(assignmentId: string, reason: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/cancel`, { reason })
  }

  deliver(assignmentId: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/deliver`, {})
  }

  confirm(assignmentId: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/confirm`, {})
  }

  openDispute(assignmentId: string, reason: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/disputes`, { reason })
  }

  // Reviews (reviews.md) ------------------------------------------------------------------------
  async reviewsToDo(): Promise<ReviewToDoRow[]> {
    return this.rows<ReviewToDoRow>(this.booking('reviews_to_do').select('*').order('completed_at', { ascending: false }), 'booking.reviews_to_do')
  }

  /** By author ("Que fiz"), by target and the role they were reviewed in ("Que recebi", a profile), or by request. */
  async reviews(query: ReviewQuery): Promise<ReviewRow[]> {
    let request = this.booking('review_details').select('*')
    if ('authorId' in query) request = request.eq('author_account', query.authorId)
    else if ('targetId' in query) request = request.eq('target_account', query.targetId).eq('author_role', query.role === 'interpreter' ? 'requester' : 'interpreter')
    else request = request.eq('request_id', query.requestId)
    return this.rows<ReviewRow>(request.order('submitted_at', { ascending: false }), 'booking.review_details')
  }

  /** R-REV-05: an interpreter's average (public) or a requester's (for whoever may read it). */
  async rating(accountId: string, role: 'requester' | 'interpreter'): Promise<Rating> {
    const rows = role === 'interpreter'
      ? await this.rows<{ rating_average: number | null; rating_count: number | null }>(
        this.client.schema('directory').from('interpreter_ratings').select('rating_average, rating_count').eq('interpreter_id', accountId), 'directory.interpreter_ratings')
      : await this.rows<{ rating_average: number | null; rating_count: number | null }>(
        this.booking('requester_ratings').select('rating_average, rating_count').eq('requester_id', accountId), 'booking.requester_ratings')
    const row = rows[0]
    return { average: row?.rating_average === null || row?.rating_average === undefined ? null : Number(row.rating_average), count: row?.rating_count ?? 0 }
  }

  submitReview(assignmentId: string, rating: number, comment: string): Promise<unknown> {
    return this.api.post(`/assignments/${assignmentId}/reviews`, comment ? { rating, comment } : { rating })
  }

  hideReview(reviewId: string, reason: string): Promise<unknown> {
    return this.api.post(`/admin/reviews/${reviewId}/hide`, { reason })
  }

  resolveDispute(disputeId: string, resolution: 'completed' | 'cancelled', notes: string): Promise<unknown> {
    return this.api.post(`/admin/disputes/${disputeId}/resolve`, { resolution, notes })
  }
}
