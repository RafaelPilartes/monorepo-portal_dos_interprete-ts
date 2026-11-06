-- Payments, refunds, payouts and receipts (step H10; payments.md R-PAY-01..13, ADR-005, D-30..D-37).
-- By bank transfer with a proof checked by hand. Money is whole kwanzas. The subjects (the managed
-- request H11, the verification H12, the paid event H17) react through billing.on_subject_event;
-- until their steps, intents exist only through test fixtures (MASTER-PLAN H10).
-- Lock order: the intent row first, then its proofs, refunds or receipts.

-- R-PAY-03: the one place where tax is computed. With prices_include_tax the price shown is the
-- total and the tax is the part included in it; otherwise the tax is added.
CREATE OR REPLACE FUNCTION billing.split_amount(p_price bigint, p_version uuid,
  OUT base_aoa bigint, OUT tax_aoa bigint, OUT total_aoa bigint)
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_rate numeric := config.require(p_version, 'tax_rate_pct')::numeric;
  v_included boolean := config.require(p_version, 'prices_include_tax')::boolean;
BEGIN
  IF p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_AMOUNT';
  END IF;
  IF v_included THEN
    total_aoa := p_price;
    base_aoa := round(p_price * 100 / (100 + v_rate))::bigint;
    tax_aoa := total_aoa - base_aoa;
  ELSE
    base_aoa := p_price;
    tax_aoa := round(p_price * v_rate / 100)::bigint;
    total_aoa := base_aoa + tax_aoa;
  END IF;
END;
$$;

-- R-PAY-13: the interpreter's part of a managed price, rounded up in its favour; the travel fee
-- goes whole to the interpreter. Without a published percentage it fails (CONFIG_VALUE_MISSING, PC-02).
CREATE OR REPLACE FUNCTION billing.managed_interpreter_share(p_price bigint, p_travel_fee bigint, p_version uuid) RETURNS bigint
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT ceil(p_price * config.require(p_version, 'managed_interpreter_share_pct')::numeric / 100)::bigint
         + coalesce(p_travel_fee, 0)
$$;

-- Who reads an intent: the payer, the active members of the paying organisation (a member sees the
-- state, R-PAY-04), and the finance team.
CREATE OR REPLACE FUNCTION billing.can_view_intent(p_intent billing.payment_intents, p_account uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  -- coalesce: a NULL here would let a stranger past the NOT_FOUND checks.
  SELECT coalesce(p_intent.payer_account = p_account
      OR (p_intent.organization_id IS NOT NULL AND auth_helper.org_role_of(p_intent.organization_id, p_account) IS NOT NULL)
      OR auth_helper.staff_level_of(p_account) IN ('finance', 'super_admin'), false)
$$;

-- Who pays (sends the proof): the payer; in an organisation, only its owner or admin (R-PAY-04).
CREATE OR REPLACE FUNCTION billing.can_pay_intent(p_intent billing.payment_intents, p_account uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT coalesce(CASE WHEN p_intent.organization_id IS NULL THEN p_intent.payer_account = p_account
              ELSE auth_helper.org_role_of(p_intent.organization_id, p_account) IN ('owner', 'admin') END, false)
$$;

CREATE OR REPLACE FUNCTION auth_helper.can_view_payment(p_intent uuid) RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  RETURN auth_helper.is_active() AND coalesce((SELECT billing.can_view_intent(i, auth_helper.account_id()) FROM billing.payment_intents AS i WHERE i.id = p_intent), false);
END;
$$;

CREATE OR REPLACE FUNCTION auth_helper.can_pay(p_intent uuid) RETURNS boolean
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  RETURN auth_helper.is_active() AND coalesce((SELECT billing.can_pay_intent(i, auth_helper.account_id()) FROM billing.payment_intents AS i WHERE i.id = p_intent), false);
END;
$$;

-- The files of a proof (api.md §6): the subject of the path is the intent. Write while it waits for
-- a proof and the account pays it; read whoever reads the intent.
CREATE OR REPLACE FUNCTION util.can_access_payment_proof(p_account uuid, p_subject uuid, p_mode text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT coalesce((SELECT CASE p_mode
            WHEN 'write' THEN i.status = 'awaiting_proof' AND billing.can_pay_intent(i, p_account)
            WHEN 'read' THEN billing.can_view_intent(i, p_account)
            ELSE false END
     FROM billing.payment_intents AS i WHERE i.id = p_subject), false)
$$;

-- Each change of an intent reaches its subject: booking.on_payment_event (H11), verification (H12),
-- community (H17). Until those steps there is no subject to tell (AD-039.1).
CREATE OR REPLACE FUNCTION billing.on_subject_event(p_intent billing.payment_intents, p_event text) RETURNS void
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  CASE p_intent.context
    WHEN 'managed_request' THEN NULL;
    WHEN 'verification' THEN NULL;
    WHEN 'event_registration' THEN NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION billing.notify_finance(p_kind text, p_intent billing.payment_intents) RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT notify.enqueue(p_kind, s.account_id, jsonb_build_object('reference', p_intent.reference, 'amount_aoa', p_intent.amount_total_aoa,
           'description', p_intent.description, 'app', 'admin', 'link', '/payments'))
    FROM identity.staff_members AS s WHERE s.active AND s.level IN ('finance', 'super_admin')
$$;

-- The payer, and in an organisation also its active owners and admins: they are the ones who pay
-- (R-PAY-04; review of H10).
CREATE OR REPLACE FUNCTION billing.notify_payer(p_kind text, p_intent billing.payment_intents, p_extra jsonb DEFAULT '{}') RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT notify.enqueue(p_kind, x.account_id, jsonb_build_object('reference', p_intent.reference,
           'amount_aoa', p_intent.amount_total_aoa, 'description', p_intent.description, 'due_at', p_intent.due_at,
           'app', 'requester', 'link', '/payments') || p_extra)
    FROM (SELECT p_intent.payer_account AS account_id
          UNION
          SELECT m.account_id FROM identity.organization_members AS m
           WHERE m.organization_id = p_intent.organization_id AND m.status = 'active' AND m.role IN ('owner', 'admin')) AS x
$$;

-- R-PAY-12: a receipt, numbered without gaps (the counter is in this transaction), never changed.
-- Not an invoice (D-36, PC-04).
CREATE OR REPLACE FUNCTION billing.issue_receipt(p_kind text, p_intent billing.payment_intents, p_refund billing.refunds DEFAULT NULL)
RETURNS billing.receipts
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_receipt billing.receipts;
  v_name text := (SELECT p.full_name FROM identity.profiles AS p WHERE p.id = p_intent.payer_account);
  v_org text := (SELECT o.name FROM identity.organizations AS o WHERE o.id = p_intent.organization_id);
  v_amount bigint := CASE WHEN p_kind = 'refund' THEN p_refund.amount_aoa ELSE p_intent.amount_total_aoa END;
  v_number text := util.next_code('RC');
BEGIN
  INSERT INTO billing.receipts (number, kind, intent_id, refund_id, amount_aoa, issued_to_name, issued_at, payload)
  VALUES (v_number, p_kind, p_intent.id, p_refund.id, v_amount, coalesce(v_org, v_name), util.now(), jsonb_build_object(
    'number', v_number, 'kind', p_kind, 'issued_at', util.now(), 'issued_to', coalesce(v_org, v_name),
    'description', p_intent.description, 'payment_reference', p_intent.reference,
    'amount_aoa', v_amount, 'base_aoa', CASE WHEN p_kind = 'payment' THEN p_intent.amount_base_aoa END,
    'tax_aoa', CASE WHEN p_kind = 'payment' THEN p_intent.tax_aoa END,
    'refund_reference', p_refund.paid_reference, 'issuer', p_intent.bank_snapshot ->> 'beneficiary',
    'notice', 'Documento não fiscal'))
  RETURNING * INTO v_receipt;
  RETURN v_receipt;
END;
$$;

-- R-PAY-01: every charge starts here, inside the transaction of the function that justifies it.
CREATE OR REPLACE FUNCTION billing.create_intent(p_context text, p_subject uuid, p_payer uuid, p_organization uuid,
  p_description text, p_price bigint, p_version uuid, p_due_at timestamptz)
RETURNS billing.payment_intents
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_split record;
  v_bank jsonb;
  v_intent billing.payment_intents;
BEGIN
  v_bank := jsonb_build_object('bank_name', config.require(p_version, 'academia_bank_name'),
                               'iban', config.require(p_version, 'academia_iban'),
                               'beneficiary', config.require(p_version, 'academia_beneficiary'));
  SELECT * INTO v_split FROM billing.split_amount(p_price, p_version);
  IF EXISTS (SELECT 1 FROM billing.payment_intents AS i WHERE i.context = p_context AND i.subject_id = p_subject
               AND i.status IN ('awaiting_proof', 'proof_submitted', 'confirmed')) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PAYMENT_ALREADY_PENDING';
  END IF;
  INSERT INTO billing.payment_intents (context, subject_id, payer_account, organization_id, description, amount_base_aoa,
    tax_aoa, amount_total_aoa, config_version_id, reference, bank_snapshot, due_at)
  VALUES (p_context, p_subject, p_payer, p_organization, p_description, v_split.base_aoa, v_split.tax_aoa, v_split.total_aoa,
    p_version, util.next_code('PAG'), v_bank, p_due_at)
  RETURNING * INTO v_intent;
  PERFORM billing.notify_payer('payment_requested', v_intent, jsonb_build_object('bank', v_bank));
  RETURN v_intent;
END;
$$;

-- R-PAY-04: the payer (or the paying organisation's owner or admin) registers the proof it uploaded.
CREATE OR REPLACE FUNCTION billing.submit_proof(p_actor uuid, p_intent uuid, p_file_path text)
RETURNS billing.payment_proofs
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_intent billing.payment_intents;
  v_proof billing.payment_proofs;
BEGIN
  SELECT * INTO v_intent FROM billing.payment_intents AS i WHERE i.id = p_intent FOR UPDATE;
  IF v_intent.id IS NULL OR NOT billing.can_view_intent(v_intent, p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND';
  END IF;
  IF NOT billing.can_pay_intent(v_intent, p_actor) THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN'; END IF;
  IF v_intent.status = 'expired' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTENT_EXPIRED'; END IF;
  IF v_intent.status = 'proof_submitted' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PROOF_ALREADY_PENDING'; END IF;
  IF v_intent.status <> 'awaiting_proof' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  -- Past the deadline, even before the job marks it (review of H10).
  IF util.now() >= v_intent.due_at THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTENT_EXPIRED'; END IF;
  -- The file the API signed for this intent, uploaded, and not a proof already registered.
  IF p_file_path IS NULL OR p_file_path NOT LIKE 'payment_proof/' || p_intent || '/%'
     OR NOT EXISTS (SELECT 1 FROM storage.objects AS o WHERE o.bucket_id = 'payment-proofs' AND o.name = p_file_path)
     OR EXISTS (SELECT 1 FROM billing.payment_proofs AS x WHERE x.intent_id = p_intent AND x.file_path = p_file_path) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PROOF_FILE_INVALID';
  END IF;
  INSERT INTO billing.payment_proofs (intent_id, file_path, uploaded_by, uploaded_at)
  VALUES (p_intent, p_file_path, p_actor, util.now()) RETURNING * INTO v_proof;
  UPDATE billing.payment_intents SET status = 'proof_submitted' WHERE id = p_intent RETURNING * INTO v_intent;
  PERFORM billing.on_subject_event(v_intent, 'proof_submitted');
  PERFORM billing.notify_finance('payment_proof_received', v_intent);
  RETURN v_proof;
END;
$$;

-- R-PAY-07: a refund, never more than what was paid in all, only of a confirmed intent. The intent
-- row is locked, so two refunds at once are counted one after the other.
CREATE OR REPLACE FUNCTION billing.create_refund(p_actor uuid, p_intent uuid, p_amount bigint, p_reason_code text,
  p_note text DEFAULT NULL, p_assignment uuid DEFAULT NULL, p_policy jsonb DEFAULT NULL)
RETURNS billing.refunds
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_intent billing.payment_intents;
  v_refund billing.refunds;
BEGIN
  SELECT * INTO v_intent FROM billing.payment_intents AS i WHERE i.id = p_intent FOR UPDATE;
  IF v_intent.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_intent.status <> 'confirmed' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'amount_aoa:invalid';
  END IF;
  IF p_amount + coalesce((SELECT sum(r.amount_aoa) FROM billing.refunds AS r WHERE r.intent_id = p_intent), 0) > v_intent.amount_total_aoa THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REFUND_EXCEEDS_TOTAL';
  END IF;
  INSERT INTO billing.refunds (intent_id, assignment_id, amount_aoa, reason_code, note, policy_snapshot, created_by)
  VALUES (p_intent, p_assignment, p_amount, p_reason_code, nullif(trim(coalesce(p_note, '')), ''), p_policy, p_actor)
  RETURNING * INTO v_refund;
  PERFORM billing.notify_payer('refund_created', v_intent, jsonb_build_object('refund_aoa', p_amount));
  RETURN v_refund;
END;
$$;

-- R-PAY-05: finance accepts or refuses a pending proof.
CREATE OR REPLACE FUNCTION billing.review_proof(p_actor uuid, p_proof uuid, p_accept boolean, p_reason text DEFAULT NULL)
RETURNS billing.payment_intents
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['finance']);
  v_intent billing.payment_intents;
  v_proof billing.payment_proofs;
  v_before text;
BEGIN
  IF NOT p_accept AND length(trim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reason:required';
  END IF;
  SELECT i.* INTO v_intent FROM billing.payment_intents AS i JOIN billing.payment_proofs AS p ON p.intent_id = i.id
   WHERE p.id = p_proof FOR UPDATE OF i;
  SELECT * INTO v_proof FROM billing.payment_proofs AS p WHERE p.id = p_proof FOR UPDATE;
  IF v_proof.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_proof.review_status <> 'pending' OR v_intent.status <> 'proof_submitted' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED';
  END IF;
  v_before := v_intent.status;
  IF p_accept THEN
    UPDATE billing.payment_proofs SET review_status = 'accepted', reviewed_by = p_actor, reviewed_at = util.now() WHERE id = p_proof;
    UPDATE billing.payment_intents SET status = 'confirmed', confirmed_by = p_actor, confirmed_at = util.now()
     WHERE id = v_intent.id RETURNING * INTO v_intent;
    PERFORM billing.issue_receipt('payment', v_intent);
    PERFORM billing.notify_payer('payment_confirmed', v_intent);
    -- R-PAY-06: the subject was cancelled while the proof waited; its refund is created now.
    IF v_intent.subject_cancelled_at IS NOT NULL AND coalesce(v_intent.refund_due_on_confirm_aoa, 0) > 0 THEN
      PERFORM billing.create_refund(NULL, v_intent.id, v_intent.refund_due_on_confirm_aoa,
        v_intent.refund_due_reason_code, 'Assunto cancelado com o comprovativo por validar.', NULL, v_intent.refund_due_policy);
    END IF;
    PERFORM billing.on_subject_event(v_intent, 'confirmed');
  ELSE
    UPDATE billing.payment_proofs SET review_status = 'rejected', rejection_reason = trim(p_reason), reviewed_by = p_actor,
           reviewed_at = util.now() WHERE id = p_proof;
    UPDATE billing.payment_intents SET status = CASE WHEN subject_cancelled_at IS NOT NULL THEN 'cancelled' ELSE 'awaiting_proof' END
     WHERE id = v_intent.id RETURNING * INTO v_intent;
    PERFORM billing.notify_payer('payment_proof_rejected', v_intent, jsonb_build_object('reason', trim(p_reason)));
    PERFORM billing.on_subject_event(v_intent, CASE WHEN v_intent.status = 'cancelled' THEN 'cancelled' ELSE 'proof_rejected' END);
  END IF;
  PERFORM audit.record(p_actor, v_level, CASE WHEN p_accept THEN 'payment.proof_accepted' ELSE 'payment.proof_rejected' END,
    'payment_intent', v_intent.id::text, jsonb_build_object('status', v_before),
    jsonb_build_object('status', v_intent.status, 'reason', CASE WHEN p_accept THEN NULL ELSE trim(p_reason) END));
  RETURN v_intent;
END;
$$;

-- R-PAY-06: intents waiting for a proof past their deadline expire (never one with a proof sent);
-- twelve hours before, the payer is warned once.
CREATE OR REPLACE FUNCTION billing.expire_intents() RETURNS integer
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_intent billing.payment_intents;
  v_count integer := 0;
BEGIN
  FOR v_intent IN
    SELECT i.* FROM billing.payment_intents AS i
     WHERE i.status = 'awaiting_proof' AND i.expiring_warned_at IS NULL AND i.due_at - interval '12 hours' <= util.now() AND i.due_at > util.now()
     FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE billing.payment_intents SET expiring_warned_at = util.now() WHERE id = v_intent.id;
    PERFORM billing.notify_payer('payment_expiring', v_intent);
  END LOOP;
  FOR v_intent IN
    SELECT i.* FROM billing.payment_intents AS i WHERE i.status = 'awaiting_proof' AND i.due_at <= util.now()
     ORDER BY i.due_at FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE billing.payment_intents SET status = 'expired' WHERE id = v_intent.id RETURNING * INTO v_intent;
    PERFORM billing.notify_payer('payment_expired', v_intent);
    PERFORM billing.on_subject_event(v_intent, 'expired');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- R-PAY-06: the subject was cancelled. Waiting for a proof → cancelled; with a proof sent → kept,
-- with the refund due if finance later accepts it; confirmed → the refund now. Called by the
-- subjects (H11, H12, H17), which must lock the intent before their own row (lock order: the intent
-- first). Once per subject: a second call changes nothing. The refund never passes what is left
-- to refund (review of H10).
CREATE OR REPLACE FUNCTION billing.cancel_intent_for_subject(p_context text, p_subject uuid, p_refund_aoa bigint, p_reason_code text,
  p_policy jsonb DEFAULT NULL)
RETURNS billing.payment_intents
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_intent billing.payment_intents;
  v_refund bigint;
BEGIN
  IF coalesce(p_refund_aoa, 0) > 0 AND p_reason_code IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR', DETAIL = 'a refund needs its reason code (R-PAY-09)';
  END IF;
  SELECT * INTO v_intent FROM billing.payment_intents AS i
   WHERE i.context = p_context AND i.subject_id = p_subject AND i.status IN ('awaiting_proof', 'proof_submitted', 'confirmed')
   FOR UPDATE;
  IF v_intent.id IS NULL OR v_intent.subject_cancelled_at IS NOT NULL THEN RETURN v_intent; END IF;
  v_refund := least(coalesce(p_refund_aoa, 0),
                    v_intent.amount_total_aoa - coalesce((SELECT sum(r.amount_aoa) FROM billing.refunds AS r WHERE r.intent_id = v_intent.id), 0));
  IF v_intent.status = 'awaiting_proof' THEN
    UPDATE billing.payment_intents SET status = 'cancelled', subject_cancelled_at = util.now() WHERE id = v_intent.id RETURNING * INTO v_intent;
  ELSIF v_intent.status = 'proof_submitted' THEN
    UPDATE billing.payment_intents SET subject_cancelled_at = util.now(), refund_due_on_confirm_aoa = v_refund,
           refund_due_reason_code = p_reason_code, refund_due_policy = p_policy WHERE id = v_intent.id RETURNING * INTO v_intent;
  ELSE
    UPDATE billing.payment_intents SET subject_cancelled_at = util.now() WHERE id = v_intent.id RETURNING * INTO v_intent;
    IF v_refund > 0 THEN
      PERFORM billing.create_refund(NULL, v_intent.id, v_refund, p_reason_code, NULL, NULL, p_policy);
    END IF;
  END IF;
  RETURN v_intent;
END;
$$;

-- POST /admin/refunds (R-PAY-07): finance, with a note.
CREATE OR REPLACE FUNCTION billing.create_manual_refund(p_actor uuid, p_intent uuid, p_amount bigint, p_note text)
RETURNS billing.refunds
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['finance']);
  v_refund billing.refunds;
BEGIN
  IF length(trim(coalesce(p_note, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'note:required';
  END IF;
  v_refund := billing.create_refund(p_actor, p_intent, p_amount, 'manual', p_note);
  PERFORM audit.record(p_actor, v_level, 'refund.created', 'refund', v_refund.id::text, NULL,
    jsonb_build_object('intent_id', p_intent, 'amount_aoa', p_amount, 'note', v_refund.note));
  RETURN v_refund;
END;
$$;

-- R-PAY-07, R-PAY-12: finance transferred the refund; a refund receipt is issued.
CREATE OR REPLACE FUNCTION billing.mark_refund_paid(p_actor uuid, p_refund uuid, p_reference text)
RETURNS billing.refunds
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['finance']);
  v_intent billing.payment_intents;
  v_refund billing.refunds;
BEGIN
  IF length(trim(coalesce(p_reference, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reference:required';
  END IF;
  SELECT i.* INTO v_intent FROM billing.payment_intents AS i JOIN billing.refunds AS r ON r.intent_id = i.id
   WHERE r.id = p_refund FOR UPDATE OF i;
  SELECT * INTO v_refund FROM billing.refunds AS r WHERE r.id = p_refund FOR UPDATE;
  IF v_refund.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_refund.status <> 'pending' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  UPDATE billing.refunds SET status = 'paid', paid_reference = trim(p_reference), paid_by = p_actor, paid_at = util.now()
   WHERE id = p_refund RETURNING * INTO v_refund;
  PERFORM billing.issue_receipt('refund', v_intent, v_refund);
  PERFORM billing.notify_payer('refund_paid', v_intent, jsonb_build_object('refund_aoa', v_refund.amount_aoa));
  PERFORM audit.record(p_actor, v_level, 'refund.paid', 'refund', p_refund::text, jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'paid', 'reference', v_refund.paid_reference));
  RETURN v_refund;
END;
$$;

-- R-PAY-10, R-PAY-11: a payout in the queue, with a copy of the interpreter's bank details (or
-- none yet: it is told to add them). Called by the managed request (H11).
CREATE OR REPLACE FUNCTION billing.queue_payout(p_assignment uuid, p_interpreter uuid, p_amount bigint) RETURNS billing.payouts
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_details identity.interpreter_payout_details;
  v_payout billing.payouts;
BEGIN
  SELECT * INTO v_details FROM identity.interpreter_payout_details AS d WHERE d.interpreter_id = p_interpreter;
  INSERT INTO billing.payouts (assignment_id, interpreter_id, amount_aoa, payout_details_snapshot)
  VALUES (p_assignment, p_interpreter, p_amount, CASE WHEN v_details.interpreter_id IS NOT NULL THEN
    jsonb_build_object('account_holder', v_details.account_holder, 'bank_name', v_details.bank_name, 'iban', v_details.iban) END)
  ON CONFLICT (assignment_id) DO NOTHING
  RETURNING * INTO v_payout;
  IF v_payout.id IS NOT NULL THEN
    PERFORM notify.enqueue('payout_queued', p_interpreter, jsonb_build_object('amount_aoa', p_amount, 'app', 'interpreter', 'link', '/earnings'));
    IF v_details.interpreter_id IS NULL THEN
      PERFORM notify.enqueue('payout_details_missing', p_interpreter, jsonb_build_object('app', 'interpreter', 'link', '/settings'));
    END IF;
  END IF;
  RETURN v_payout;
END;
$$;

-- R-PAY-10, R-PAY-11: finance transferred the payout; never without the interpreter's details.
CREATE OR REPLACE FUNCTION billing.mark_payout_paid(p_actor uuid, p_payout uuid, p_reference text)
RETURNS billing.payouts
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_level text := identity.assert_staff(p_actor, ARRAY['finance']);
  v_payout billing.payouts;
BEGIN
  IF length(trim(coalesce(p_reference, ''))) < 3 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VALIDATION_FAILED', HINT = 'reference:required';
  END IF;
  SELECT * INTO v_payout FROM billing.payouts AS p WHERE p.id = p_payout FOR UPDATE;
  IF v_payout.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  IF v_payout.status <> 'queued' THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATE_CHANGED'; END IF;
  IF v_payout.payout_details_snapshot IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PAYOUT_DETAILS_MISSING'; END IF;
  UPDATE billing.payouts SET status = 'paid', paid_reference = trim(p_reference), paid_by = p_actor, paid_at = util.now()
   WHERE id = p_payout RETURNING * INTO v_payout;
  PERFORM notify.enqueue('payout_paid', v_payout.interpreter_id, jsonb_build_object('amount_aoa', v_payout.amount_aoa,
    'reference', v_payout.paid_reference, 'app', 'interpreter', 'link', '/earnings'));
  PERFORM audit.record(p_actor, v_level, 'payout.paid', 'payout', p_payout::text, jsonb_build_object('status', 'queued'),
    jsonb_build_object('status', 'paid', 'reference', v_payout.paid_reference));
  RETURN v_payout;
END;
$$;

-- R-PAY-10: a payout that will not be paid (a dispute resolved as cancelled, H11).
CREATE OR REPLACE FUNCTION billing.cancel_payout(p_assignment uuid, p_reason text) RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
  UPDATE billing.payouts SET status = 'cancelled', cancelled_reason = p_reason WHERE assignment_id = p_assignment AND status = 'queued'
$$;

-- PUT /me/payout-details (R-PAY-11): the interpreter's own details; every payout still queued takes
-- the new copy, so a corrected IBAN is the one finance pays (AD-039.11).
CREATE OR REPLACE FUNCTION identity.save_payout_details(p_actor uuid, p_holder text, p_bank text, p_iban text)
RETURNS identity.interpreter_payout_details
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_row identity.interpreter_payout_details;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM identity.interpreter_profiles AS i WHERE i.account_id = p_actor) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FORBIDDEN';
  END IF;
  INSERT INTO identity.interpreter_payout_details AS d (interpreter_id, account_holder, bank_name, iban)
  VALUES (p_actor, trim(p_holder), trim(p_bank), upper(replace(coalesce(p_iban, ''), ' ', '')))
  ON CONFLICT (interpreter_id) DO UPDATE SET account_holder = EXCLUDED.account_holder, bank_name = EXCLUDED.bank_name, iban = EXCLUDED.iban
  RETURNING * INTO v_row;
  UPDATE billing.payouts SET payout_details_snapshot = jsonb_build_object('account_holder', v_row.account_holder,
           'bank_name', v_row.bank_name, 'iban', v_row.iban)
   WHERE interpreter_id = p_actor AND status = 'queued';
  RETURN v_row;
END;
$$;

-- GET /receipts/:id/pdf: the receipt for whoever reads its intent.
CREATE OR REPLACE FUNCTION billing.receipt_for(p_actor uuid, p_receipt uuid) RETURNS billing.receipts
  LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_receipt billing.receipts;
BEGIN
  SELECT r.* INTO v_receipt FROM billing.receipts AS r JOIN billing.payment_intents AS i ON i.id = r.intent_id
   WHERE r.id = p_receipt AND billing.can_view_intent(i, p_actor);
  IF v_receipt.id IS NULL THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'NOT_FOUND'; END IF;
  RETURN v_receipt;
END;
$$;

-- Views ------------------------------------------------------------------------------------------

-- The payments as the payer's side and finance read them (requester-web /payments, the payment
-- block): the amounts as the intent says (never computed by a screen, R-PAY-03), the bank data,
-- the last proof, the refunds and the receipts.
CREATE OR REPLACE VIEW billing.payment_details WITH (security_invoker = false) AS
SELECT i.id, i.context, i.subject_id, i.payer_account, i.organization_id, i.description, i.amount_base_aoa, i.tax_aoa,
       i.amount_total_aoa, i.reference, i.bank_snapshot, i.status, i.due_at, i.confirmed_at, i.subject_cancelled_at, i.created_at,
       p.id AS last_proof_id, p.review_status AS last_proof_status, p.rejection_reason AS last_rejection_reason,
       p.uploaded_at AS last_proof_uploaded_at, p.file_path AS last_proof_path,
       coalesce((SELECT sum(r.amount_aoa) FROM billing.refunds AS r WHERE r.intent_id = i.id AND r.status = 'paid'), 0)::bigint AS refunded_aoa,
       coalesce((SELECT jsonb_agg(jsonb_build_object('id', c.id, 'number', c.number, 'kind', c.kind, 'amount_aoa', c.amount_aoa,
                   'issued_at', c.issued_at) ORDER BY c.issued_at) FROM billing.receipts AS c WHERE c.intent_id = i.id), '[]') AS receipts,
       (SELECT auth_helper.can_pay(i.id)) AS can_pay,
       (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = i.payer_account) AS payer_name,
       (SELECT o.name FROM identity.organizations AS o WHERE o.id = i.organization_id) AS organization_name,
       coalesce((SELECT sum(r.amount_aoa) FROM billing.refunds AS r WHERE r.intent_id = i.id AND r.status = 'pending'), 0)::bigint AS refund_pending_aoa
  FROM billing.payment_intents AS i
  LEFT JOIN LATERAL (SELECT * FROM billing.payment_proofs AS x WHERE x.intent_id = i.id ORDER BY x.uploaded_at DESC LIMIT 1) AS p ON true
 WHERE (SELECT auth_helper.can_view_payment(i.id));

-- admin-web /payments: the proofs (pending first, oldest first; state=all the history) for finance.
CREATE OR REPLACE VIEW billing.proof_queue WITH (security_invoker = false) AS
SELECT p.id, p.intent_id, p.file_path, p.uploaded_at, p.review_status, p.rejection_reason, p.reviewed_at,
       (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = p.reviewed_by) AS reviewed_by_name,
       (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = p.uploaded_by) AS uploaded_by_name,
       i.reference, i.description, i.amount_total_aoa, i.amount_base_aoa, i.tax_aoa, i.context, i.status AS intent_status, i.due_at,
       i.subject_cancelled_at,
       coalesce((SELECT o.name FROM identity.organizations AS o WHERE o.id = i.organization_id),
                (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = i.payer_account)) AS payer_name
  FROM billing.payment_proofs AS p JOIN billing.payment_intents AS i ON i.id = p.intent_id
 WHERE (SELECT auth_helper.is_staff(ARRAY['finance']));

-- admin-web /refunds, and the refunds of the payer's own payments.
CREATE OR REPLACE VIEW billing.refund_details WITH (security_invoker = false) AS
SELECT r.id, r.intent_id, r.assignment_id, r.amount_aoa, r.reason_code,
       -- The note is finance's; the payer side reads the reason only.
       CASE WHEN (SELECT auth_helper.is_staff(ARRAY['finance'])) THEN r.note END AS note, r.status, r.paid_reference, r.paid_at, r.created_at,
       i.reference AS payment_reference, i.description, i.amount_total_aoa,
       coalesce((SELECT o.name FROM identity.organizations AS o WHERE o.id = i.organization_id),
                (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = i.payer_account)) AS payer_name
  FROM billing.refunds AS r JOIN billing.payment_intents AS i ON i.id = r.intent_id
 WHERE (SELECT auth_helper.is_staff(ARRAY['finance'])) OR (SELECT auth_helper.can_view_payment(i.id));

-- admin-web /payouts and interpreter-web /earnings: the interpreter its own, finance all.
CREATE OR REPLACE VIEW billing.payout_details WITH (security_invoker = false) AS
SELECT p.id, p.assignment_id, p.interpreter_id, p.amount_aoa, p.status, p.payout_details_snapshot, p.paid_reference, p.paid_at,
       p.cancelled_reason, p.created_at,
       (SELECT pr.full_name FROM identity.profiles AS pr WHERE pr.id = p.interpreter_id) AS interpreter_name,
       r.code AS request_code, s.title AS service_title, r.starts_at
  FROM billing.payouts AS p
  JOIN booking.request_assignments AS a ON a.id = p.assignment_id
  JOIN booking.requests AS r ON r.id = a.request_id
  JOIN catalog.services AS s ON s.id = r.service_id
 WHERE (SELECT auth_helper.is_staff(ARRAY['finance']))
    OR ((SELECT auth_helper.is_active()) AND p.interpreter_id = (SELECT auth_helper.account_id()));

-- interpreter-web /settings: the interpreter's own details to receive.
CREATE OR REPLACE VIEW identity.my_payout_details WITH (security_invoker = false) AS
SELECT d.interpreter_id, d.account_holder, d.bank_name, d.iban, d.updated_at
  FROM identity.interpreter_payout_details AS d
 WHERE d.interpreter_id = (SELECT auth_helper.account_id()) AND (SELECT auth_helper.is_active());
