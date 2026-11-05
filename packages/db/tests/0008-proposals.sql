-- Named assertions for step H6 (negotiation.md criteria 1–4; requests-direct.md criterion 5).
-- Rolled back. g1 Rita (requester), g2 Ivo (interpreter).

UPDATE config.platform_versions SET status = 'published', published_at = now()
 WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published');
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'rita.neg@exemplo.ao', '{"full_name": "Rita Negocia"}'),
  ('00000000-0000-4000-8000-0000000000a2', 'ivo.neg@exemplo.ao', '{"full_name": "Ivo Negocia"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000a_';

CREATE TEMP TABLE h6 (key text PRIMARY KEY, id uuid);
DO $$
DECLARE
  v_service uuid := (SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1);
  v_request booking.requests;
BEGIN
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000a1', NULL, NULL, 'Luanda');
  PERFORM identity.become_interpreter('00000000-0000-4000-8000-0000000000a2', NULL, NULL);
  UPDATE identity.interpreter_profiles SET bio = repeat('Intérprete com experiência em saúde e justiça. ', 3),
         modality = 'online' WHERE account_id = '00000000-0000-4000-8000-0000000000a2';
  INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
  SELECT '00000000-0000-4000-8000-0000000000a2', id, 'fluent' FROM catalog.languages WHERE code = 'lga';
  INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
  VALUES ('00000000-0000-4000-8000-0000000000a2', v_service, 15000);
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000a1', jsonb_build_object(
    'kind', 'direct', 'service_id', v_service, 'language_ids', jsonb_build_array((SELECT id FROM catalog.languages WHERE code = 'lga')),
    'modality', 'online', 'meeting_link', 'https://meet.exemplo.ao/x', 'starts_at', now() + interval '5 days',
    'duration_minutes', 60, 'interpreters_needed', 1, 'interpreter_ids', jsonb_build_array('00000000-0000-4000-8000-0000000000a2'),
    'expected_total_aoa', 15000));
  INSERT INTO h6 SELECT 'thread', t.id FROM booking.threads AS t JOIN booking.request_assignments AS a ON a.id = t.assignment_id
   WHERE a.request_id = v_request.id;
  INSERT INTO h6 SELECT 'assignment', a.id FROM booking.request_assignments AS a WHERE a.request_id = v_request.id;
END $$;

DO $$
DECLARE
  v_thread uuid := (SELECT id FROM h6 WHERE key = 'thread');
  v_first booking.proposals;
  v_second booking.proposals;
  v_code text;
BEGIN
  -- Criterion 1: a proposal and a counter-proposal leave exactly one open.
  v_first := booking.make_proposal('00000000-0000-4000-8000-0000000000a1', v_thread, 12000);
  v_second := booking.make_proposal('00000000-0000-4000-8000-0000000000a2', v_thread, 13500);
  IF (SELECT count(*) FROM booking.proposals WHERE thread_id = v_thread AND status = 'open') <> 1
     OR (SELECT status FROM booking.proposals WHERE id = v_first.id) <> 'void' OR v_second.previous_amount_aoa <> 15000 THEN
    RAISE EXCEPTION 'FAIL - a counter-proposal voids the open one: exactly one open';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'proposal_received' AND account_id = '00000000-0000-4000-8000-0000000000a1') THEN
    RAISE EXCEPTION 'FAIL - the other party is told of a proposal';
  END IF;
  -- Criterion 2: not one's own.
  BEGIN PERFORM booking.respond_proposal('00000000-0000-4000-8000-0000000000a2', v_second.id, true);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'OWN_PROPOSAL' THEN RAISE EXCEPTION 'FAIL - accepting one''s own proposal: OWN_PROPOSAL (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM booking.make_proposal('00000000-0000-4000-8000-0000000000a1', v_thread, 0);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'INVALID_AMOUNT' THEN RAISE EXCEPTION 'FAIL - a proposal of 0: INVALID_AMOUNT (got %)', v_code; END IF;
  -- Criterion 4: accepting changes the price offered, not the agreed one.
  PERFORM booking.respond_proposal('00000000-0000-4000-8000-0000000000a1', v_second.id, true);
  IF (SELECT offered_price_aoa FROM booking.request_assignments WHERE id = (SELECT id FROM h6 WHERE key = 'assignment')) <> 13500
     OR (SELECT agreed_price_aoa FROM booking.request_assignments WHERE id = (SELECT id FROM h6 WHERE key = 'assignment')) IS NOT NULL
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'proposal_answered' AND account_id = '00000000-0000-4000-8000-0000000000a2') THEN
    RAISE EXCEPTION 'FAIL - an accepted proposal changes offered_price_aoa only, and tells who proposed';
  END IF;
  v_code := NULL;
  BEGIN PERFORM booking.respond_proposal('00000000-0000-4000-8000-0000000000a1', v_second.id, false);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'PROPOSAL_NOT_OPEN' THEN RAISE EXCEPTION 'FAIL - an answered proposal: PROPOSAL_NOT_OPEN (got %)', v_code; END IF;
  RAISE NOTICE 'ok - one open proposal per thread; not one''s own; accepting moves only the price offered (R-NEG-02, R-NEG-03, criteria 1, 2, 4)';
END $$;

DO $$
DECLARE
  v_thread uuid := (SELECT id FROM h6 WHERE key = 'thread');
  v_open booking.proposals;
  v_code text;
BEGIN
  -- R-NEG-04: an interpreter who does not negotiate.
  UPDATE identity.interpreter_profiles SET accepts_negotiation = false WHERE account_id = '00000000-0000-4000-8000-0000000000a2';
  BEGIN PERFORM booking.make_proposal('00000000-0000-4000-8000-0000000000a1', v_thread, 11000);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'NEGOTIATION_DISABLED' THEN RAISE EXCEPTION 'FAIL - the requester cannot propose to who does not negotiate (got %)', v_code; END IF;
  v_open := booking.make_proposal('00000000-0000-4000-8000-0000000000a2', v_thread, 14000);
  -- Direct criterion 5: accepting the request voids the open proposal; the price in force is fixed.
  PERFORM booking.accept_assignment('00000000-0000-4000-8000-0000000000a2', (SELECT id FROM h6 WHERE key = 'assignment'));
  IF (SELECT status FROM booking.proposals WHERE id = v_open.id) <> 'void'
     OR (SELECT agreed_price_aoa FROM booking.request_assignments WHERE id = (SELECT id FROM h6 WHERE key = 'assignment')) <> 13500 THEN
    RAISE EXCEPTION 'FAIL - accepting the request voids the open proposal and fixes the price in force (13 500)';
  END IF;
  -- Criterion 3: closed after the acceptance.
  v_code := NULL;
  BEGIN PERFORM booking.make_proposal('00000000-0000-4000-8000-0000000000a2', v_thread, 16000);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'NEGOTIATION_CLOSED' THEN RAISE EXCEPTION 'FAIL - after the acceptance: NEGOTIATION_CLOSED (got %)', v_code; END IF;
  RAISE NOTICE 'ok - who does not negotiate; accepting the request voids the open proposal and closes the negotiation (R-NEG-04, criterion 3, direct criterion 5)';
END $$;
