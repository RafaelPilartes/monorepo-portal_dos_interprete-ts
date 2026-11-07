import { translatePostgrestError, type ApiClient, type createSupabaseClient } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'

type SupabaseClient = ReturnType<typeof createSupabaseClient>

// Payments for the screens (payments.md): reads by RLS through the billing views, which decide who
// sees what (the payer side, finance, the interpreter); writes through the API, where the billing
// functions own every rule. No screen computes an amount or a tax (R-PAY-03).

export type PaymentRow = Tables<{ schema: 'billing' }, 'payment_details'>
export type ProofRow = Tables<{ schema: 'billing' }, 'proof_queue'>
export type RefundRow = Tables<{ schema: 'billing' }, 'refund_details'>
export type PayoutRow = Tables<{ schema: 'billing' }, 'payout_details'>
export type PayoutDetailsRow = Tables<{ schema: 'identity' }, 'my_payout_details'>
export interface ReceiptLink { id: string; number: string; kind: 'payment' | 'refund'; amount_aoa: number; issued_at: string }

export class BillingRepository {
  constructor(private readonly client: SupabaseClient, private readonly api: ApiClient) {}

  private async rows<T>(request: PromiseLike<{ data: unknown; error: { code: string; message: string; hint?: string | null } | null }>, where: string): Promise<T[]> {
    const { data, error } = await request
    if (error) throw translatePostgrestError(error, where)
    return (data ?? []) as T[]
  }

  private billing(view: string) {
    return this.client.schema('billing').from(view)
  }

  /** requester-web /payments; one subject's payment for its block (a managed request, a verification). */
  payments(subjectId?: string): Promise<PaymentRow[]> {
    let request = this.billing('payment_details').select('*')
    if (subjectId) request = request.eq('subject_id', subjectId)
    return this.rows<PaymentRow>(request.order('created_at', { ascending: false }), 'billing.payment_details')
  }

  /** admin-web /payments: pending first, oldest first; with all, the history too. */
  proofs(all: boolean): Promise<ProofRow[]> {
    let request = this.billing('proof_queue').select('*')
    if (!all) request = request.eq('review_status', 'pending')
    return this.rows<ProofRow>(request.order('uploaded_at', { ascending: !all }), 'billing.proof_queue')
  }

  refunds(): Promise<RefundRow[]> {
    return this.rows<RefundRow>(this.billing('refund_details').select('*').order('created_at', { ascending: false }), 'billing.refund_details')
  }

  payouts(): Promise<PayoutRow[]> {
    return this.rows<PayoutRow>(this.billing('payout_details').select('*').order('created_at', { ascending: false }), 'billing.payout_details')
  }

  async payoutDetails(): Promise<PayoutDetailsRow | null> {
    const rows = await this.rows<PayoutDetailsRow>(this.client.schema('identity').from('my_payout_details').select('*'), 'identity.my_payout_details')
    return rows[0] ?? null
  }

  /** R-PAY-04: sign, upload, register. */
  async sendProof(intentId: string, file: File): Promise<void> {
    const signed = await this.api.post<{ path: string; signed_upload_url: string }>('/uploads/sign', {
      purpose: 'payment_proof', subject_id: intentId, file_name: file.name, content_type: file.type, size_bytes: file.size,
    })
    await this.api.uploadToSignedUrl(signed.signed_upload_url, file)
    await this.api.post(`/payment-intents/${intentId}/proofs`, { file_path: signed.path })
  }

  /** A short-lived link to a private file the person may read (the proof, for finance). */
  async fileUrl(path: string): Promise<string> {
    const answer = await this.api.get<{ signed_url: string }>(`/files/url?path=${encodeURIComponent(path)}`)
    return answer.signed_url
  }

  receiptPdf(receiptId: string): Promise<Blob> {
    return this.api.download(`/receipts/${receiptId}/pdf`)
  }

  acceptProof(proofId: string): Promise<unknown> {
    return this.api.post(`/admin/proofs/${proofId}/accept`, {})
  }

  rejectProof(proofId: string, reason: string): Promise<unknown> {
    return this.api.post(`/admin/proofs/${proofId}/reject`, { reason })
  }

  markRefundPaid(refundId: string, reference: string): Promise<unknown> {
    return this.api.post(`/admin/refunds/${refundId}/mark-paid`, { reference })
  }

  markPayoutPaid(payoutId: string, reference: string): Promise<unknown> {
    return this.api.post(`/admin/payouts/${payoutId}/mark-paid`, { reference })
  }

  savePayoutDetails(input: { account_holder: string; bank_name: string; iban: string }): Promise<unknown> {
    return this.api.put('/me/payout-details', input)
  }
}
