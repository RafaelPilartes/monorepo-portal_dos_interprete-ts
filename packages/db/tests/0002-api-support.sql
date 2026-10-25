-- Named assertions for the SQL the API calls (step G): account status, staff level, file access
-- and the email worker's state machine. Rolled back by scripts/run-tests.sh.

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-4000-8000-0000000000e1', 'eva@example.ao');

DO $$
BEGIN
  IF auth_helper.account_status('00000000-0000-4000-8000-0000000000e1') <> 'active'
     OR auth_helper.account_status('00000000-0000-4000-8000-0000000000ff') <> 'unknown' THEN
    RAISE EXCEPTION 'FAIL - account_status: active for an existing account, unknown otherwise';
  END IF;
  IF auth_helper.staff_level_of('00000000-0000-4000-8000-0000000000e1') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL - staff_level_of is NULL until H1 creates the staff table';
  END IF;
  RAISE NOTICE 'ok - account_status and staff_level_of answer for the API auth plugin';
END $$;

DO $$
DECLARE v_allowed int;
BEGIN
  SELECT count(*) INTO v_allowed
    FROM unnest(ARRAY['payment_proof', 'verification_document', 'chat_attachment', 'ticket_attachment', 'avatar']) AS p (purpose)
   CROSS JOIN unnest(ARRAY['write', 'read', 'delete']) AS m (mode)
   WHERE util.can_access_file('00000000-0000-4000-8000-0000000000e1', p.purpose, gen_random_uuid(), m.mode);
  IF v_allowed <> 0 OR util.can_access_file(NULL, 'payment_proof', gen_random_uuid(), 'read') THEN
    RAISE EXCEPTION 'FAIL - no file is reachable until its step fills the purpose (% allowed)', v_allowed;
  END IF;
  RAISE NOTICE 'ok - util.can_access_file refuses every purpose and mode until each step fills it';
END $$;

DO $$
DECLARE v_id uuid; v_claimed int; v_row record;
BEGIN
  v_id := notify.enqueue_email('org_invite', 'claim@example.ao', '{}');
  INSERT INTO util.test_clock (frozen_at) VALUES (now() + interval '1 second');
  SELECT count(*) INTO v_claimed FROM notify.claim_emails(20) AS c WHERE c.id = v_id;
  SELECT status, attempts, next_attempt_at INTO v_row FROM notify.email_outbox WHERE id = v_id;
  IF v_claimed <> 1 OR v_row.status <> 'sending' OR v_row.attempts <> 1
     OR v_row.next_attempt_at <> util.now() + interval '15 minutes' THEN
    RAISE EXCEPTION 'FAIL - claim_emails takes a due email and leases it for 15 minutes';
  END IF;
  SELECT count(*) INTO v_claimed FROM notify.claim_emails(20) AS c WHERE c.id = v_id;
  IF v_claimed <> 0 THEN RAISE EXCEPTION 'FAIL - a leased email is not claimed again before the lease ends'; END IF;
  PERFORM notify.mark_email_failed(v_id, repeat('x', 900));
  SELECT status, next_attempt_at, length(last_error) AS error_length INTO v_row FROM notify.email_outbox WHERE id = v_id;
  IF v_row.status <> 'queued' OR v_row.next_attempt_at <> util.now() + interval '1 minute' OR v_row.error_length <> 500 THEN
    RAISE EXCEPTION 'FAIL - mark_email_failed requeues after 1 minute and keeps 500 characters of the error';
  END IF;
  -- A late outcome for a row that is no longer `sending` changes nothing.
  PERFORM notify.mark_email_sent(v_id);
  IF (SELECT status FROM notify.email_outbox WHERE id = v_id) <> 'queued' THEN
    RAISE EXCEPTION 'FAIL - mark_email_sent only touches an email that is being sent';
  END IF;
  DELETE FROM util.test_clock;
  RAISE NOTICE 'ok - the email outbox state machine: claim with a lease, retry, and no late overwrite';
END $$;

SET LOCAL ROLE authenticated;
DO $$
DECLARE v_refused int := 0;
BEGIN
  BEGIN PERFORM notify.claim_emails(1); EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN PERFORM util.can_access_file(NULL, 'payment_proof', NULL, 'read'); EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN PERFORM auth_helper.account_status(NULL); EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  IF v_refused <> 3 THEN RAISE EXCEPTION 'FAIL - the session cannot run the API-only functions (% of 3)', v_refused; END IF;
  RAISE NOTICE 'ok - the session cannot run the email worker, file access or account status functions';
END $$;
RESET ROLE;
