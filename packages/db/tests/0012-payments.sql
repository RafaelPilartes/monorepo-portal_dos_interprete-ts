-- Named assertions for step H10 (payments.md criteria 1, 2, 4, 5, 6 and the proof flow of 7;
-- criterion 3, the concurrent one, is in apps/api/src/routes/payments.db.test.ts). Rolled back.
-- The intents are created by fixture: their subjects arrive with H11, H12 and H17 (MASTER-PLAN H10).
-- f1 Paula (payer), f2 Óscar (organisation owner), f3 Mia (organisation member), f4 Ivo
-- (interpreter), f8 Fina (finance), f9 Mo (moderator).

UPDATE config.platform_versions SET status = 'published', published_at = now()
 WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published');
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000f1', 'paula.pay@exemplo.ao', '{"full_name": "Paula Paga"}'),
  ('00000000-0000-4000-8000-0000000000f2', 'oscar.pay@exemplo.ao', '{"full_name": "Óscar Dono"}'),
  ('00000000-0000-4000-8000-0000000000f3', 'mia.pay@exemplo.ao', '{"full_name": "Mia Membro"}'),
  ('00000000-0000-4000-8000-0000000000f4', 'ivo.pay@exemplo.ao', '{"full_name": "Ivo Repasse"}'),
  ('00000000-0000-4000-8000-0000000000f8', 'fina.pay@exemplo.ao', '{"full_name": "Fina Financeira"}'),
  ('00000000-0000-4000-8000-0000000000f9', 'mo.pay@exemplo.ao', '{"full_name": "Mo Moderador"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000f_';
INSERT INTO identity.staff_members (account_id, level) VALUES
  ('00000000-0000-4000-8000-0000000000f8', 'finance'), ('00000000-0000-4000-8000-0000000000f9', 'moderator');
-- Test setup only: the published version takes test values (rolled back with the file).
ALTER TABLE config.platform_versions DISABLE TRIGGER platform_versions_guard;
DELETE FROM util.test_clock;
INSERT INTO util.test_clock (frozen_at) VALUES (date_trunc('minute', now()));

CREATE TEMP TABLE h10 (key text PRIMARY KEY, id uuid);
GRANT ALL ON h10 TO authenticated;
CREATE FUNCTION pg_temp.at(p_when timestamptz) RETURNS void LANGUAGE sql AS $$ UPDATE util.test_clock SET frozen_at = p_when $$;
CREATE FUNCTION pg_temp.as_account(p_account uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', jsonb_build_object('sub', p_account, 'role', 'authenticated')::text, true) $$;
-- The uploaded file the API would have signed (POST /uploads/sign).
CREATE FUNCTION pg_temp.uploaded(p_intent uuid) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_path text := format('payment_proof/%s/%s-comprovativo.pdf', p_intent, gen_random_uuid());
BEGIN
  INSERT INTO storage.objects (bucket_id, name) VALUES ('payment-proofs', v_path);
  RETURN v_path;
END $$;

-- Criterion 1: no Academia bank data in the configuration, no intent (PC-06).
DO $$
DECLARE v_code text;
BEGIN
  UPDATE config.platform_versions SET academia_bank_name = NULL, academia_iban = NULL, academia_beneficiary = NULL
   WHERE id = config.current_version_id();
  BEGIN PERFORM billing.create_intent('verification', gen_random_uuid(), '00000000-0000-4000-8000-0000000000f1', NULL,
    'Taxa de verificação', 15000, config.current_version_id(), util.now() + interval '3 days');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'CONFIG_VALUE_MISSING' THEN RAISE EXCEPTION 'FAIL - no IBAN of the Academia, no intent (got %)', v_code; END IF;
  -- Test values (fictitious; the real ones are PC-06).
  UPDATE config.platform_versions SET academia_bank_name = 'Banco de Teste', academia_iban = 'AO06000000000000000000001',
         academia_beneficiary = 'Academia (teste)', tax_rate_pct = 0, prices_include_tax = true, managed_interpreter_share_pct = 80
   WHERE id = config.current_version_id();
  RAISE NOTICE 'ok - without the Academia IBAN in the configuration an intent is refused with CONFIG_VALUE_MISSING (criterion 1)';
END $$;

-- Criteria 4 and 6: tax in one function; the interpreter's share rounded up.
DO $$
DECLARE
  v_version uuid := config.current_version_id();
  v_split record;
BEGIN
  UPDATE config.platform_versions SET tax_rate_pct = 14 WHERE id = v_version;
  SELECT * INTO v_split FROM billing.split_amount(114000, v_version);
  IF v_split.base_aoa <> 100000 OR v_split.tax_aoa <> 14000 OR v_split.total_aoa <> 114000 THEN
    RAISE EXCEPTION 'FAIL - 14 %% included: 114 000 is 100 000 and 14 000 of tax (got %, %)', v_split.base_aoa, v_split.tax_aoa;
  END IF;
  UPDATE config.platform_versions SET prices_include_tax = false WHERE id = v_version;
  SELECT * INTO v_split FROM billing.split_amount(100000, v_version);
  IF v_split.tax_aoa <> 14000 OR v_split.total_aoa <> 114000 THEN RAISE EXCEPTION 'FAIL - 14 %% added to 100 000 is 114 000'; END IF;
  UPDATE config.platform_versions SET tax_rate_pct = 0, prices_include_tax = true WHERE id = v_version;
  SELECT * INTO v_split FROM billing.split_amount(114000, v_version);
  IF v_split.tax_aoa <> 0 OR v_split.base_aoa <> 114000 THEN RAISE EXCEPTION 'FAIL - with 0 %% the tax is 0'; END IF;
  IF billing.managed_interpreter_share(15001, NULL, v_version) <> 12001 OR billing.managed_interpreter_share(15001, 2000, v_version) <> 14001 THEN
    RAISE EXCEPTION 'FAIL - 80 %% of 15 001 is 12 001 (rounded up), the travel fee whole';
  END IF;
  RAISE NOTICE 'ok - split_amount: 114 000 with 14 %% included is 100 000 + 14 000; 0 %% is no tax; 80 %% of 15 001 is 12 001 (criteria 4, 6)';
END $$;

-- Criterion 2: one live intent per subject.
DO $$
DECLARE
  v_subject uuid := gen_random_uuid();
  v_intent billing.payment_intents;
  v_code text;
BEGIN
  v_intent := billing.create_intent('verification', v_subject, '00000000-0000-4000-8000-0000000000f1', NULL,
    'Taxa de verificação', 15000, config.current_version_id(), util.now() + interval '3 days');
  INSERT INTO h10 VALUES ('first', v_intent.id);
  IF v_intent.reference !~ '^PAG-\d{4}-\d{6}$' OR v_intent.bank_snapshot ->> 'iban' <> 'AO06000000000000000000001'
     OR v_intent.status <> 'awaiting_proof'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'payment_requested' AND account_id = '00000000-0000-4000-8000-0000000000f1') THEN
    RAISE EXCEPTION 'FAIL - an intent has its reference, the bank data copied, waits for a proof, the payer is told';
  END IF;
  BEGIN PERFORM billing.create_intent('verification', v_subject, '00000000-0000-4000-8000-0000000000f1', NULL,
    'Taxa de verificação', 15000, config.current_version_id(), util.now() + interval '3 days');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'PAYMENT_ALREADY_PENDING' THEN RAISE EXCEPTION 'FAIL - a second live intent is refused (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN INSERT INTO billing.payment_intents (context, subject_id, payer_account, description, amount_base_aoa, tax_aoa, amount_total_aoa,
          config_version_id, reference, bank_snapshot, due_at)
        VALUES ('verification', v_subject, '00000000-0000-4000-8000-0000000000f1', 'x', 1, 0, 1, config.current_version_id(), 'PAG-X', '{}', util.now());
  EXCEPTION WHEN unique_violation THEN v_code := 'unique'; END;
  IF v_code IS DISTINCT FROM 'unique' THEN RAISE EXCEPTION 'FAIL - the database itself refuses a second live intent'; END IF;
  UPDATE config.platform_versions SET academia_iban = 'AO06000000000000000000099' WHERE id = config.current_version_id();
  IF (SELECT bank_snapshot ->> 'iban' FROM billing.payment_intents WHERE id = v_intent.id) <> 'AO06000000000000000000001' THEN
    RAISE EXCEPTION 'FAIL - the intent keeps its bank data when the configuration changes';
  END IF;
  RAISE NOTICE 'ok - one live intent per subject, in the function and in the database; the bank data is a copy (criterion 2)';
END $$;

-- Criterion 7 (in the database): send, refuse with a reason, send again, accept, receipt.
DO $$
DECLARE
  v_intent uuid := (SELECT id FROM h10 WHERE key = 'first');
  v_proof billing.payment_proofs;
  v_code text;
BEGIN
  BEGIN PERFORM billing.submit_proof('00000000-0000-4000-8000-0000000000f1', v_intent, 'payment_proof/' || v_intent || '/nada.pdf');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'PROOF_FILE_INVALID' THEN RAISE EXCEPTION 'FAIL - a file that was not uploaded is refused (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM billing.submit_proof('00000000-0000-4000-8000-0000000000f2', v_intent, pg_temp.uploaded(v_intent));
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'NOT_FOUND' THEN RAISE EXCEPTION 'FAIL - someone else cannot send the proof (got %)', v_code; END IF;
  v_proof := billing.submit_proof('00000000-0000-4000-8000-0000000000f1', v_intent, pg_temp.uploaded(v_intent));
  IF (SELECT status FROM billing.payment_intents WHERE id = v_intent) <> 'proof_submitted'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'payment_proof_received' AND account_id = '00000000-0000-4000-8000-0000000000f8') THEN
    RAISE EXCEPTION 'FAIL - a proof puts the intent in review and tells finance';
  END IF;
  v_code := NULL;
  BEGIN PERFORM billing.submit_proof('00000000-0000-4000-8000-0000000000f1', v_intent, pg_temp.uploaded(v_intent));
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'PROOF_ALREADY_PENDING' THEN RAISE EXCEPTION 'FAIL - one pending proof at a time (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM billing.review_proof('00000000-0000-4000-8000-0000000000f9', v_proof.id, true);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - only finance reviews (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM billing.review_proof('00000000-0000-4000-8000-0000000000f8', v_proof.id, false, ' ');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - a refusal needs a reason (got %)', v_code; END IF;
  PERFORM billing.review_proof('00000000-0000-4000-8000-0000000000f8', v_proof.id, false, 'O valor transferido não corresponde: 1 500 Kz');
  IF (SELECT status FROM billing.payment_intents WHERE id = v_intent) <> 'awaiting_proof'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'payment_proof_rejected' AND account_id = '00000000-0000-4000-8000-0000000000f1'
                      AND payload ->> 'reason' LIKE 'O valor transferido%') THEN
    RAISE EXCEPTION 'FAIL - a refused proof sends the intent back to waiting, the payer is told why';
  END IF;
  v_proof := billing.submit_proof('00000000-0000-4000-8000-0000000000f1', v_intent, pg_temp.uploaded(v_intent));
  PERFORM billing.review_proof('00000000-0000-4000-8000-0000000000f8', v_proof.id, true);
  IF (SELECT status FROM billing.payment_intents WHERE id = v_intent) <> 'confirmed'
     OR (SELECT count(*) FROM billing.receipts WHERE intent_id = v_intent AND kind = 'payment') <> 1
     OR (SELECT payload ->> 'notice' FROM billing.receipts WHERE intent_id = v_intent) <> 'Documento não fiscal'
     OR NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'payment.proof_accepted' AND entity_id = v_intent::text) THEN
    RAISE EXCEPTION 'FAIL - an accepted proof confirms the intent, issues one receipt (not fiscal), audited';
  END IF;
  v_code := NULL;
  BEGIN PERFORM billing.review_proof('00000000-0000-4000-8000-0000000000f8', v_proof.id, true);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - accepting twice answers STATE_CHANGED (got %)', v_code; END IF;
  RAISE NOTICE 'ok - the proof flow: send, refuse with a reason, send again, accept, one receipt; twice is STATE_CHANGED (criterion 7)';
END $$;

-- R-PAY-07: refunds never pass what was paid; paid with a reference and a refund receipt.
DO $$
DECLARE
  v_intent uuid := (SELECT id FROM h10 WHERE key = 'first');
  v_refund billing.refunds;
  v_code text;
BEGIN
  v_refund := billing.create_manual_refund('00000000-0000-4000-8000-0000000000f8', v_intent, 10000, 'Acerto combinado com a pessoa.');
  BEGIN PERFORM billing.create_manual_refund('00000000-0000-4000-8000-0000000000f8', v_intent, 5001, 'Outro acerto.');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'REFUND_EXCEEDS_TOTAL' THEN RAISE EXCEPTION 'FAIL - refunds never pass the total (got %)', v_code; END IF;
  PERFORM billing.create_manual_refund('00000000-0000-4000-8000-0000000000f8', v_intent, 5000, 'O resto.');
  PERFORM billing.mark_refund_paid('00000000-0000-4000-8000-0000000000f8', v_refund.id, 'TRF-123456');
  IF (SELECT count(*) FROM billing.receipts WHERE refund_id = v_refund.id) <> 1
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'refund_paid' AND account_id = '00000000-0000-4000-8000-0000000000f1') THEN
    RAISE EXCEPTION 'FAIL - a paid refund has its receipt and the payer is told';
  END IF;
  v_code := NULL;
  BEGIN UPDATE billing.receipts SET amount_aoa = 1 WHERE refund_id = v_refund.id;
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - a receipt is never changed'; END IF;
  RAISE NOTICE 'ok - refunds up to the total, paid with a reference and a refund receipt; receipts never change (R-PAY-07, R-PAY-12)';
END $$;

-- Criterion 5: no gaps in the receipt numbers, even with a transaction failing half-way.
DO $$
DECLARE
  v_intent billing.payment_intents := (SELECT i FROM billing.payment_intents AS i WHERE i.id = (SELECT id FROM h10 WHERE key = 'first'));
  v_before text := (SELECT max(number) FROM billing.receipts);
  v_after text;
BEGIN
  -- A refund paid in a transaction that fails after its receipt: everything rolls back, the counter too.
  BEGIN
    PERFORM billing.mark_refund_paid('00000000-0000-4000-8000-0000000000f8',
      (SELECT id FROM billing.refunds WHERE intent_id = v_intent.id AND status = 'pending'), 'TRF-654321');
    RAISE EXCEPTION 'forced failure';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  PERFORM billing.mark_refund_paid('00000000-0000-4000-8000-0000000000f8',
    (SELECT id FROM billing.refunds WHERE intent_id = v_intent.id AND status = 'pending'), 'TRF-654321');
  v_after := (SELECT max(number) FROM billing.receipts);
  IF split_part(v_after, '-', 3)::integer <> split_part(v_before, '-', 3)::integer + 1 THEN
    RAISE EXCEPTION 'FAIL - the numbering has no gap after a failed transaction (% then %)', v_before, v_after;
  END IF;
  RAISE NOTICE 'ok - receipt numbers have no gaps, even after a transaction failing half-way (criterion 5)';
END $$;

-- R-PAY-04, organisations: a member sees the state, only the owner or admin pays.
DO $$
DECLARE
  v_org identity.organizations;
  v_intent billing.payment_intents;
  v_code text;
BEGIN
  v_org := identity.create_organization('00000000-0000-4000-8000-0000000000f2', 'Clínica de Teste', '5000000001', NULL, NULL, NULL, NULL, NULL);
  INSERT INTO identity.organization_members (organization_id, account_id, role, status)
  VALUES (v_org.id, '00000000-0000-4000-8000-0000000000f3', 'member', 'active');
  v_intent := billing.create_intent('managed_request', gen_random_uuid(), '00000000-0000-4000-8000-0000000000f3', v_org.id,
    'Pedido gerido', 30000, config.current_version_id(), util.now() + interval '2 days');
  INSERT INTO h10 VALUES ('org', v_intent.id);
  BEGIN PERFORM billing.submit_proof('00000000-0000-4000-8000-0000000000f3', v_intent.id, pg_temp.uploaded(v_intent.id));
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - an organisation member does not pay (got %)', v_code; END IF;
  PERFORM billing.submit_proof('00000000-0000-4000-8000-0000000000f2', v_intent.id, pg_temp.uploaded(v_intent.id));
  IF NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'payment_requested' AND account_id = '00000000-0000-4000-8000-0000000000f2') THEN
    RAISE EXCEPTION 'FAIL - the organisation owner, who pays, is told of the payment';
  END IF;
  RAISE NOTICE 'ok - in an organisation only the owner or admin sends the proof, and they are told (R-PAY-04)';
END $$;
DO $$ BEGIN PERFORM pg_temp.as_account('00000000-0000-4000-8000-0000000000f3'); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT status FROM billing.payment_details WHERE id = (SELECT id FROM h10 WHERE key = 'org')) IS DISTINCT FROM 'proof_submitted'
     OR (SELECT can_pay FROM billing.payment_details WHERE id = (SELECT id FROM h10 WHERE key = 'org'))
     OR EXISTS (SELECT 1 FROM billing.payment_details WHERE id = (SELECT id FROM h10 WHERE key = 'first'))
     OR EXISTS (SELECT 1 FROM billing.proof_queue) THEN
    RAISE EXCEPTION 'FAIL - a member reads its organisation''s payment (not payable by it), not others, not the finance queue';
  END IF;
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM pg_temp.as_account('00000000-0000-4000-8000-0000000000f8'); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM billing.proof_queue WHERE intent_id = (SELECT id FROM h10 WHERE key = 'org') AND review_status = 'pending') THEN
    RAISE EXCEPTION 'FAIL - finance reads the proofs to review';
  END IF;
  RAISE NOTICE 'ok - payments read by the payer side and finance only; the queue by finance only';
END $$;
RESET ROLE;

-- R-PAY-06: a subject cancelled while its proof waits; expiry never touches a sent proof.
DO $$
DECLARE
  v_org uuid := (SELECT id FROM h10 WHERE key = 'org');
  v_intent billing.payment_intents := (SELECT i FROM billing.payment_intents AS i WHERE i.id = v_org);
  v_waiting billing.payment_intents;
BEGIN
  PERFORM billing.cancel_intent_for_subject('managed_request', v_intent.subject_id, 30000, 'provider_failure');
  PERFORM pg_temp.at(v_intent.due_at + interval '1 day');
  PERFORM billing.expire_intents();
  IF (SELECT status FROM billing.payment_intents WHERE id = v_org) <> 'proof_submitted' THEN
    RAISE EXCEPTION 'FAIL - an intent with a proof sent never expires';
  END IF;
  PERFORM billing.review_proof('00000000-0000-4000-8000-0000000000f8',
    (SELECT id FROM billing.payment_proofs WHERE intent_id = v_org AND review_status = 'pending'), true);
  IF (SELECT sum(amount_aoa) FROM billing.refunds WHERE intent_id = v_org) <> 30000 THEN
    RAISE EXCEPTION 'FAIL - accepting the proof of a cancelled subject creates its refund at once';
  END IF;
  v_waiting := billing.create_intent('verification', gen_random_uuid(), '00000000-0000-4000-8000-0000000000f1', NULL,
    'Taxa de verificação', 15000, config.current_version_id(), util.now() + interval '10 hours');
  PERFORM billing.expire_intents();
  IF (SELECT expiring_warned_at FROM billing.payment_intents WHERE id = v_waiting.id) IS NULL THEN
    RAISE EXCEPTION 'FAIL - twelve hours before the deadline the payer is warned';
  END IF;
  PERFORM pg_temp.at(v_waiting.due_at);
  PERFORM billing.expire_intents();
  IF (SELECT status FROM billing.payment_intents WHERE id = v_waiting.id) <> 'expired' THEN
    RAISE EXCEPTION 'FAIL - an intent waiting for a proof expires at its deadline';
  END IF;
  RAISE NOTICE 'ok - a sent proof never expires; its refund comes when accepted; a waiting intent is warned and expires (R-PAY-06)';
END $$;

-- Review of H10: a cancelled subject refunds at most what is left, once; a late proof is refused.
DO $$
DECLARE
  v_intent billing.payment_intents;
  v_code text;
BEGIN
  v_intent := billing.create_intent('verification', gen_random_uuid(), '00000000-0000-4000-8000-0000000000f1', NULL,
    'Taxa de verificação', 15000, config.current_version_id(), util.now() + interval '3 days');
  PERFORM billing.review_proof('00000000-0000-4000-8000-0000000000f8',
    (billing.submit_proof('00000000-0000-4000-8000-0000000000f1', v_intent.id, pg_temp.uploaded(v_intent.id))).id, true);
  PERFORM billing.create_manual_refund('00000000-0000-4000-8000-0000000000f8', v_intent.id, 5000, 'Acerto anterior.');
  PERFORM billing.cancel_intent_for_subject('verification', v_intent.subject_id, 15000, 'verification_rejected', '{"pct": 100}');
  PERFORM billing.cancel_intent_for_subject('verification', v_intent.subject_id, 15000, 'verification_rejected');
  IF (SELECT sum(amount_aoa) FROM billing.refunds WHERE intent_id = v_intent.id) <> 15000
     OR (SELECT count(*) FROM billing.refunds WHERE intent_id = v_intent.id AND policy_snapshot = '{"pct": 100}') <> 1 THEN
    RAISE EXCEPTION 'FAIL - the subject''s refund is what is left (10 000), once, with its policy';
  END IF;
  v_intent := billing.create_intent('verification', gen_random_uuid(), '00000000-0000-4000-8000-0000000000f1', NULL,
    'Taxa de verificação', 15000, config.current_version_id(), util.now() + interval '1 hour');
  PERFORM pg_temp.at(v_intent.due_at);
  BEGIN PERFORM billing.submit_proof('00000000-0000-4000-8000-0000000000f1', v_intent.id, pg_temp.uploaded(v_intent.id));
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'INTENT_EXPIRED' THEN RAISE EXCEPTION 'FAIL - a proof after the deadline is refused before the job runs (got %)', v_code; END IF;
  RAISE NOTICE 'ok - a cancelled subject refunds what is left, once; a proof after the deadline is INTENT_EXPIRED (review of H10)';
END $$;

-- R-PAY-10, R-PAY-11: a payout without bank details cannot be paid; adding them fills the copy.
DO $$
DECLARE
  v_assignment uuid;
  v_request booking.requests;
  v_payout billing.payouts;
  v_code text;
BEGIN
  -- Test setup: a direct request's assignment stands in for the managed one that queues payouts (H11).
  PERFORM identity.become_interpreter('00000000-0000-4000-8000-0000000000f4', NULL, NULL);
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000f1', NULL, NULL, 'Luanda');
  UPDATE identity.interpreter_profiles SET bio = repeat('Intérprete com experiência em saúde e justiça. ', 3), modality = 'online'
   WHERE account_id = '00000000-0000-4000-8000-0000000000f4';
  INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
  SELECT '00000000-0000-4000-8000-0000000000f4', id, 'fluent' FROM catalog.languages WHERE code = 'lga';
  INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
  SELECT '00000000-0000-4000-8000-0000000000f4', id, 10000 FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1;
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000f1',
    jsonb_build_object('kind', 'direct', 'service_id', (SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1),
      'language_ids', jsonb_build_array((SELECT id FROM catalog.languages WHERE code = 'lga')), 'modality', 'online',
      'meeting_link', 'https://meet.exemplo.ao/p', 'starts_at', util.now() + interval '3 days', 'duration_minutes', 60, 'interpreters_needed', 1,
      'interpreter_ids', jsonb_build_array('00000000-0000-4000-8000-0000000000f4'), 'beneficiary_name', 'Senhor', 'expected_total_aoa', 10000));
  SELECT a.id INTO v_assignment FROM booking.request_assignments AS a WHERE a.request_id = v_request.id;
  v_payout := billing.queue_payout(v_assignment, '00000000-0000-4000-8000-0000000000f4', 12001);
  IF NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'payout_details_missing' AND account_id = '00000000-0000-4000-8000-0000000000f4') THEN
    RAISE EXCEPTION 'FAIL - a payout without bank details tells the interpreter';
  END IF;
  BEGIN PERFORM billing.mark_payout_paid('00000000-0000-4000-8000-0000000000f8', v_payout.id, 'TRF-777');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'PAYOUT_DETAILS_MISSING' THEN RAISE EXCEPTION 'FAIL - no payout paid without bank details (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.save_payout_details('00000000-0000-4000-8000-0000000000f4', 'Ivo Repasse', 'Banco X', 'AO06123');
  EXCEPTION WHEN check_violation THEN v_code := 'iban'; END;
  IF v_code IS DISTINCT FROM 'iban' THEN RAISE EXCEPTION 'FAIL - an IBAN that is not Angolan is refused'; END IF;
  PERFORM identity.save_payout_details('00000000-0000-4000-8000-0000000000f4', 'Ivo Repasse', 'Banco X', 'AO06 0000 0000 0000 0000 0000 7');
  PERFORM billing.mark_payout_paid('00000000-0000-4000-8000-0000000000f8', v_payout.id, 'TRF-777');
  IF (SELECT payout_details_snapshot ->> 'iban' FROM billing.payouts WHERE id = v_payout.id) <> 'AO06000000000000000000007' THEN
    RAISE EXCEPTION 'FAIL - the queued payout took the copy of the details added later';
  END IF;
  RAISE NOTICE 'ok - a payout needs the interpreter''s bank details; added later, the queue takes them (R-PAY-10, R-PAY-11)';
END $$;
DELETE FROM util.test_clock;
ALTER TABLE config.platform_versions ENABLE TRIGGER platform_versions_guard;
