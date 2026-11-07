-- Named assertions for step H7 (requests-open.md criteria 2, 3, 4; criterion 1, the concurrent
-- one, is in apps/api/src/routes/requests.db.test.ts with real parallel connections). Rolled back.
-- b1 Rita (requester), b2 Ivo and b3 Tó (LGA, online), b4 Sara (Portuguese only).

UPDATE config.platform_versions SET status = 'published', published_at = now()
 WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published');
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000b1', 'rita.open@exemplo.ao', '{"full_name": "Rita Aberta"}'),
  ('00000000-0000-4000-8000-0000000000b2', 'ivo.open@exemplo.ao', '{"full_name": "Ivo Aberto"}'),
  ('00000000-0000-4000-8000-0000000000b3', 'to.open@exemplo.ao', '{"full_name": "Tó Aberto"}'),
  ('00000000-0000-4000-8000-0000000000b4', 'sara.open@exemplo.ao', '{"full_name": "Sara Português"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000b_';

CREATE TEMP TABLE h7 (key text PRIMARY KEY, id uuid);
GRANT ALL ON h7 TO authenticated;
DO $$
DECLARE
  v_service uuid := (SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1);
  v_who uuid;
BEGIN
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000b1', NULL, NULL, 'Luanda');
  FOREACH v_who IN ARRAY ARRAY['00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b3',
                               '00000000-0000-4000-8000-0000000000b4']::uuid[] LOOP
    PERFORM identity.become_interpreter(v_who, NULL, NULL);
    UPDATE identity.interpreter_profiles SET bio = repeat('Intérprete com experiência em saúde e justiça. ', 3),
           modality = 'online' WHERE account_id = v_who;
    INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
    SELECT v_who, id, 'fluent' FROM catalog.languages
     WHERE code = CASE WHEN v_who = '00000000-0000-4000-8000-0000000000b4' THEN 'pt' ELSE 'lga' END;
    INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
    VALUES (v_who, v_service, CASE WHEN v_who = '00000000-0000-4000-8000-0000000000b3' THEN 12000 ELSE 10000 END);
  END LOOP;
  INSERT INTO h7 VALUES ('service', v_service), ('lga', (SELECT id FROM catalog.languages WHERE code = 'lga'));
END $$;

CREATE TEMP TABLE h7_input AS SELECT jsonb_build_object(
  'kind', 'open', 'service_id', (SELECT id FROM h7 WHERE key = 'service'),
  'language_ids', jsonb_build_array((SELECT id FROM h7 WHERE key = 'lga')),
  'modality', 'online', 'meeting_link', 'https://meet.exemplo.ao/o', 'starts_at', now() + interval '6 days',
  'duration_minutes', 60, 'interpreters_needed', 2, 'beneficiary_name', 'Senhora Beneficiária') AS input;

DO $$
DECLARE
  v_code text;
  v_request booking.requests;
BEGIN
  -- "First to accept" needs a budget; the total is the budget per place.
  BEGIN PERFORM booking.create_request('00000000-0000-4000-8000-0000000000b1',
    (SELECT input FROM h7_input) || jsonb_build_object('open_mode', 'first_accept', 'expected_total_aoa', 0));
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'BUDGET_REQUIRED' THEN RAISE EXCEPTION 'FAIL - first to accept needs a budget (got %)', v_code; END IF;
  IF (booking.preview_request_total((SELECT input FROM h7_input) || jsonb_build_object('open_mode', 'first_accept',
        'budget_per_interpreter_aoa', 9000)) ->> 'total_aoa')::bigint <> 18000 THEN
    RAISE EXCEPTION 'FAIL - the total of first to accept is the budget for each place';
  END IF;
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000b1', (SELECT input FROM h7_input)
    || jsonb_build_object('open_mode', 'requester_chooses', 'expected_total_aoa', 0));
  INSERT INTO h7 VALUES ('choose', v_request.id);
  IF NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'open_request_new' AND account_id = '00000000-0000-4000-8000-0000000000b2')
     OR EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'open_request_new' AND account_id = '00000000-0000-4000-8000-0000000000b4') THEN
    RAISE EXCEPTION 'FAIL - publishing tells the eligible interpreters, not the others';
  END IF;
  RAISE NOTICE 'ok - an open request: the budget is required in first to accept; the eligible interpreters are told (R-OPN-01)';
END $$;

-- Criteria 3 and 4: the view for the eligible, without the beneficiary; not for the others.
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT value_aoa FROM booking.open_requests_for_me WHERE id = (SELECT id FROM h7 WHERE key = 'choose')) IS DISTINCT FROM 10000 THEN
    RAISE EXCEPTION 'FAIL - an eligible interpreter sees the open request with its own price';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'booking' AND table_name = 'open_requests_for_me'
               AND column_name IN ('beneficiary_name', 'beneficiary_contact', 'address', 'notes'))
     OR (SELECT beneficiary_name FROM booking.request_details WHERE id = (SELECT id FROM h7 WHERE key = 'choose')) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL - the open request shows no beneficiary to a candidate';
  END IF;
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b4", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM booking.open_requests_for_me) OR EXISTS (SELECT 1 FROM booking.request_details) THEN
    RAISE EXCEPTION 'FAIL - a non-eligible interpreter does not see the open request';
  END IF;
END $$;
RESET ROLE;
DO $$
DECLARE v_code text; v_hint text;
BEGIN
  BEGIN PERFORM booking.apply_to_request('00000000-0000-4000-8000-0000000000b4', (SELECT id FROM h7 WHERE key = 'choose'), NULL);
  EXCEPTION WHEN raise_exception THEN GET STACKED DIAGNOSTICS v_code = MESSAGE_TEXT, v_hint = PG_EXCEPTION_HINT; END;
  IF v_code IS DISTINCT FROM 'INTERPRETER_NOT_ELIGIBLE' OR v_hint NOT LIKE '%não interpreta%' THEN
    RAISE EXCEPTION 'FAIL - a non-eligible interpreter cannot apply (got %, %)', v_code, v_hint;
  END IF;
  RAISE NOTICE 'ok - the open request is seen and taken only by the eligible, never with the beneficiary (criteria 3, 4)';
END $$;

-- Criterion 2: "I choose" — choosing fixes the price in force; when full, the rest are not selected.
DO $$
DECLARE
  v_request uuid := (SELECT id FROM h7 WHERE key = 'choose');
  v_ivo booking.request_assignments;
  v_to booking.request_assignments;
  v_extra uuid := '00000000-0000-4000-8000-0000000000b9';
BEGIN
  v_ivo := booking.apply_to_request('00000000-0000-4000-8000-0000000000b2', v_request, 'Tenho disponibilidade.');
  v_to := booking.apply_to_request('00000000-0000-4000-8000-0000000000b3', v_request, NULL);
  IF v_ivo.offered_price_aoa <> 10000 OR v_ivo.application_message <> 'Tenho disponibilidade.'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'open_application_received') THEN
    RAISE EXCEPTION 'FAIL - an application offers the interpreter''s price, keeps the message and tells the requester';
  END IF;
  -- One place only: choosing Ivo at a negotiated 9500 fixes it; Tó is not selected and told.
  UPDATE booking.requests SET interpreters_needed = 1 WHERE id = v_request;
  PERFORM booking.respond_proposal('00000000-0000-4000-8000-0000000000b1',
    (booking.make_proposal('00000000-0000-4000-8000-0000000000b2',
      (SELECT id FROM booking.threads WHERE assignment_id = v_ivo.id), 9500)).id, true);
  v_ivo := booking.select_candidate('00000000-0000-4000-8000-0000000000b1', v_request, v_ivo.id);
  IF v_ivo.status <> 'accepted' OR v_ivo.agreed_price_aoa <> 9500
     OR (SELECT status FROM booking.request_assignments WHERE id = v_to.id) <> 'not_selected'
     OR (SELECT status FROM booking.requests WHERE id = v_request) <> 'confirmed'
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'open_application_not_selected' AND account_id = '00000000-0000-4000-8000-0000000000b3') THEN
    RAISE EXCEPTION 'FAIL - choosing fixes the price in force, confirms, and the others are not selected and told';
  END IF;
  RAISE NOTICE 'ok - I choose: applications at their own price; choosing fixes the price in force; the rest not selected (R-OPN-03, R-OPN-04, criterion 2)';
END $$;

-- R-OPN-02 and negotiation criterion 5: "first to accept" at the budget, no travel fee, no negotiation.
DO $$
DECLARE
  v_request booking.requests;
  v_row booking.request_assignments;
  v_code text;
BEGIN
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000b1', (SELECT input FROM h7_input)
    || jsonb_build_object('open_mode', 'first_accept', 'budget_per_interpreter_aoa', 9000, 'interpreters_needed', 1,
                          'starts_at', now() + interval '20 days', 'expected_total_aoa', 9000));
  v_row := booking.accept_open_request('00000000-0000-4000-8000-0000000000b3', v_request.id);
  IF v_row.agreed_price_aoa <> 9000 OR v_row.agreed_travel_fee_aoa <> 0
     OR (SELECT status FROM booking.requests WHERE id = v_request.id) <> 'confirmed' THEN
    RAISE EXCEPTION 'FAIL - first to accept: the budget, no travel fee, confirmed when full';
  END IF;
  BEGIN PERFORM booking.accept_open_request('00000000-0000-4000-8000-0000000000b2', v_request.id);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'SLOTS_FULL' THEN RAISE EXCEPTION 'FAIL - a full request takes nobody else: SLOTS_FULL (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM booking.make_proposal('00000000-0000-4000-8000-0000000000b3',
    (SELECT id FROM booking.threads WHERE assignment_id = v_row.id), 9500);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'NEGOTIATION_CLOSED' THEN RAISE EXCEPTION 'FAIL - no negotiation in first to accept (got %)', v_code; END IF;
  RAISE NOTICE 'ok - first to accept: the budget without travel fee, full requests closed, no negotiation (R-OPN-02, negotiation criterion 5)';
END $$;

-- Review of H7: candidates hold no place when the request goes on with fewer; on expiry they are
-- not selected and told; nobody takes a place from the start; the link only for who takes part.
DO $$
DECLARE
  v_request booking.requests;
  v_a booking.request_assignments;
  v_code text;
BEGIN
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000b1', (SELECT input FROM h7_input)
    || jsonb_build_object('open_mode', 'requester_chooses', 'interpreters_needed', 3, 'starts_at', now() + interval '25 days', 'expected_total_aoa', 0));
  v_a := booking.apply_to_request('00000000-0000-4000-8000-0000000000b2', v_request.id, NULL);
  PERFORM booking.apply_to_request('00000000-0000-4000-8000-0000000000b3', v_request.id, NULL);
  PERFORM booking.reduce_interpreters_needed('00000000-0000-4000-8000-0000000000b1', v_request.id, 2);
  IF (SELECT count(*) FROM booking.request_assignments WHERE request_id = v_request.id AND status = 'applied') <> 2 THEN
    RAISE EXCEPTION 'FAIL - going on with fewer keeps every candidate';
  END IF;
  INSERT INTO util.test_clock (frozen_at) VALUES (v_request.starts_at);
  BEGIN PERFORM booking.select_candidate('00000000-0000-4000-8000-0000000000b1', v_request.id, v_a.id);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - from the start nobody is chosen (got %)', v_code; END IF;
  PERFORM booking.expire_unstaffed_requests();
  IF (SELECT count(*) FROM booking.request_assignments WHERE request_id = v_request.id AND status = 'not_selected') <> 2
     OR (SELECT count(*) FROM notify.notifications WHERE kind = 'request_expired' AND payload ->> 'request_id' = v_request.id::text
          AND account_id IN ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b3')) <> 2 THEN
    RAISE EXCEPTION 'FAIL - on expiry the candidates are not selected and told';
  END IF;
  DELETE FROM util.test_clock;
  RAISE NOTICE 'ok - candidates are kept when going on with fewer, not selected and told on expiry; nobody chosen from the start (review of H7)';
END $$;

DO $$
DECLARE v_request booking.requests;
BEGIN
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000b1', (SELECT input FROM h7_input)
    || jsonb_build_object('open_mode', 'requester_chooses', 'starts_at', now() + interval '26 days', 'expected_total_aoa', 0));
  INSERT INTO h7 VALUES ('link', v_request.id);
END $$;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM booking.request_details WHERE id = (SELECT id FROM h7 WHERE key = 'link'))
     OR (SELECT meeting_link FROM booking.request_details WHERE id = (SELECT id FROM h7 WHERE key = 'link')) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL - an eligible interpreter opens the request but not its meeting link';
  END IF;
  RAISE NOTICE 'ok - the meeting link is hidden from an interpreter who only sees the open request (review of H7)';
END $$;
RESET ROLE;

