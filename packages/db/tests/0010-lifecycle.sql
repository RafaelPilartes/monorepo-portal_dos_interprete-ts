-- Named assertions for step H8 (service-lifecycle.md criteria 1 to 5; accounts-and-organizations.md
-- criterion 5, the requests part). Rolled back. The clock is frozen (util.test_clock) and moved.
-- d1 Rita (requester), d2 Ivo and d3 Tó (LGA, online), d9 Mo (moderator).

UPDATE config.platform_versions SET status = 'published', published_at = now()
 WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published');
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000d1', 'rita.life@exemplo.ao', '{"full_name": "Rita Ciclo"}'),
  ('00000000-0000-4000-8000-0000000000d2', 'ivo.life@exemplo.ao', '{"full_name": "Ivo Ciclo"}'),
  ('00000000-0000-4000-8000-0000000000d3', 'to.life@exemplo.ao', '{"full_name": "Tó Ciclo"}'),
  ('00000000-0000-4000-8000-0000000000d9', 'mo.life@exemplo.ao', '{"full_name": "Mo Moderador"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000d_';
INSERT INTO identity.staff_members (account_id, level) VALUES ('00000000-0000-4000-8000-0000000000d9', 'moderator');
DELETE FROM util.test_clock;
INSERT INTO util.test_clock (frozen_at) VALUES (date_trunc('minute', now()));

CREATE TEMP TABLE h8 (key text PRIMARY KEY, id uuid);
GRANT ALL ON h8 TO authenticated;
DO $$
DECLARE
  v_service uuid := (SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1);
  v_who uuid;
BEGIN
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000d1', NULL, NULL, 'Luanda');
  FOREACH v_who IN ARRAY ARRAY['00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000d3']::uuid[] LOOP
    PERFORM identity.become_interpreter(v_who, NULL, NULL);
    UPDATE identity.interpreter_profiles SET bio = repeat('Intérprete com experiência em saúde e justiça. ', 3),
           modality = 'online' WHERE account_id = v_who;
    INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
    SELECT v_who, id, 'fluent' FROM catalog.languages WHERE code = 'lga';
    INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa) VALUES (v_who, v_service, 10000);
  END LOOP;
  INSERT INTO h8 VALUES ('service', v_service), ('lga', (SELECT id FROM catalog.languages WHERE code = 'lga'));
END $$;

-- A direct request for one interpreter, accepted, starting in 3 days (from the frozen clock).
CREATE FUNCTION pg_temp.accepted_request(p_interpreter uuid, p_days integer DEFAULT 3) RETURNS booking.requests
  LANGUAGE plpgsql AS $$
DECLARE v_request booking.requests;
BEGIN
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000d1', jsonb_build_object(
    'kind', 'direct', 'service_id', (SELECT id FROM h8 WHERE key = 'service'),
    'language_ids', jsonb_build_array((SELECT id FROM h8 WHERE key = 'lga')),
    'modality', 'online', 'meeting_link', 'https://meet.exemplo.ao/c', 'starts_at', util.now() + p_days * interval '1 day',
    'duration_minutes', 60, 'interpreters_needed', 1, 'interpreter_ids', jsonb_build_array(p_interpreter),
    'beneficiary_name', 'Senhor Beneficiário', 'expected_total_aoa', 10000));
  PERFORM booking.accept_assignment(p_interpreter,
    (SELECT a.id FROM booking.request_assignments AS a WHERE a.request_id = v_request.id));
  SELECT * INTO v_request FROM booking.requests WHERE id = v_request.id;
  RETURN v_request;
END $$;
CREATE FUNCTION pg_temp.at(p_when timestamptz) RETURNS void LANGUAGE sql AS $$ UPDATE util.test_clock SET frozen_at = p_when $$;
CREATE FUNCTION pg_temp.assignment_of(p_request uuid) RETURNS booking.request_assignments
  LANGUAGE sql AS $$ SELECT * FROM booking.request_assignments WHERE request_id = p_request ORDER BY created_at DESC LIMIT 1 $$;

-- directory.late_cancellations answers active sessions only: read it as Rita.
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated"}', true); END $$;

-- Criteria 1 and 2: late is strictly less than 24 hours before the start, only on accepted places.
DO $$
DECLARE
  v_late booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2');
  v_free booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2', 4);
  v_edge booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2', 5);
  v_code text;
  v_now timestamptz := util.now();
BEGIN
  IF (SELECT late_count FROM directory.late_cancellations WHERE account_id = '00000000-0000-4000-8000-0000000000d1') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL - no late cancellation yet';
  END IF;
  BEGIN PERFORM booking.cancel_request('00000000-0000-4000-8000-0000000000d1', v_late.id, ' ');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - a cancellation needs a reason (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM booking.cancel_request('00000000-0000-4000-8000-0000000000d3', v_late.id, 'Não é meu');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'NOT_FOUND' THEN RAISE EXCEPTION 'FAIL - only the requester''s side or the team cancels the request (got %)', v_code; END IF;

  PERFORM pg_temp.at(v_late.starts_at - interval '23 hours');
  PERFORM booking.cancel_request('00000000-0000-4000-8000-0000000000d1', v_late.id, 'Mudança de planos');
  IF NOT (pg_temp.assignment_of(v_late.id)).late_cancellation OR (pg_temp.assignment_of(v_late.id)).cancelled_by_role <> 'requester'
     OR (SELECT status FROM booking.requests WHERE id = v_late.id) <> 'cancelled'
     OR (SELECT late_count FROM directory.late_cancellations WHERE account_id = '00000000-0000-4000-8000-0000000000d1') IS DISTINCT FROM 1
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_cancelled' AND account_id = '00000000-0000-4000-8000-0000000000d2')
     OR (SELECT closes_at FROM booking.threads WHERE request_id = v_late.id LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'FAIL - cancelling 23 hours before marks the accepted place late, counts 1 against the requester, tells the interpreter';
  END IF;
  v_code := NULL;
  BEGIN PERFORM booking.cancel_request('00000000-0000-4000-8000-0000000000d1', v_late.id, 'Outra vez');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - a cancelled request is not cancelled again (got %)', v_code; END IF;

  PERFORM pg_temp.at(v_free.starts_at - interval '25 hours');
  PERFORM booking.cancel_request('00000000-0000-4000-8000-0000000000d1', v_free.id, 'Mudança de planos');
  PERFORM pg_temp.at(v_edge.starts_at - interval '24 hours');
  PERFORM booking.cancel_request('00000000-0000-4000-8000-0000000000d1', v_edge.id, 'Mudança de planos');
  IF (pg_temp.assignment_of(v_free.id)).late_cancellation OR (pg_temp.assignment_of(v_edge.id)).late_cancellation
     OR (SELECT late_count FROM directory.late_cancellations WHERE account_id = '00000000-0000-4000-8000-0000000000d1') <> 1 THEN
    RAISE EXCEPTION 'FAIL - cancelling 25 hours, or exactly 24 hours, before marks nothing';
  END IF;
  PERFORM pg_temp.at(v_now);
  RAISE NOTICE 'ok - a cancellation under 24 hours is late and counted; at 25 hours or exactly 24 it is not (criteria 1, 2; D-22)';
END $$;

-- R-LIFE-02: the interpreter cancels its place; late counts against it; the place reopens.
DO $$
DECLARE
  v_request booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2', 9);
  v_now timestamptz := util.now();
BEGIN
  PERFORM pg_temp.at(v_request.starts_at - interval '2 hours');
  PERFORM booking.cancel_assignment('00000000-0000-4000-8000-0000000000d2', (pg_temp.assignment_of(v_request.id)).id, 'Fiquei doente');
  IF NOT (pg_temp.assignment_of(v_request.id)).late_cancellation
     OR (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'awaiting_interpreters'
     OR (SELECT late_count FROM directory.late_cancellations WHERE account_id = '00000000-0000-4000-8000-0000000000d2') IS DISTINCT FROM 1
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_cancelled' AND account_id = '00000000-0000-4000-8000-0000000000d1') THEN
    RAISE EXCEPTION 'FAIL - the interpreter cancelling 2 hours before is late, the place reopens and the requester is told';
  END IF;
  PERFORM pg_temp.at(v_now);
  RAISE NOTICE 'ok - the interpreter cancels its place: late within 24 hours, the request waits for interpreters again (R-LIFE-02)';
END $$;

-- Criteria 3 and 4: done only after the end; confirmed by the clock after completion_auto_confirm_hours.
DO $$
DECLARE
  v_request booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2', 6);
  v_assignment uuid := (pg_temp.assignment_of(v_request.id)).id;
  v_hours integer := config.require(v_request.config_version_id, 'completion_auto_confirm_hours')::integer;
  v_confirmed integer;
  v_code text;
  v_now timestamptz := util.now();
BEGIN
  PERFORM pg_temp.at(v_request.starts_at + interval '30 minutes');
  BEGIN PERFORM booking.mark_delivered('00000000-0000-4000-8000-0000000000d2', v_assignment);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'NOT_FINISHED_YET' THEN RAISE EXCEPTION 'FAIL - marking as done before the end is refused (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM booking.confirm_delivery('00000000-0000-4000-8000-0000000000d1', v_assignment);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - what was not marked as done is not confirmed (got %)', v_code; END IF;

  PERFORM pg_temp.at(v_request.ends_at);
  PERFORM booking.mark_delivered('00000000-0000-4000-8000-0000000000d2', v_assignment);
  IF (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'delivered'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'delivery_marked' AND account_id = '00000000-0000-4000-8000-0000000000d1') THEN
    RAISE EXCEPTION 'FAIL - marking as done at the end delivers the request and tells the requester';
  END IF;
  PERFORM pg_temp.at(v_request.ends_at + (v_hours * interval '1 hour') - interval '1 minute');
  IF booking.auto_confirm_deliveries() <> 0 THEN RAISE EXCEPTION 'FAIL - nothing is confirmed before the deadline'; END IF;
  PERFORM pg_temp.at(v_request.ends_at + v_hours * interval '1 hour');
  v_confirmed := booking.auto_confirm_deliveries();
  IF v_confirmed <> 1 OR (pg_temp.assignment_of(v_request.id)).completed_via IS DISTINCT FROM 'auto'
     OR (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'completed'
     OR (SELECT closes_at FROM booking.threads WHERE request_id = v_request.id LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'FAIL - an unanswered delivery is completed by the clock, the request completes, the chat closes';
  END IF;
  PERFORM pg_temp.at(v_now);
  RAISE NOTICE 'ok - done only after the end (NOT_FINISHED_YET); confirmed automatically after % hours (criteria 3, 4)', v_hours;
END $$;

-- Criterion 5 and R-LIFE-06: an open dispute stops the clock; a moderator who is not a party resolves.
DO $$
DECLARE
  v_request booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2', 7);
  v_assignment uuid := (pg_temp.assignment_of(v_request.id)).id;
  v_dispute booking.disputes;
  v_code text;
  v_now timestamptz := util.now();
BEGIN
  PERFORM pg_temp.at(v_request.ends_at);
  PERFORM booking.mark_delivered('00000000-0000-4000-8000-0000000000d2', v_assignment);
  v_dispute := booking.open_dispute('00000000-0000-4000-8000-0000000000d1', v_assignment, 'O intérprete não apareceu');
  BEGIN PERFORM booking.open_dispute('00000000-0000-4000-8000-0000000000d2', v_assignment, 'Apareci sim');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'DISPUTE_OPEN' THEN RAISE EXCEPTION 'FAIL - one open dispute per assignment (got %)', v_code; END IF;
  IF (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'disputed'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'dispute_opened' AND account_id = '00000000-0000-4000-8000-0000000000d2')
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'dispute_opened' AND account_id = '00000000-0000-4000-8000-0000000000d9') THEN
    RAISE EXCEPTION 'FAIL - a dispute marks the request disputed and tells the other party and the moderators';
  END IF;
  PERFORM pg_temp.at(v_request.ends_at + interval '30 days');
  PERFORM booking.auto_confirm_deliveries();
  IF (pg_temp.assignment_of(v_request.id)).status <> 'disputed' THEN
    RAISE EXCEPTION 'FAIL - an open dispute stops the automatic confirmation';
  END IF;
  v_code := NULL;
  BEGIN PERFORM booking.resolve_dispute('00000000-0000-4000-8000-0000000000d1', v_dispute.id, 'completed', 'Decido eu');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - only a moderator resolves (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM booking.resolve_dispute('00000000-0000-4000-8000-0000000000d9', v_dispute.id, 'completed', ' ');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - resolving needs notes (got %)', v_code; END IF;
  PERFORM booking.resolve_dispute('00000000-0000-4000-8000-0000000000d9', v_dispute.id, 'completed', 'O chat mostra o serviço feito.');
  IF (pg_temp.assignment_of(v_request.id)).completed_via IS DISTINCT FROM 'staff'
     OR (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'completed'
     OR NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'dispute.resolved' AND entity_id = v_dispute.id::text)
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'dispute_resolved' AND account_id = '00000000-0000-4000-8000-0000000000d1') THEN
    RAISE EXCEPTION 'FAIL - resolving as completed completes the assignment and the request, audited, both parties told';
  END IF;
  PERFORM pg_temp.at(v_now);
  RAISE NOTICE 'ok - an open dispute stops the automatic confirmation; a moderator resolves with notes (criterion 5, R-LIFE-06)';
END $$;

-- R-LIFE-07: a dispute resolved as cancelled after the start ends the request; it does not reopen.
DO $$
DECLARE
  v_request booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2', 8);
  v_dispute booking.disputes;
  v_now timestamptz := util.now();
BEGIN
  PERFORM pg_temp.at(v_request.starts_at + interval '10 minutes');
  v_dispute := booking.open_dispute('00000000-0000-4000-8000-0000000000d2', (pg_temp.assignment_of(v_request.id)).id, 'Ninguém entrou na chamada');
  PERFORM booking.resolve_dispute('00000000-0000-4000-8000-0000000000d9', v_dispute.id, 'cancelled', 'O serviço não aconteceu.');
  IF (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'cancelled' THEN
    RAISE EXCEPTION 'FAIL - a dispute resolved as cancelled after the start cancels the request (got %)',
      (SELECT status FROM booking.requests WHERE id = v_request.id);
  END IF;
  PERFORM pg_temp.at(v_now);
  RAISE NOTICE 'ok - a dispute resolved as cancelled after the start does not reopen the place (R-LIFE-07)';
END $$;

-- The parties read their dispute; others do not.
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d3", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM booking.dispute_details) THEN RAISE EXCEPTION 'FAIL - a stranger reads no dispute'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT count(*) FROM booking.dispute_details) <> 2 THEN RAISE EXCEPTION 'FAIL - the requester reads its disputes'; END IF;
  RAISE NOTICE 'ok - the parties read their disputes, nobody else does';
END $$;
RESET ROLE;

-- Accounts criterion 5: suspending an interpreter with an accepted request for tomorrow cancels the
-- place and tells the requester, in the suspension's transaction; a forced error changes nothing.
DO $$
DECLARE
  v_started booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d3', 1);
  v_tomorrow booking.requests := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d3', 2);
BEGIN
  INSERT INTO h8 VALUES ('tomorrow', v_tomorrow.id), ('started', v_started.id);
  PERFORM pg_temp.at(v_started.starts_at + interval '5 minutes');
END $$;
CREATE FUNCTION pg_temp.fail_suspended() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'forced failure'; END $$;
-- The last write of the suspension: the email to the suspended account.
CREATE TRIGGER fail_suspended BEFORE INSERT ON notify.email_outbox FOR EACH ROW
  WHEN (NEW.template = 'account_suspended') EXECUTE FUNCTION pg_temp.fail_suspended();
DO $$
DECLARE v_failed boolean := false;
BEGIN
  BEGIN PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000d9', '00000000-0000-4000-8000-0000000000d3', 'Fraude comprovada');
  EXCEPTION WHEN raise_exception THEN v_failed := true; END;
  IF NOT v_failed OR (pg_temp.assignment_of((SELECT id FROM h8 WHERE key = 'tomorrow'))).status <> 'accepted'
     OR EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'account_suspended_counterparty') THEN
    RAISE EXCEPTION 'FAIL - a suspension that fails half-way leaves the assignments as they were';
  END IF;
END $$;
DROP TRIGGER fail_suspended ON notify.email_outbox;
DO $$
DECLARE
  v_tomorrow uuid := (SELECT id FROM h8 WHERE key = 'tomorrow');
  v_started uuid := (SELECT id FROM h8 WHERE key = 'started');
BEGIN
  PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000d9', '00000000-0000-4000-8000-0000000000d3', 'Fraude comprovada');
  IF (pg_temp.assignment_of(v_tomorrow)).status <> 'cancelled' OR (pg_temp.assignment_of(v_tomorrow)).cancelled_by_role <> 'staff'
     OR (pg_temp.assignment_of(v_tomorrow)).late_cancellation
     OR (SELECT status FROM booking.requests WHERE id = v_tomorrow) <> 'awaiting_interpreters'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'account_suspended_counterparty' AND account_id = '00000000-0000-4000-8000-0000000000d1')
     OR EXISTS (SELECT 1 FROM directory.listed_interpreters WHERE account_id = '00000000-0000-4000-8000-0000000000d3') THEN
    RAISE EXCEPTION 'FAIL - suspending the interpreter cancels tomorrow''s place (never late), tells the requester, unlists it';
  END IF;
  IF (pg_temp.assignment_of(v_started)).status <> 'accepted' THEN
    RAISE EXCEPTION 'FAIL - a service already started stays as it was';
  END IF;
  RAISE NOTICE 'ok - suspending an interpreter cancels what has not started, in one transaction (accounts criterion 5, R-ACC-05)';
END $$;

-- A suspended requester: the requests it created and that have not started are cancelled.
DO $$
DECLARE
  v_request booking.requests;
  v_started uuid := (SELECT id FROM h8 WHERE key = 'started');
BEGIN
  v_request := pg_temp.accepted_request('00000000-0000-4000-8000-0000000000d2', 2);
  PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000d9', '00000000-0000-4000-8000-0000000000d1', 'Fraude comprovada');
  IF (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'cancelled'
     OR (SELECT cancelled_by_role FROM booking.requests WHERE id = v_request.id) <> 'staff'
     OR (pg_temp.assignment_of(v_request.id)).late_cancellation
     OR (SELECT status FROM booking.requests WHERE id = (SELECT id FROM h8 WHERE key = 'tomorrow')) <> 'cancelled'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'account_suspended_counterparty' AND account_id = '00000000-0000-4000-8000-0000000000d2') THEN
    RAISE EXCEPTION 'FAIL - suspending the requester cancels its requests not yet started and tells the interpreters';
  END IF;
  IF (SELECT status FROM booking.requests WHERE id = v_started) NOT IN ('confirmed') THEN
    RAISE EXCEPTION 'FAIL - the requester''s started service stays (got %)', (SELECT status FROM booking.requests WHERE id = v_started);
  END IF;
  RAISE NOTICE 'ok - suspending a requester cancels its requests not yet started, never late (R-ACC-05)';
END $$;
DELETE FROM util.test_clock;
