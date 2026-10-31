-- Named assertions for step H4 (interpreter-profile-and-directory.md criteria 1, 2, 3, 5;
-- R-DIR-01, R-DIR-03, R-DIR-04, R-DIR-07, R-DIR-10). Rolled back.
-- d1 Dina (interpreter), d2 Rui (requester), d3 Mara (moderator), d4 Teo (interpreter, incomplete).

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000d1', 'dina@exemplo.ao', '{"full_name": "Dina Directório"}'),
  ('00000000-0000-4000-8000-0000000000d2', 'rui@exemplo.ao', '{"full_name": "Rui Requerente"}'),
  ('00000000-0000-4000-8000-0000000000d3', 'mara@portal.ao', '{"full_name": "Mara Moderadora"}'),
  ('00000000-0000-4000-8000-0000000000d4', 'teo@exemplo.ao', '{"full_name": "Teo Incompleto"}');
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000d_';
INSERT INTO identity.staff_members (account_id, level) VALUES ('00000000-0000-4000-8000-0000000000d3', 'moderator');
DO $$
BEGIN
  PERFORM identity.become_interpreter('00000000-0000-4000-8000-0000000000d1', NULL, NULL);
  PERFORM identity.become_interpreter('00000000-0000-4000-8000-0000000000d4', NULL, NULL);
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000d2', NULL, NULL, 'Luanda');
END $$;
UPDATE identity.interpreter_profiles
   SET bio = repeat('Intérprete de Língua Gestual Angolana com anos de prática. ', 2), modality = 'in_person',
       city = 'Luanda', contact_phone = '+244923000111'
 WHERE account_id = '00000000-0000-4000-8000-0000000000d1';
INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
SELECT '00000000-0000-4000-8000-0000000000d1', id, 'native' FROM catalog.languages ORDER BY sort LIMIT 1;

DO $$
BEGIN
  -- Criterion 1: everything of R-DIR-01 except the service.
  IF directory.profile_missing('00000000-0000-4000-8000-0000000000d1') <> ARRAY['services']
     OR EXISTS (SELECT 1 FROM directory.public_listing WHERE account_id = '00000000-0000-4000-8000-0000000000d1') THEN
    RAISE EXCEPTION 'FAIL - without a service the profile is incomplete and not listed (got %)',
      directory.profile_missing('00000000-0000-4000-8000-0000000000d1');
  END IF;
  INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
  SELECT '00000000-0000-4000-8000-0000000000d1', id, 12000 FROM catalog.services WHERE active ORDER BY sort LIMIT 1;
  IF NOT directory.is_profile_complete('00000000-0000-4000-8000-0000000000d1')
     OR NOT EXISTS (SELECT 1 FROM directory.public_listing WHERE account_id = '00000000-0000-4000-8000-0000000000d1') THEN
    RAISE EXCEPTION 'FAIL - adding the service lists the interpreter';
  END IF;
  -- In person needs a city; the missing list names each rule.
  IF directory.profile_missing('00000000-0000-4000-8000-0000000000d4') <> ARRAY['bio', 'modality', 'languages', 'services'] THEN
    RAISE EXCEPTION 'FAIL - an empty profile misses bio, modality, languages and services (got %)',
      directory.profile_missing('00000000-0000-4000-8000-0000000000d4');
  END IF;
  UPDATE identity.interpreter_profiles SET modality = 'both' WHERE account_id = '00000000-0000-4000-8000-0000000000d4';
  IF NOT 'city' = ANY (directory.profile_missing('00000000-0000-4000-8000-0000000000d4')) THEN
    RAISE EXCEPTION 'FAIL - in person without a city is incomplete';
  END IF;
  RAISE NOTICE 'ok - a profile without a service is not listed; the service lists it, nothing else (R-DIR-01, R-DIR-03, criterion 1)';
END $$;

-- A published video and article of Dina, one article removed later.
INSERT INTO directory.media_items (id, interpreter_id, title, url)
VALUES ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', 'Saudações em LGA', 'https://www.youtube.com/watch?v=ScMzIvxBSi4');
INSERT INTO directory.articles (id, interpreter_id, slug, title, body)
VALUES ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000d1', 'primeiro-artigo', 'Primeiro artigo', 'Texto.'),
       ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000d1', 'segundo-artigo', 'Segundo artigo', 'Texto.');

-- Criterion 2: the visitor reads the listing, never a contact.
SET LOCAL ROLE anon;
DO $$
DECLARE v_denied boolean := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM directory.public_listing WHERE slug = 'dina-directorio')
     OR EXISTS (SELECT 1 FROM directory.public_listing WHERE slug = 'teo-incompleto') THEN
    RAISE EXCEPTION 'FAIL - a visitor reads the listed interpreters only';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'directory' AND table_name = 'public_listing'
               AND column_name IN ('contact_phone', 'contact_whatsapp', 'bio')) THEN
    RAISE EXCEPTION 'FAIL - the public listing has no contacts and no biography';
  END IF;
  BEGIN PERFORM 1 FROM identity.interpreter_profiles;
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'FAIL - a visitor does not read the profiles table'; END IF;
  RAISE NOTICE 'ok - a visitor reads the public listing, without contacts (R-DIR-04, criterion 2)';
END $$;
RESET ROLE;

-- Rui (an active account) reads the whole profile, contacts included; not Teo's incomplete one.
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT contact_phone FROM identity.interpreter_profiles WHERE slug = 'dina-directorio') IS DISTINCT FROM '+244923000111'
     OR NOT EXISTS (SELECT 1 FROM directory.interpreter_services WHERE interpreter_id = '00000000-0000-4000-8000-0000000000d1')
     OR NOT EXISTS (SELECT 1 FROM directory.articles WHERE slug = 'primeiro-artigo') THEN
    RAISE EXCEPTION 'FAIL - an account reads the complete profile with its contacts (D-51)';
  END IF;
  IF EXISTS (SELECT 1 FROM identity.interpreter_profiles WHERE slug = 'teo-incompleto') THEN
    RAISE EXCEPTION 'FAIL - an incomplete profile is seen by its owner and the team only';
  END IF;
  -- R-DIR-10: favorites are the requester's own.
  INSERT INTO directory.favorites (requester_account_id, interpreter_id)
  VALUES ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000d1');
  RAISE NOTICE 'ok - an account reads the complete profile with contacts, never an incomplete one (R-DIR-04, criterion 2)';
END $$;
RESET ROLE;

-- Dina writes her own rows and never a status.
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_denied boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM directory.favorites) THEN RAISE EXCEPTION 'FAIL - only the requester sees its favorites'; END IF;
  INSERT INTO directory.availability_rules (interpreter_id, weekday, start_time, end_time)
  VALUES ('00000000-0000-4000-8000-0000000000d1', 1, '09:00', '13:00');
  BEGIN UPDATE directory.articles SET status = 'removed' WHERE id = '00000000-0000-4000-8000-0000000000e2';
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'FAIL - the author never changes the status'; END IF;
  INSERT INTO directory.education (interpreter_id, institution, degree)
  VALUES ('00000000-0000-4000-8000-0000000000d1', 'Universidade Agostinho Neto', 'Licenciatura');
  v_denied := false;
  BEGIN INSERT INTO directory.education (interpreter_id, institution, degree)
        VALUES ('00000000-0000-4000-8000-0000000000d4', 'Outra', 'Licenciatura');
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'FAIL - nobody writes another interpreter''s rows'; END IF;
  IF NOT (SELECT is_complete FROM directory.my_profile_status) THEN RAISE EXCEPTION 'FAIL - the owner reads its own status'; END IF;
  RAISE NOTICE 'ok - the interpreter writes its own rows only, never a status (data-model.md §3)';
END $$;
RESET ROLE;

-- Criterion 5: the team removes an article; only the author and the team still see it.
DO $$
BEGIN
  PERFORM directory.remove_content('00000000-0000-4000-8000-0000000000d3', 'article', '00000000-0000-4000-8000-0000000000e3', 'Conteúdo copiado');
  IF NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'content.removed' AND entity_id = '00000000-0000-4000-8000-0000000000e3')
     OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'content_removed'
                      AND account_id = '00000000-0000-4000-8000-0000000000d1') THEN
    RAISE EXCEPTION 'FAIL - the removal is audited and the author told';
  END IF;
END $$;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM directory.articles WHERE id = '00000000-0000-4000-8000-0000000000e3')
     OR NOT EXISTS (SELECT 1 FROM directory.articles WHERE id = '00000000-0000-4000-8000-0000000000e2') THEN
    RAISE EXCEPTION 'FAIL - a removed article is hidden from other accounts';
  END IF;
END $$;
RESET ROLE;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d1", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF (SELECT removed_reason FROM directory.articles WHERE id = '00000000-0000-4000-8000-0000000000e3') IS DISTINCT FROM 'Conteúdo copiado' THEN
    RAISE EXCEPTION 'FAIL - the author sees the removal and its reason';
  END IF;
  RAISE NOTICE 'ok - a removed article is seen by its author and the team only; audited and notified (R-DIR-07, criterion 5)';
END $$;
RESET ROLE;

-- Criterion 3: a suspended interpreter leaves every directory view.
DO $$ BEGIN PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-0000000000d1', 'Fraude comprovada'); END $$;
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000d2", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM directory.public_listing WHERE account_id = '00000000-0000-4000-8000-0000000000d1')
     OR EXISTS (SELECT 1 FROM directory.listed_interpreters WHERE account_id = '00000000-0000-4000-8000-0000000000d1')
     OR EXISTS (SELECT 1 FROM identity.interpreter_profiles WHERE account_id = '00000000-0000-4000-8000-0000000000d1')
     OR EXISTS (SELECT 1 FROM directory.media_items WHERE interpreter_id = '00000000-0000-4000-8000-0000000000d1') THEN
    RAISE EXCEPTION 'FAIL - a suspended interpreter appears in no directory view';
  END IF;
  RAISE NOTICE 'ok - a suspended interpreter appears in no directory view (R-DIR-03, criterion 3)';
END $$;
RESET ROLE;
