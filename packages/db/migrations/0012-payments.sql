-- 0012 — payments, refunds, payouts and receipts (step H10; payments.md R-PAY-01..13,
-- data-model.md §6 "billing", §1 "identity.interpreter_payout_details"). Money is whole kwanzas
-- (D-37). Every write goes through the billing functions.
BEGIN;

-- R-PAY-11: where the interpreter receives its payouts.
CREATE TABLE identity.interpreter_payout_details (
  interpreter_id uuid PRIMARY KEY REFERENCES identity.interpreter_profiles (account_id) ON DELETE CASCADE,
  account_holder text NOT NULL CHECK (length(trim(account_holder)) BETWEEN 2 AND 160),
  bank_name text NOT NULL CHECK (length(trim(bank_name)) BETWEEN 2 AND 120),
  iban util.iban_ao NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.interpreter_payout_details ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER interpreter_payout_details_set_updated_at BEFORE UPDATE ON identity.interpreter_payout_details
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TABLE billing.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text NOT NULL CHECK (context IN ('managed_request', 'verification', 'event_registration')),
  subject_id uuid NOT NULL,
  payer_account uuid NOT NULL REFERENCES identity.profiles (id),
  organization_id uuid REFERENCES identity.organizations (id),
  description text NOT NULL CHECK (length(description) BETWEEN 1 AND 200),
  amount_base_aoa bigint NOT NULL CHECK (amount_base_aoa >= 0),
  tax_aoa bigint NOT NULL CHECK (tax_aoa >= 0),
  amount_total_aoa bigint NOT NULL CHECK (amount_total_aoa > 0),
  config_version_id uuid NOT NULL REFERENCES config.platform_versions (id),
  reference text NOT NULL UNIQUE,
  bank_snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_proof'
    CHECK (status IN ('awaiting_proof', 'proof_submitted', 'confirmed', 'cancelled', 'expired')),
  due_at timestamptz NOT NULL,
  expiring_warned_at timestamptz,
  confirmed_by uuid REFERENCES identity.profiles (id),
  confirmed_at timestamptz,
  subject_cancelled_at timestamptz,
  refund_due_on_confirm_aoa bigint CHECK (refund_due_on_confirm_aoa >= 0),
  refund_due_reason_code text,
  refund_due_policy jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount_base_aoa + tax_aoa = amount_total_aoa),
  CHECK ((status = 'confirmed') = (confirmed_at IS NOT NULL))
);
ALTER TABLE billing.payment_intents ENABLE ROW LEVEL SECURITY;
-- R-PAY-02: at most one live or confirmed intent per subject.
CREATE UNIQUE INDEX payment_intents_one_live ON billing.payment_intents (context, subject_id)
  WHERE status IN ('awaiting_proof', 'proof_submitted', 'confirmed');
CREATE INDEX payment_intents_subject_idx ON billing.payment_intents (subject_id);
CREATE INDEX payment_intents_payer_idx ON billing.payment_intents (payer_account);
CREATE INDEX payment_intents_organization_idx ON billing.payment_intents (organization_id);
CREATE INDEX payment_intents_config_version_idx ON billing.payment_intents (config_version_id);
CREATE INDEX payment_intents_confirmed_by_idx ON billing.payment_intents (confirmed_by);
CREATE INDEX payment_intents_due_idx ON billing.payment_intents (due_at) WHERE status = 'awaiting_proof';
CREATE TRIGGER payment_intents_set_updated_at BEFORE UPDATE ON billing.payment_intents
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE TABLE billing.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL REFERENCES billing.payment_intents (id),
  file_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES identity.profiles (id),
  uploaded_at timestamptz NOT NULL,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES identity.profiles (id),
  reviewed_at timestamptz,
  CHECK ((review_status = 'rejected') = (rejection_reason IS NOT NULL)),
  CHECK ((review_status = 'pending') = (reviewed_at IS NULL))
);
ALTER TABLE billing.payment_proofs ENABLE ROW LEVEL SECURITY;
-- R-PAY-04: one pending proof at a time.
CREATE UNIQUE INDEX payment_proofs_one_pending ON billing.payment_proofs (intent_id) WHERE review_status = 'pending';
CREATE INDEX payment_proofs_intent_idx ON billing.payment_proofs (intent_id);
CREATE INDEX payment_proofs_uploaded_by_idx ON billing.payment_proofs (uploaded_by);
CREATE INDEX payment_proofs_reviewed_by_idx ON billing.payment_proofs (reviewed_by);
CREATE INDEX payment_proofs_pending_idx ON billing.payment_proofs (uploaded_at) WHERE review_status = 'pending';

CREATE TABLE billing.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL REFERENCES billing.payment_intents (id),
  assignment_id uuid REFERENCES booking.request_assignments (id),
  amount_aoa bigint NOT NULL CHECK (amount_aoa > 0),
  reason_code text NOT NULL CHECK (reason_code IN ('managed_cancel_early', 'managed_cancel_late', 'managed_reduce',
    'provider_failure', 'suspension', 'dispute', 'verification_rejected', 'event_cancelled', 'event_cancel_early', 'manual')),
  note text CHECK (length(note) <= 2000),
  policy_snapshot jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_by uuid REFERENCES identity.profiles (id),
  paid_reference text,
  paid_by uuid REFERENCES identity.profiles (id),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reason_code <> 'manual' OR length(trim(coalesce(note, ''))) >= 3),
  CHECK ((status = 'paid') = (paid_at IS NOT NULL AND paid_reference IS NOT NULL))
);
ALTER TABLE billing.refunds ENABLE ROW LEVEL SECURITY;
CREATE INDEX refunds_intent_idx ON billing.refunds (intent_id);
CREATE INDEX refunds_assignment_idx ON billing.refunds (assignment_id);
CREATE INDEX refunds_created_by_idx ON billing.refunds (created_by);
CREATE INDEX refunds_paid_by_idx ON billing.refunds (paid_by);
CREATE INDEX refunds_pending_idx ON billing.refunds (created_at) WHERE status = 'pending';

CREATE TABLE billing.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL UNIQUE REFERENCES booking.request_assignments (id),
  interpreter_id uuid NOT NULL REFERENCES identity.profiles (id),
  amount_aoa bigint NOT NULL CHECK (amount_aoa > 0),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'paid', 'cancelled')),
  payout_details_snapshot jsonb,
  paid_reference text,
  paid_by uuid REFERENCES identity.profiles (id),
  paid_at timestamptz,
  cancelled_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'paid') = (paid_at IS NOT NULL AND paid_reference IS NOT NULL AND payout_details_snapshot IS NOT NULL)),
  CHECK ((status = 'cancelled') = (cancelled_reason IS NOT NULL))
);
ALTER TABLE billing.payouts ENABLE ROW LEVEL SECURITY;
CREATE INDEX payouts_interpreter_idx ON billing.payouts (interpreter_id);
CREATE INDEX payouts_paid_by_idx ON billing.payouts (paid_by);
CREATE INDEX payouts_queued_idx ON billing.payouts (created_at) WHERE status = 'queued';
CREATE TRIGGER payouts_set_updated_at BEFORE UPDATE ON billing.payouts
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- R-PAY-12: numbered without gaps (util.next_code inside the transaction), never changed.
CREATE TABLE billing.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('payment', 'refund')),
  intent_id uuid NOT NULL REFERENCES billing.payment_intents (id),
  refund_id uuid UNIQUE REFERENCES billing.refunds (id),
  amount_aoa bigint NOT NULL CHECK (amount_aoa > 0),
  issued_to_name text NOT NULL,
  issued_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  CHECK ((kind = 'refund') = (refund_id IS NOT NULL))
);
ALTER TABLE billing.receipts ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX receipts_one_payment ON billing.receipts (intent_id) WHERE kind = 'payment';
CREATE INDEX receipts_intent_idx ON billing.receipts (intent_id);
CREATE OR REPLACE FUNCTION billing.receipts_immutable() RETURNS trigger
  LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED', DETAIL = 'a receipt is never changed or removed (R-PAY-12)';
END;
$$;
CREATE TRIGGER receipts_immutable BEFORE UPDATE OR DELETE ON billing.receipts
  FOR EACH ROW EXECUTE FUNCTION billing.receipts_immutable();
CREATE TRIGGER receipts_no_truncate BEFORE TRUNCATE ON billing.receipts
  FOR EACH STATEMENT EXECUTE FUNCTION billing.receipts_immutable();

COMMIT;
