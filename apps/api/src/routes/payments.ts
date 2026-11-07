import type { FastifyInstance } from 'fastify'
import { amountAoaSchema } from '@portal-dos-interpretes/core'
import { z } from 'zod'
import type { Database } from '../lib/db.js'
import { receiptPdf, type ReceiptPayload } from '../lib/receiptPdf.js'
import { actor, callSql } from '../lib/routes.js'

// Payments, refunds, payouts and receipts (api.md §9; payments.md). Intents are never created by a
// route (R-PAY-01). Every rule — who pays, the states, the totals — is in the billing functions.

const uuid = z.string().uuid()
const idParam = z.object({ id: uuid })
const bodies = {
  proof: z.object({ file_path: z.string().max(400) }),
  reason: z.object({ reason: z.string().trim().max(1000) }),
  reference: z.object({ reference: z.string().trim().max(120) }),
  refund: z.object({ intent_id: uuid, amount_aoa: amountAoaSchema, reason_code: z.literal('manual'), note: z.string().trim().max(2000) }),
  payoutDetails: z.object({ account_holder: z.string().trim().max(160), bank_name: z.string().trim().max(120), iban: z.string().trim().max(40) }),
}

export function registerPaymentRoutes(server: FastifyInstance, deps: { db: Database }): void {
  // R-PAY-04
  server.post('/payment-intents/:id/proofs', async (request, reply) =>
    reply.status(201).send(await callSql(deps.db, request, 'SELECT * FROM billing.submit_proof($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.proof.parse(request.body).file_path,
    ])))

  // R-PAY-05
  server.post('/admin/proofs/:id/accept', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM billing.review_proof($1, $2, true)', [actor(request), idParam.parse(request.params).id]))
  server.post('/admin/proofs/:id/reject', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM billing.review_proof($1, $2, false, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.reason.parse(request.body).reason,
    ]))

  // R-PAY-07
  server.post('/admin/refunds', async (request, reply) => {
    const body = bodies.refund.parse(request.body)
    return reply.status(201).send(await callSql(deps.db, request, 'SELECT * FROM billing.create_manual_refund($1, $2, $3, $4)', [
      actor(request), body.intent_id, body.amount_aoa, body.note,
    ]))
  })
  server.post('/admin/refunds/:id/mark-paid', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM billing.mark_refund_paid($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.reference.parse(request.body).reference,
    ]))

  // R-PAY-10, R-PAY-11
  server.post('/admin/payouts/:id/mark-paid', async (request) =>
    callSql(deps.db, request, 'SELECT * FROM billing.mark_payout_paid($1, $2, $3)', [
      actor(request), idParam.parse(request.params).id, bodies.reference.parse(request.body).reference,
    ]))
  server.put('/me/payout-details', async (request) => {
    const body = bodies.payoutDetails.parse(request.body)
    return callSql(deps.db, request, 'SELECT * FROM identity.save_payout_details($1, $2, $3, $4)', [
      actor(request), body.account_holder, body.bank_name, body.iban,
    ])
  })

  // R-PAY-12: the PDF from the payload stored when the receipt was issued.
  server.get('/receipts/:id/pdf', async (request, reply) => {
    const receipt = await callSql<{ number: string; payload: ReceiptPayload }>(deps.db, request,
      'SELECT number, payload FROM billing.receipt_for($1, $2)', [actor(request), idParam.parse(request.params).id])
    return reply
      .header('content-type', 'application/pdf')
      .header('content-disposition', `attachment; filename="${receipt.number}.pdf"`)
      .send(receiptPdf(receipt.payload))
  })
}
