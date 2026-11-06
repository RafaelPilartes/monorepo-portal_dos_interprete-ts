-- Named assertions for step H9 (reviews.md criteria 1 to 5). Rolled back. The clock is frozen
-- (util.test_clock) and moved forward. e1 Ana and e4 Beto (requesters), e2 Ivo and e3 Tó
-- (interpreters, LGA online), e9 Mo (moderator).

UPDATE config.platform_versions SET status = 'published', published_at = now()
 WHERE version_number = 1 AND NOT EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'published');
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'ana.rev@exemplo.ao', '{"full_name": "Ana Avalia"}'),
  ('00000000-0000-4000-8000-0000000000e2', 'ivo.rev@exemplo.ao', '{"full_name": "Ivo Avalia"}'),
  ('00000000-0000-4000-8000-0000000000e3', 'to.rev@exemplo.ao', '{"full_name": "Tó Avalia"}'),
  ('00000000-0000-4000-8000-0000000000e4', 'beto.rev@exemplo.ao', '{"full_name": "Beto Avalia"}'),
  ('00000000-0000-4000-8000-0000000000e9', 'mo.rev@exemplo.ao', '{"full_name": "Mo Moderador"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000e_';
INSERT INTO identity.staff_members (account_id, level) VALUES ('00000000-0000-4000-8000-0000000000e9', 'moderator');
DELETE FROM util.test_clock;
INSERT INTO util.test_clock (frozen_at) VALUES (date_trunc('minute', now()));

CREATE TEMP TABLE h9 (key text PRIMARY KEY, id uuid);
GRANT ALL ON h9 TO authenticated;
DO $$
DECLARE
  v_service uuid := (SELECT id FROM catalog.services WHERE active AND pricing_mode = 'hourly' ORDER BY sort LIMIT 1);
  v_who uuid;
BEGIN
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000e1', NULL, NULL, 'Luanda');
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000e4', NULL, NULL, 'Luanda');
  FOREACH v_who IN ARRAY ARRAY['00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000e3']::uuid[] LOOP
    PERFORM identity.become_interpreter(v_who, NULL, NULL);
    UPDATE identity.interpreter_profiles SET bio = repeat('Intérprete com experiência em saúde e justiça. ', 3),
           modality = 'online' WHERE account_id = v_who;
    INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
    SELECT v_who, id, 'fluent' FROM catalog.languages WHERE code = 'lga';
    INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa) VALUES (v_who, v_service, 10000);
  END LOOP;
  INSERT INTO h9 VALUES ('service', v_service), ('lga', (SELECT id FROM catalog.languages WHERE code = 'lga'));
END $$;

CREATE FUNCTION pg_temp.at(p_when timestamptz) RETURNS void LANGUAGE sql AS $$ UPDATE util.test_clock SET frozen_at = p_when $$;
-- A direct request by p_requester for p_interpreter, accepted, done and confirmed: the clock ends
-- just after its end (it only moves forward in this file).
CREATE FUNCTION pg_temp.completed(p_requester uuid, p_interpreter uuid) RETURNS booking.request_assignments
  LANGUAGE plpgsql AS $$
DECLARE
  v_request booking.requests;
  v_row booking.request_assignments;
BEGIN
  v_request := booking.create_request(p_requester, jsonb_build_object(
    'kind', 'direct', 'service_id', (SELECT id FROM h9 WHERE key = 'service'),
    'language_ids', jsonb_build_array((SELECT id FROM h9 WHERE key = 'lga')),
    'modality', 'online', 'meeting_link', 'https://meet.exemplo.ao/r', 'starts_at', util.now() + interval '3 days',
    'duration_minutes', 60, 'interpreters_needed', 1, 'interpreter_ids', jsonb_build_array(p_interpreter),
    'beneficiary_name', 'Senhor Beneficiário', 'expected_total_aoa', 10000));
  SELECT * INTO v_row FROM booking.request_assignments WHERE request_id = v_request.id;
  PERFORM booking.accept_assignment(p_interpreter, v_row.id);
  SELECT * INTO v_request FROM booking.requests WHERE id = v_request.id;
  PERFORM pg_temp.at(v_request.ends_at + interval '1 minute');
  PERFORM booking.mark_delivered(p_interpreter, v_row.id);
  RETURN booking.confirm_delivery(p_requester, v_row.id);
END $$;
CREATE FUNCTION pg_temp.as_account(p_account uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', jsonb_build_object('sub', p_account, 'role', 'authenticated')::text, true) $$;

-- R-REV-01: only a completed service is reviewed, once per side; both sides are asked.
DO $$
DECLARE
  v_row booking.request_assignments := pg_temp.completed('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e2');
  v_review booking.reviews;
  v_code text;
BEGIN
  INSERT INTO h9 VALUES ('first', v_row.id);
  IF (SELECT count(*) FROM notify.notifications WHERE kind = 'review_requested'
        AND account_id IN ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e2')) <> 2 THEN
    RAISE EXCEPTION 'FAIL - a completed service asks both sides for a review';
  END IF;
  BEGIN PERFORM booking.submit_review('00000000-0000-4000-8000-0000000000e1', v_row.id, 0, NULL);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - the rating is 1 to 5 (got %)', v_code; END IF;
  v_review := booking.submit_review('00000000-0000-4000-8000-0000000000e1', v_row.id, 5, '  Muito profissional.  ');
  IF v_review.target_account <> '00000000-0000-4000-8000-0000000000e2' OR v_review.revealed_at IS NOT NULL OR v_review.comment <> 'Muito profissional.' THEN
    RAISE EXCEPTION 'FAIL - the requester reviews the interpreter; hidden until the other side reviews';
  END IF;
  v_code := NULL;
  BEGIN PERFORM booking.submit_review('00000000-0000-4000-8000-0000000000e1', v_row.id, 4, NULL);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'REVIEW_EXISTS' THEN RAISE EXCEPTION 'FAIL - one review per side (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM booking.submit_review('00000000-0000-4000-8000-0000000000e3', v_row.id, 4, NULL);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'NOT_FOUND' THEN RAISE EXCEPTION 'FAIL - only the parties review (got %)', v_code; END IF;
  RAISE NOTICE 'ok - a completed service is reviewed once per side, 1 to 5 stars; both sides are asked (R-REV-01)';
END $$;

-- Criterion 1: with one side only, nobody but the author and the team sees it.
DO $$ BEGIN PERFORM pg_temp.as_account('00000000-0000-4000-8000-0000000000e2'); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM booking.review_details) OR EXISTS (SELECT 1 FROM directory.interpreter_ratings) THEN
    RAISE EXCEPTION 'FAIL - the reviewed interpreter does not see a review before giving its own';
  END IF;
  IF (SELECT author_role FROM booking.reviews_to_do) IS DISTINCT FROM 'interpreter' THEN
    RAISE EXCEPTION 'FAIL - the interpreter has the review to do';
  END IF;
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM pg_temp.as_account('00000000-0000-4000-8000-0000000000e1'); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT count(*) FROM booking.review_details) <> 1 OR EXISTS (SELECT 1 FROM booking.reviews_to_do) THEN
    RAISE EXCEPTION 'FAIL - the author sees its own review, and has nothing left to review';
  END IF;
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM pg_temp.as_account('00000000-0000-4000-8000-0000000000e9'); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT count(*) FROM booking.review_details) <> 1 THEN RAISE EXCEPTION 'FAIL - the team sees every review'; END IF;
  RAISE NOTICE 'ok - with one side only, the review is seen by its author and the team, nobody else (criterion 1)';
END $$;
RESET ROLE;

-- Criterion 2: the second side reveals both at the same instant.
DO $$
DECLARE
  v_row uuid := (SELECT id FROM h9 WHERE key = 'first');
BEGIN
  PERFORM booking.submit_review('00000000-0000-4000-8000-0000000000e2', v_row, 4, 'Pedido bem preparado.');
  IF (SELECT count(DISTINCT revealed_at) FROM booking.reviews WHERE assignment_id = v_row AND revealed_at IS NOT NULL) <> 1
     OR (SELECT count(*) FROM booking.reviews WHERE assignment_id = v_row AND revealed_at IS NOT NULL) <> 2
     OR (SELECT count(*) FROM notify.notifications WHERE kind = 'review_revealed') <> 2 THEN
    RAISE EXCEPTION 'FAIL - the second review reveals both at the same instant, each target told';
  END IF;
  RAISE NOTICE 'ok - the second side reveals both reviews at the same instant (criterion 2)';
END $$;

-- Criterion 4 (D-44): another requester does not read reviews of a requester; an interpreter it
-- invited does. Tó is invited by Ana now.
DO $$
DECLARE v_request booking.requests;
BEGIN
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000e1', jsonb_build_object(
    'kind', 'direct', 'service_id', (SELECT id FROM h9 WHERE key = 'service'),
    'language_ids', jsonb_build_array((SELECT id FROM h9 WHERE key = 'lga')),
    'modality', 'online', 'meeting_link', 'https://meet.exemplo.ao/r', 'starts_at', util.now() + interval '5 days',
    'duration_minutes', 60, 'interpreters_needed', 1, 'interpreter_ids', jsonb_build_array('00000000-0000-4000-8000-0000000000e3'),
    'beneficiary_name', 'Senhor Beneficiário', 'expected_total_aoa', 10000));
END $$;
DO $$ BEGIN PERFORM pg_temp.as_account('00000000-0000-4000-8000-0000000000e4'); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM booking.review_details WHERE author_role = 'interpreter')
     OR EXISTS (SELECT 1 FROM booking.requester_ratings) THEN
    RAISE EXCEPTION 'FAIL - a requester does not read the reviews of another requester';
  END IF;
  IF (SELECT rating_count FROM directory.interpreter_ratings WHERE interpreter_id = '00000000-0000-4000-8000-0000000000e2') IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'FAIL - any active account reads the revealed reviews of an interpreter';
  END IF;
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM pg_temp.as_account('00000000-0000-4000-8000-0000000000e3'); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT rating FROM booking.review_details WHERE author_role = 'interpreter') IS DISTINCT FROM 4
     OR (SELECT rating_average FROM booking.requester_ratings WHERE requester_id = '00000000-0000-4000-8000-0000000000e1') IS DISTINCT FROM 4.0 THEN
    RAISE EXCEPTION 'FAIL - an interpreter invited by the requester reads its reviews and its average';
  END IF;
  RAISE NOTICE 'ok - reviews of a requester: not for another requester, yes for an interpreter it invited (criterion 4, D-44)';
END $$;
RESET ROLE;

-- Criterion 3: a review without an answer is revealed after review_reveal_days; the window closes.
DO $$
DECLARE
  v_row booking.request_assignments := pg_temp.completed('00000000-0000-4000-8000-0000000000e4', '00000000-0000-4000-8000-0000000000e2');
  v_reveal integer := config.require((SELECT config_version_id FROM booking.requests WHERE id = v_row.request_id), 'review_reveal_days')::integer;
  v_window integer := config.require((SELECT config_version_id FROM booking.requests WHERE id = v_row.request_id), 'review_window_days')::integer;
  v_code text;
BEGIN
  PERFORM booking.submit_review('00000000-0000-4000-8000-0000000000e4', v_row.id, 1, 'Chegou tarde.');
  PERFORM pg_temp.at(v_row.completed_at + v_reveal * interval '1 day' - interval '1 minute');
  IF booking.reveal_reviews() <> 0 THEN RAISE EXCEPTION 'FAIL - nothing is revealed before review_reveal_days'; END IF;
  PERFORM pg_temp.at(v_row.completed_at + v_reveal * interval '1 day');
  IF booking.reveal_reviews() <> 1 THEN RAISE EXCEPTION 'FAIL - the unanswered review is revealed after review_reveal_days'; END IF;
  PERFORM pg_temp.at(v_row.completed_at + v_window * interval '1 day');
  BEGIN PERFORM booking.submit_review('00000000-0000-4000-8000-0000000000e2', v_row.id, 3, NULL);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'REVIEW_WINDOW_CLOSED' THEN RAISE EXCEPTION 'FAIL - the window closes after review_window_days (got %)', v_code; END IF;
  INSERT INTO h9 VALUES ('late', (SELECT id FROM booking.reviews WHERE assignment_id = v_row.id));
  RAISE NOTICE 'ok - an unanswered review is revealed after % days; the window closes after % days (criterion 3)', v_reveal, v_window;
END $$;

-- Criterion 5 and R-REV-04: a hidden review leaves the average; the author is told; audited.
DO $$
DECLARE
  v_review uuid := (SELECT id FROM h9 WHERE key = 'late');
  v_code text;
BEGIN
  IF (SELECT rating_average FROM directory.interpreter_ratings WHERE interpreter_id = '00000000-0000-4000-8000-0000000000e2') <> 3.0 THEN
    RAISE EXCEPTION 'FAIL - the average counts both revealed reviews';
  END IF;
  BEGIN PERFORM booking.hide_review('00000000-0000-4000-8000-0000000000e1', v_review, 'Não gosto');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - only a moderator hides (got %)', v_code; END IF;
  PERFORM booking.hide_review('00000000-0000-4000-8000-0000000000e9', v_review, 'Linguagem ofensiva');
  IF (SELECT rating_average FROM directory.interpreter_ratings WHERE interpreter_id = '00000000-0000-4000-8000-0000000000e2') <> 5.0
     OR (SELECT rating_count FROM directory.public_listing WHERE account_id = '00000000-0000-4000-8000-0000000000e2') <> 1
     OR NOT EXISTS (SELECT 1 FROM notify.email_outbox WHERE template = 'review_hidden' AND account_id = '00000000-0000-4000-8000-0000000000e4')
        AND NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'review_hidden' AND account_id = '00000000-0000-4000-8000-0000000000e4')
     OR NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'review.hidden' AND entity_id = v_review::text) THEN
    RAISE EXCEPTION 'FAIL - a hidden review leaves the average and the listing; the author is told; audited';
  END IF;
  RAISE NOTICE 'ok - a hidden review is out of the average, audited, its author told (criterion 5, R-REV-04)';
END $$;

-- Edge case: a cancelled service is not reviewed.
DO $$
DECLARE
  v_request booking.requests;
  v_code text;
BEGIN
  v_request := booking.create_request('00000000-0000-4000-8000-0000000000e4', jsonb_build_object(
    'kind', 'direct', 'service_id', (SELECT id FROM h9 WHERE key = 'service'),
    'language_ids', jsonb_build_array((SELECT id FROM h9 WHERE key = 'lga')),
    'modality', 'online', 'meeting_link', 'https://meet.exemplo.ao/r', 'starts_at', util.now() + interval '3 days',
    'duration_minutes', 60, 'interpreters_needed', 1, 'interpreter_ids', jsonb_build_array('00000000-0000-4000-8000-0000000000e2'),
    'beneficiary_name', 'Senhor Beneficiário', 'expected_total_aoa', 10000));
  PERFORM booking.cancel_request('00000000-0000-4000-8000-0000000000e4', v_request.id, 'Já não preciso');
  BEGIN PERFORM booking.submit_review('00000000-0000-4000-8000-0000000000e4',
    (SELECT id FROM booking.request_assignments WHERE request_id = v_request.id), 5, NULL);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'REVIEW_NOT_ALLOWED' THEN RAISE EXCEPTION 'FAIL - a cancelled service is not reviewed (got %)', v_code; END IF;
  RAISE NOTICE 'ok - a cancelled service cannot be reviewed (REVIEW_NOT_ALLOWED)';
END $$;
DELETE FROM util.test_clock;
