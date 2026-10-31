-- Named assertions for step H5 (requests-core.md criteria 1, 2, 4, 5, 6, 7; requests-direct.md
-- criteria 1–5). Rolled back. f1 Rita (requester), f2 Ivo (interpreter, LGA, both modalities),
-- f3 Sara (interpreter, Portuguese only), f4 Tó (interpreter, LGA, online only).

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000f1', 'rita@exemplo.ao', '{"full_name": "Rita Requerente"}'),
  ('00000000-0000-4000-8000-0000000000f2', 'ivo@exemplo.ao', '{"full_name": "Ivo Intérprete"}'),
  ('00000000-0000-4000-8000-0000000000f3', 'sara@exemplo.ao', '{"full_name": "Sara Português"}'),
  ('00000000-0000-4000-8000-0000000000f4', 'to@exemplo.ao', '{"full_name": "Tó Online"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000f_';

-- The configuration in force (bootstrap-admin publishes version 1 on a real database).
UPDATE config.platform_versions SET status = 'published', published_at = now()
 WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published');

CREATE TEMP TABLE h5 (key text PRIMARY KEY, id uuid);
GRANT ALL ON h5 TO authenticated;
DO $$
DECLARE
  v_lga uuid := (SELECT id FROM catalog.languages WHERE code = 'lga');
  v_pt uuid := (SELECT id FROM catalog.languages WHERE code = 'pt');
  v_service uuid := (SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1);
  v_who uuid;
BEGIN
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000f1', NULL, NULL, 'Luanda');
  FOREACH v_who IN ARRAY ARRAY['00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000f3',
                               '00000000-0000-4000-8000-0000000000f4']::uuid[] LOOP
    PERFORM identity.become_interpreter(v_who, NULL, NULL);
    UPDATE identity.interpreter_profiles SET bio = repeat('Intérprete com experiência em saúde e justiça. ', 3),
           modality = 'both', city = 'Luanda', travel_fee_aoa = 2000 WHERE account_id = v_who;
    INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
    VALUES (v_who, CASE WHEN v_who = '00000000-0000-4000-8000-0000000000f3' THEN v_pt ELSE v_lga END, 'fluent');
    INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa) VALUES (v_who, v_service, 6000);
  END LOOP;
  UPDATE identity.interpreter_profiles SET modality = 'online' WHERE account_id = '00000000-0000-4000-8000-0000000000f4';
  INSERT INTO h5 VALUES ('service', v_service), ('lga', v_lga), ('pt', v_pt);
END $$;

-- A valid direct request for Ivo, as the screen sends it; the tests change one field each.
CREATE TEMP TABLE h5_input AS SELECT jsonb_build_object(
  'kind', 'direct', 'service_id', (SELECT id FROM h5 WHERE key = 'service'),
  'language_ids', jsonb_build_array((SELECT id FROM h5 WHERE key = 'lga')),
  'modality', 'online', 'meeting_link', 'https://meet.exemplo.ao/abc',
  'starts_at', now() + interval '3 days', 'duration_minutes', 45, 'interpreters_needed', 1,
  'interpreter_ids', jsonb_build_array('00000000-0000-4000-8000-0000000000f2'),
  'beneficiary_name', 'Senhor Beneficiário') AS input;

DO $$
DECLARE
  v_service uuid := (SELECT id FROM h5 WHERE key = 'service');
  v_config uuid := config.current_version_id();
BEGIN
  -- Criterion 2: minimum 60, step 30.
  IF catalog.quote_service(v_service, 6000, 45, v_config) <> 6000
     OR catalog.quote_service(v_service, 6000, 75, v_config) <> 9000
     OR catalog.quote_service(v_service, 1001, 75, v_config) <> 1502 THEN
    RAISE EXCEPTION 'FAIL - hourly price: 45 min bills 60, 75 bills 90, rounded up to the kwanza';
  END IF;
  IF catalog.quote_service((SELECT id FROM catalog.services WHERE pricing_mode = 'fixed' LIMIT 1), 25000, 300, v_config) <> 25000 THEN
    RAISE EXCEPTION 'FAIL - a fixed price ignores the duration';
  END IF;
  RAISE NOTICE 'ok - catalog.quote_service: minimum, rounding to the step and to the kwanza; fixed ignores the duration (R-REQ-02, criterion 2)';
END $$;

-- Criterion 1: each case of R-REQ-01 fails with its code.
DO $$
DECLARE
  v_base jsonb := (SELECT input FROM h5_input);
  v_total bigint;
  v_case record;
  v_code text;
  v_hint text;
BEGIN
  v_total := (booking.preview_request_total(v_base) ->> 'total_aoa')::bigint;
  IF v_total <> 6000 THEN RAISE EXCEPTION 'FAIL - the preview of one online interpreter for 45 min is 6000 (got %)', v_total; END IF;
  v_base := v_base || jsonb_build_object('expected_total_aoa', v_total);
  FOR v_case IN SELECT * FROM (VALUES
    ('START_TOO_SOON', jsonb_build_object('starts_at', now() + interval '20 minutes')),
    ('DURATION_OUT_OF_RANGE', jsonb_build_object('duration_minutes', 10)),
    ('TOO_MANY_INTERPRETERS', jsonb_build_object('interpreters_needed', 50)),
    ('MEETING_LINK_REQUIRED', jsonb_build_object('meeting_link', null)),
    ('INVALID_MEETING_LINK', jsonb_build_object('meeting_link', 'http://meet.exemplo.ao')),
    ('ADDRESS_REQUIRED', jsonb_build_object('modality', 'in_person')),
    ('LANGUAGE_REQUIRED', jsonb_build_object('language_ids', '[]'::jsonb)),
    ('PRICE_CHANGED', jsonb_build_object('expected_total_aoa', 5000)),
    ('INTERPRETER_NOT_ELIGIBLE', jsonb_build_object('interpreter_ids', jsonb_build_array('00000000-0000-4000-8000-0000000000f3'), 'expected_total_aoa', 6000))
  ) AS c (code, patch) LOOP
    v_code := NULL;
    BEGIN PERFORM booking.create_request('00000000-0000-4000-8000-0000000000f1', v_base || v_case.patch);
    EXCEPTION WHEN raise_exception THEN GET STACKED DIAGNOSTICS v_code = MESSAGE_TEXT, v_hint = PG_EXCEPTION_HINT; END;
    IF v_code IS DISTINCT FROM v_case.code THEN
      RAISE EXCEPTION 'FAIL - % (got %)', v_case.code, v_code;
    END IF;
    IF v_case.code = 'START_TOO_SOON' AND v_hint <> 'params:{"min": 30}' THEN
      RAISE EXCEPTION 'FAIL - START_TOO_SOON carries the minimum (got %)', v_hint;
    END IF;
  END LOOP;
  -- Only requesters create requests.
  v_code := NULL;
  BEGIN PERFORM booking.create_request('00000000-0000-4000-8000-0000000000f3', v_base);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - only a requester creates a request (got %)', v_code; END IF;
  RAISE NOTICE 'ok - each case of R-REQ-01 fails with its own code (criterion 1)';
END $$;

-- The request, the invite, the price offered and the expiry.
DO $$
DECLARE
  v_request booking.requests;
  v_assignment booking.request_assignments;
BEGIN
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000f1',
    (SELECT input FROM h5_input) || jsonb_build_object('expected_total_aoa', 6000));
  INSERT INTO h5 VALUES ('request', v_request.id);
  IF v_request.code !~ '^PI-\d{4}-\d{6}$' OR v_request.status <> 'awaiting_interpreters' OR v_request.is_urgent THEN
    RAISE EXCEPTION 'FAIL - the request has a readable code, waits for interpreters and is not urgent (got %)', to_jsonb(v_request);
  END IF;
  SELECT * INTO v_assignment FROM booking.request_assignments WHERE request_id = v_request.id;
  INSERT INTO h5 VALUES ('assignment', v_assignment.id);
  IF v_assignment.status <> 'invited' OR v_assignment.offered_price_aoa <> 6000 OR v_assignment.offered_travel_fee_aoa <> 0
     OR v_assignment.invite_expires_at > now() + interval '48 hours 1 minute' THEN
    RAISE EXCEPTION 'FAIL - the invite offers the interpreter''s price, no travel fee online, 48 h to answer (got %)', to_jsonb(v_assignment);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM booking.threads WHERE assignment_id = v_assignment.id)
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_invited' AND account_id = '00000000-0000-4000-8000-0000000000f2')
     OR (SELECT count(*) FROM booking.request_events WHERE request_id = v_request.id) <> 2 THEN
    RAISE EXCEPTION 'FAIL - the invite opens the thread, tells the interpreter and is logged';
  END IF;
  RAISE NOTICE 'ok - a direct request with its invite, the price offered, the thread, the notice and the log (R-REQ-01, R-DRC-01)';
END $$;

-- requests-direct criteria 1 and 2: not eligible, and slots full.
DO $$
DECLARE
  v_request uuid := (SELECT id FROM h5 WHERE key = 'request');
  v_code text;
  v_hint text;
BEGIN
  BEGIN PERFORM booking.invite_interpreter('00000000-0000-4000-8000-0000000000f1', v_request, '00000000-0000-4000-8000-0000000000f4');
  EXCEPTION WHEN raise_exception THEN GET STACKED DIAGNOSTICS v_code = MESSAGE_TEXT, v_hint = PG_EXCEPTION_HINT; END;
  IF v_code IS DISTINCT FROM 'SLOTS_FULL' THEN RAISE EXCEPTION 'FAIL - one needed and one pending: SLOTS_FULL (got %)', v_code; END IF;
  UPDATE booking.requests SET interpreters_needed = 2 WHERE id = v_request;
  v_code := NULL;
  BEGIN PERFORM booking.invite_interpreter('00000000-0000-4000-8000-0000000000f1', v_request, '00000000-0000-4000-8000-0000000000f3');
  EXCEPTION WHEN raise_exception THEN GET STACKED DIAGNOSTICS v_code = MESSAGE_TEXT, v_hint = PG_EXCEPTION_HINT; END;
  IF v_code IS DISTINCT FROM 'INTERPRETER_NOT_ELIGIBLE' OR v_hint NOT LIKE 'params:%não interpreta%' THEN
    RAISE EXCEPTION 'FAIL - an interpreter without the language is not eligible, with the reason (got %, %)', v_code, v_hint;
  END IF;
  UPDATE booking.requests SET interpreters_needed = 1 WHERE id = v_request;
  RAISE NOTICE 'ok - not eligible says why; a full request refuses another invite (requests-direct criteria 1, 2)';
END $$;

-- Criteria 4–6 of the core and 3 of direct: accepting fixes the price; the beneficiary only then;
-- the date is locked; overlaps are refused.
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000f2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT beneficiary_name FROM booking.request_details WHERE id = (SELECT id FROM h5 WHERE key = 'request')) IS NOT NULL
     OR NOT EXISTS (SELECT 1 FROM booking.request_details WHERE id = (SELECT id FROM h5 WHERE key = 'request')) THEN
    RAISE EXCEPTION 'FAIL - an invited interpreter sees the request, not the beneficiary';
  END IF;
END $$;
RESET ROLE;
DO $$
DECLARE
  v_assignment booking.request_assignments;
  v_request uuid := (SELECT id FROM h5 WHERE key = 'request');
  v_code text;
BEGIN
  v_assignment := booking.accept_assignment('00000000-0000-4000-8000-0000000000f2', (SELECT id FROM h5 WHERE key = 'assignment'));
  IF v_assignment.agreed_price_aoa <> 6000 OR (SELECT status FROM booking.requests WHERE id = v_request) <> 'confirmed'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_accepted' AND account_id = '00000000-0000-4000-8000-0000000000f1')
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_confirmed' AND account_id = '00000000-0000-4000-8000-0000000000f2') THEN
    RAISE EXCEPTION 'FAIL - accepting fixes the price, confirms the full request and tells both sides';
  END IF;
  UPDATE directory.interpreter_services SET price_aoa = 9999 WHERE interpreter_id = '00000000-0000-4000-8000-0000000000f2';
  IF (SELECT agreed_price_aoa FROM booking.request_assignments WHERE id = v_assignment.id) <> 6000 THEN
    RAISE EXCEPTION 'FAIL - a later profile price does not change the request (requests-direct criterion 3)';
  END IF;
  BEGIN UPDATE booking.requests SET starts_at = starts_at + interval '1 hour' WHERE id = v_request;
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'REQUEST_LOCKED' THEN RAISE EXCEPTION 'FAIL - the time does not change after an acceptance (got %)', v_code; END IF;
  RAISE NOTICE 'ok - accepting fixes the price and confirms; the time is locked (R-DRC-03, R-REQ-06, core criterion 5, direct criterion 3)';
END $$;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000f2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT beneficiary_name FROM booking.request_details WHERE id = (SELECT id FROM h5 WHERE key = 'request')) IS DISTINCT FROM 'Senhor Beneficiário' THEN
    RAISE EXCEPTION 'FAIL - once accepted, the interpreter sees the beneficiary';
  END IF;
  RAISE NOTICE 'ok - the beneficiary is hidden from an invited interpreter and shown once accepted (D-95, core criterion 6)';
END $$;
RESET ROLE;

-- Criterion 4 of the core (Ivo's price is now 9999): with a 30 minute margin, 20 minutes after the end overlaps, 45 does not.
DO $$
DECLARE
  v_first booking.requests := (SELECT r FROM booking.requests AS r WHERE r.id = (SELECT id FROM h5 WHERE key = 'request'));
  v_near booking.requests;
  v_far booking.requests;
  v_code text;
BEGIN
  v_near := booking.create_request('00000000-0000-4000-8000-0000000000f1', (SELECT input FROM h5_input)
    || jsonb_build_object('starts_at', v_first.ends_at + interval '20 minutes', 'expected_total_aoa', 9999));
  v_far := booking.create_request('00000000-0000-4000-8000-0000000000f1', (SELECT input FROM h5_input)
    || jsonb_build_object('starts_at', v_first.ends_at + interval '45 minutes', 'expected_total_aoa', 9999));
  BEGIN PERFORM booking.accept_assignment('00000000-0000-4000-8000-0000000000f2',
          (SELECT id FROM booking.request_assignments WHERE request_id = v_near.id));
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'SCHEDULE_OVERLAP' THEN RAISE EXCEPTION 'FAIL - 20 minutes after the end overlaps (got %)', v_code; END IF;
  PERFORM booking.accept_assignment('00000000-0000-4000-8000-0000000000f2', (SELECT id FROM booking.request_assignments WHERE request_id = v_far.id));
  RAISE NOTICE 'ok - the margin after a service: 20 minutes later overlaps, 45 minutes later does not (R-REQ-05, core criterion 4)';
END $$;

-- Direct criteria 4 and 2 of R-DRC-02: an urgent request's invite expires at the start; then the task.
DO $$
DECLARE
  v_urgent booking.requests;
  v_assignment booking.request_assignments;
BEGIN
  v_urgent := booking.create_request('00000000-0000-4000-8000-0000000000f1', (SELECT input FROM h5_input)
    || jsonb_build_object('starts_at', now() + interval '3 hours', 'expected_total_aoa', 6000,
                          'interpreter_ids', jsonb_build_array('00000000-0000-4000-8000-0000000000f4')));
  SELECT * INTO v_assignment FROM booking.request_assignments WHERE request_id = v_urgent.id;
  IF NOT v_urgent.is_urgent OR v_assignment.invite_expires_at <> v_urgent.starts_at THEN
    RAISE EXCEPTION 'FAIL - an urgent request''s invite expires at the start, not 48 h later';
  END IF;
  INSERT INTO util.test_clock (frozen_at) VALUES (now() + interval '3 hours 1 minute');
  PERFORM booking.expire_invites();
  IF (SELECT status FROM booking.request_assignments WHERE id = v_assignment.id) <> 'expired'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_invite_expired') THEN
    RAISE EXCEPTION 'FAIL - an invite past its deadline expires and the requester is told';
  END IF;
  DELETE FROM util.test_clock;
  RAISE NOTICE 'ok - an urgent invite expires at the start; the task expires it and tells the requester (R-DRC-02, direct criterion 4)';
END $$;

-- Criterion 7 of the core: 1 of 2 at the start → expired, the accepted one told, no late cancellation.
DO $$
DECLARE
  v_two booking.requests;
  v_assignment uuid;
BEGIN
  v_two := booking.create_request('00000000-0000-4000-8000-0000000000f1', (SELECT input FROM h5_input)
    || jsonb_build_object('starts_at', now() + interval '10 days', 'interpreters_needed', 2, 'expected_total_aoa', 9999));
  v_assignment := (SELECT id FROM booking.request_assignments WHERE request_id = v_two.id);
  PERFORM booking.accept_assignment('00000000-0000-4000-8000-0000000000f2', v_assignment);
  INSERT INTO util.test_clock (frozen_at) VALUES (now() + interval '9 days 1 hour');
  PERFORM booking.warn_understaffed();
  IF NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_understaffed_warning' AND account_id = '00000000-0000-4000-8000-0000000000f1') THEN
    RAISE EXCEPTION 'FAIL - a day before, the requester is warned that interpreters are missing';
  END IF;
  UPDATE util.test_clock SET frozen_at = v_two.starts_at;
  PERFORM booking.expire_unstaffed_requests();
  IF (SELECT status FROM booking.requests WHERE id = v_two.id) <> 'expired'
     OR (SELECT status FROM booking.request_assignments WHERE id = v_assignment) <> 'cancelled'
     OR (SELECT late_cancellation FROM booking.request_assignments WHERE id = v_assignment)
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'request_expired' AND account_id = '00000000-0000-4000-8000-0000000000f2') THEN
    RAISE EXCEPTION 'FAIL - a request still short at the start expires; the accepted interpreter is released and told, no late cancellation';
  END IF;
  DELETE FROM util.test_clock;
  RAISE NOTICE 'ok - short of interpreters: warned, then expired at the start, nobody with a late cancellation (R-REQ-10, core criterion 7)';
END $$;

-- R-DRC-04, R-REQ-09: decline with a reason; go on with fewer.
DO $$
DECLARE
  v_req booking.requests;
  v_code text;
BEGIN
  v_req := booking.create_request('00000000-0000-4000-8000-0000000000f1', (SELECT input FROM h5_input)
    || jsonb_build_object('starts_at', now() + interval '20 days', 'interpreters_needed', 2, 'expected_total_aoa', 9999));
  BEGIN PERFORM booking.decline_assignment('00000000-0000-4000-8000-0000000000f2', (SELECT id FROM booking.request_assignments WHERE request_id = v_req.id), 'x');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - declining needs a reason'; END IF;
  PERFORM booking.accept_assignment('00000000-0000-4000-8000-0000000000f2', (SELECT id FROM booking.request_assignments WHERE request_id = v_req.id));
  v_code := NULL;
  BEGIN PERFORM booking.reduce_interpreters_needed('00000000-0000-4000-8000-0000000000f1', v_req.id, 0);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'CANNOT_REDUCE_BELOW_ACCEPTED' THEN RAISE EXCEPTION 'FAIL - never below the accepted (got %)', v_code; END IF;
  v_req := booking.reduce_interpreters_needed('00000000-0000-4000-8000-0000000000f1', v_req.id, 1);
  IF v_req.status <> 'confirmed' THEN RAISE EXCEPTION 'FAIL - going on with the one accepted confirms the request'; END IF;
  RAISE NOTICE 'ok - declining needs a reason; going on with fewer confirms, never below the accepted (R-DRC-04, R-REQ-09)';
END $$;

-- Chat: participants write, others do not see.
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000f2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
INSERT INTO booking.messages (thread_id, sender_account, body)
SELECT id, '00000000-0000-4000-8000-0000000000f2', 'Bom dia, estarei lá 10 minutos antes.'
  FROM booking.threads WHERE assignment_id = (SELECT id FROM h5 WHERE key = 'assignment');
RESET ROLE;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000f3", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM booking.messages) OR EXISTS (SELECT 1 FROM booking.request_details) THEN
    RAISE EXCEPTION 'FAIL - an outsider reads no request and no message';
  END IF;
END $$;
RESET ROLE;
DO $$
BEGIN
  IF (SELECT sender_role FROM booking.messages LIMIT 1) <> 'interpreter' THEN RAISE EXCEPTION 'FAIL - the sender role comes from the thread'; END IF;
  RAISE NOTICE 'ok - the chat: participants write with their role; outsiders read nothing (R-REQ-08, R-REQ-07)';
END $$;
