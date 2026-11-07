-- Grants of step H10 (api.md §9). The billing tables are read only through their views; every
-- write is a billing function called by the API (service_role).
GRANT SELECT ON billing.payment_details, billing.proof_queue, billing.refund_details, billing.payout_details,
  identity.my_payout_details TO authenticated;
GRANT EXECUTE ON FUNCTION auth_helper.can_view_payment(uuid), auth_helper.can_pay(uuid) TO authenticated, service_role;
GRANT SELECT ON billing.payment_intents, billing.payment_proofs, billing.refunds, billing.payouts, billing.receipts,
  billing.payment_details, billing.proof_queue, billing.refund_details, billing.payout_details TO service_role;
GRANT EXECUTE ON FUNCTION
  billing.split_amount(bigint, uuid),
  billing.managed_interpreter_share(bigint, bigint, uuid),
  billing.submit_proof(uuid, uuid, text),
  billing.review_proof(uuid, uuid, boolean, text),
  billing.create_manual_refund(uuid, uuid, bigint, text),
  billing.mark_refund_paid(uuid, uuid, text),
  billing.mark_payout_paid(uuid, uuid, text),
  billing.expire_intents(),
  billing.receipt_for(uuid, uuid),
  identity.save_payout_details(uuid, text, text, text)
  TO service_role;
