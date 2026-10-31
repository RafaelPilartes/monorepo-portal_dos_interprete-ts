-- Named assertions for step H2 (accounts-and-organizations.md criteria 1, 4–7; personal-data.md
-- criteria 1–2; R-ACC, R-ORG, R-PRIV-01/02, anonymize skeleton). Rolled back by run-tests.sh.
-- Accounts: b1 Olga (owner), b2 Beto (member), b3 Carla (invited), b4 Ivo (interpreter),
-- b5 Mário (moderator), b6 Rui (another account).

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000b1', 'olga@empresa.ao', '{"full_name": "Olga Dona", "intended_role": "organization"}'),
  ('00000000-0000-4000-8000-0000000000b2', 'beto@empresa.ao', '{"full_name": "Beto Membro"}'),
  ('00000000-0000-4000-8000-0000000000b3', 'carla@empresa.ao', '{"full_name": "Carla Convidada"}'),
  ('00000000-0000-4000-8000-0000000000b4', 'ivo@exemplo.ao', '{"full_name": "Ivo Gonçalves Intérprete", "intended_role": "interpreter"}'),
  ('00000000-0000-4000-8000-0000000000b5', 'mario@portal.ao', '{"full_name": "Mário Moderador"}'),
  ('00000000-0000-4000-8000-0000000000b6', 'rui@exemplo.ao', '{"full_name": "Rui Outro"}');
UPDATE identity.staff_members SET active = false WHERE active;
INSERT INTO identity.staff_members (account_id, level) VALUES ('00000000-0000-4000-8000-0000000000b5', 'moderator');
-- A configuration in force for the invite expiry (only this file's, rolled back).
UPDATE config.platform_versions SET status = 'retired' WHERE status = 'published';
INSERT INTO config.platform_versions (version_number, status, published_at, org_invite_expiry_days)
VALUES ((SELECT coalesce(max(version_number), 0) + 1 FROM config.platform_versions), 'published', now(), 7);
-- Legal documents in force for this file: terms v900 and privacy v900, published.
INSERT INTO identity.legal_documents (kind, version, body, published_at) VALUES
  ('terms', 900, 'Termos de teste', now()), ('privacy', 900, 'Privacidade de teste', now());

-- R-ACC-01, R-PRIV-01 ---------------------------------------------------------------------------------

DO $$
DECLARE v_me jsonb; v_left int; v_code text;
BEGIN
  v_me := identity.me('00000000-0000-4000-8000-0000000000b1');
  IF v_me -> 'roles' <> '[]'::jsonb OR v_me ->> 'intended_role' <> 'organization'
     OR EXISTS (SELECT 1 FROM identity.requester_profiles WHERE account_id = '00000000-0000-4000-8000-0000000000b1')
     OR EXISTS (SELECT 1 FROM identity.interpreter_profiles WHERE account_id = '00000000-0000-4000-8000-0000000000b1') THEN
    RAISE EXCEPTION 'FAIL - a registration creates the profile and no role (got %)', v_me -> 'roles';
  END IF;
  IF NOT (v_me ->> 'terms_acceptance_required')::boolean OR jsonb_array_length(v_me -> 'pending_documents') <> 2
     OR auth_helper.account_status('00000000-0000-4000-8000-0000000000b1') <> 'terms_required' THEN
    RAISE EXCEPTION 'FAIL - an account without consent has the documents in force to accept';
  END IF;
  BEGIN PERFORM identity.record_consents('00000000-0000-4000-8000-0000000000b1', ARRAY[gen_random_uuid()], '10.0.0.1', 'test');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - consent only to published documents (got %)', v_code; END IF;
  -- Everyone in this file accepts what is in force (sign-up with the box ticked).
  SELECT identity.record_consents(p.id, ARRAY(SELECT d.id FROM auth_helper.pending_legal_documents(p.id) AS d), '10.0.0.1', 'Mozilla/5.0')
    INTO v_left FROM identity.profiles AS p WHERE p.id = '00000000-0000-4000-8000-0000000000b1';
  IF v_left <> 0 OR (SELECT count(*) FROM identity.consents WHERE account_id = '00000000-0000-4000-8000-0000000000b1') <> 2
     OR NOT EXISTS (SELECT 1 FROM identity.consents WHERE account_id = '00000000-0000-4000-8000-0000000000b1' AND ip = '10.0.0.1' AND user_agent = 'Mozilla/5.0')
     OR auth_helper.account_status('00000000-0000-4000-8000-0000000000b1') <> 'active' THEN
    RAISE EXCEPTION 'FAIL - consent writes one row per document, with IP and agent, and clears the pending list';
  END IF;
  BEGIN DELETE FROM identity.consents WHERE account_id = '00000000-0000-4000-8000-0000000000b1';
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - consents are append-only'; END IF;
  RAISE NOTICE 'ok - registration creates no role, and consent is one row per published document, append-only (R-ACC-01, R-PRIV-01)';
END $$;
DO $$ BEGIN
  PERFORM identity.record_consents(p.id, ARRAY(SELECT d.id FROM auth_helper.pending_legal_documents(p.id) AS d), NULL, NULL)
     FROM identity.profiles AS p WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000b_' AND p.id <> '00000000-0000-4000-8000-0000000000b1';
END $$;

-- R-ACC-02, R-ACC-04 ----------------------------------------------------------------------------------

DO $$
DECLARE v_code text; v_interp identity.interpreter_profiles;
BEGIN
  PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000b2', NULL, 'Rua 1', 'Luanda');
  BEGIN PERFORM identity.become_requester('00000000-0000-4000-8000-0000000000b2', NULL, NULL, NULL);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'ROLE_ALREADY_EXISTS' THEN RAISE EXCEPTION 'FAIL - a role is created once (got %)', v_code; END IF;
  v_interp := identity.become_interpreter('00000000-0000-4000-8000-0000000000b4', 'Bio', 'Benguela');
  IF v_interp.slug <> 'ivo-goncalves-interprete' THEN RAISE EXCEPTION 'FAIL - the slug comes from the name (got %)', v_interp.slug; END IF;
  -- Since H4 the directory lists complete profiles only (R-DIR-01): Ivo's is completed here.
  UPDATE identity.interpreter_profiles SET bio = repeat('Intérprete de Língua Gestual Angolana. ', 3), modality = 'online'
   WHERE account_id = '00000000-0000-4000-8000-0000000000b4';
  INSERT INTO directory.interpreter_languages (interpreter_id, language_id, level)
  SELECT '00000000-0000-4000-8000-0000000000b4', id, 'fluent' FROM catalog.languages ORDER BY sort LIMIT 1;
  INSERT INTO directory.interpreter_services (interpreter_id, service_id, price_aoa)
  SELECT '00000000-0000-4000-8000-0000000000b4', id, 9000 FROM catalog.services WHERE active ORDER BY sort LIMIT 1;
  -- A second interpreter with the same name gets the next free slug.
  UPDATE identity.profiles SET full_name = 'Ivo Gonçalves Intérprete' WHERE id = '00000000-0000-4000-8000-0000000000b2';
  v_interp := identity.become_interpreter('00000000-0000-4000-8000-0000000000b2', NULL, NULL);
  IF v_interp.slug <> 'ivo-goncalves-interprete-2' THEN RAISE EXCEPTION 'FAIL - a taken slug gets -2 (got %)', v_interp.slug; END IF;
  UPDATE identity.profiles SET full_name = 'Beto Membro' WHERE id = '00000000-0000-4000-8000-0000000000b2';
  -- A cut at 60 characters that lands on a separator leaves no trailing "-" (util.slug).
  IF identity.slugify(repeat('a', 59) || ' bcd') <> repeat('a', 59)
     OR identity.slugify('  ¿?  ') <> 'interprete' THEN
    RAISE EXCEPTION 'FAIL - a slug never ends in "-" and is never empty (got %)', identity.slugify(repeat('a', 59) || ' bcd');
  END IF;
  IF identity.roles_of('00000000-0000-4000-8000-0000000000b2') <> ARRAY['requester', 'interpreter']
     OR identity.roles_of('00000000-0000-4000-8000-0000000000b5') <> ARRAY['staff'] THEN
    RAISE EXCEPTION 'FAIL - roles are resolved from the profiles and the team';
  END IF;
  PERFORM identity.set_active_role('00000000-0000-4000-8000-0000000000b2', 'requester');
  v_code := NULL;
  BEGIN PERFORM identity.set_active_role('00000000-0000-4000-8000-0000000000b4', 'requester');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN'
     OR (SELECT last_active_role FROM identity.profiles WHERE id = '00000000-0000-4000-8000-0000000000b2') <> 'requester' THEN
    RAISE EXCEPTION 'FAIL - the active role is one the account has (got %)', v_code;
  END IF;
  RAISE NOTICE 'ok - roles are resolved, created once each, slugs unique, and the active role is checked (R-ACC-02, R-ACC-04)';
END $$;

-- R-ORG-01..04 ----------------------------------------------------------------------------------------

DO $$
DECLARE v_org identity.organizations; v_code text; v_invite jsonb; v_token text; v_member identity.organization_members;
BEGIN
  v_org := identity.create_organization('00000000-0000-4000-8000-0000000000b1', ' Empresa Teste ', '5417000001',
                                        'Saúde', NULL, 'Luanda', '+244923000000', 'https://empresa.ao');
  IF identity.member_role(v_org.id, '00000000-0000-4000-8000-0000000000b1') <> 'owner'
     OR NOT 'requester' = ANY (identity.roles_of('00000000-0000-4000-8000-0000000000b1')) THEN
    RAISE EXCEPTION 'FAIL - who creates an organisation is its owner and becomes a requester';
  END IF;
  BEGIN PERFORM identity.create_organization('00000000-0000-4000-8000-0000000000b6', 'Outra', '5417000001', NULL, NULL, NULL, NULL, NULL);
  EXCEPTION WHEN unique_violation THEN v_code := 'unique'; END;
  IF v_code IS DISTINCT FROM 'unique' THEN RAISE EXCEPTION 'FAIL - the NIF is unique'; END IF;
  PERFORM set_config('test.org', v_org.id::text, true);

  -- Invites: only owner/admin; only the exact email accepts; accepting is final.
  v_code := NULL;
  BEGIN PERFORM identity.create_invite('00000000-0000-4000-8000-0000000000b6', v_org.id, 'carla@empresa.ao', 'member');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - only owner/admin invite (got %)', v_code; END IF;
  v_invite := identity.create_invite('00000000-0000-4000-8000-0000000000b1', v_org.id, ' Carla@Empresa.ao ', 'admin');
  v_token := v_invite ->> 'token';
  IF v_invite -> 'invite' ? 'token_hash' OR length(v_token) < 40
     OR NOT EXISTS (SELECT 1 FROM identity.organization_invites WHERE token_hash = identity.hash_token(v_token) AND email = 'carla@empresa.ao'
                      AND expires_at BETWEEN now() + interval '6 days 23 hours' AND now() + interval '7 days 1 hour')
     OR EXISTS (SELECT 1 FROM identity.organization_invites WHERE token_hash = v_token) THEN
    RAISE EXCEPTION 'FAIL - an invite keeps the hash only and expires after org_invite_expiry_days';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM notify.email_outbox WHERE template = 'org_invite' AND to_email = 'carla@empresa.ao'
                   AND payload ->> 'link' = '/invite/' || v_token AND payload ->> 'app' = 'requester') THEN
    RAISE EXCEPTION 'FAIL - the invite is emailed with its link (org_invite)';
  END IF;
  IF (identity.invite_preview(v_token) ->> 'email_masked') <> 'ca***@empresa.ao'
     OR (identity.invite_preview(v_token) ->> 'organization_name') <> 'Empresa Teste'
     OR identity.invite_preview('nope') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL - the invite preview shows the organisation and a masked email';
  END IF;
  v_code := NULL;
  BEGIN PERFORM identity.accept_invite('00000000-0000-4000-8000-0000000000b6', v_token);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'INVITE_EMAIL_MISMATCH' THEN RAISE EXCEPTION 'FAIL - another email cannot accept (got %)', v_code; END IF;
  v_member := identity.accept_invite('00000000-0000-4000-8000-0000000000b3', v_token);
  IF v_member.role <> 'admin' OR NOT EXISTS (SELECT 1 FROM notify.notifications WHERE kind = 'org_invite_accepted'
                                                AND account_id = '00000000-0000-4000-8000-0000000000b1') THEN
    RAISE EXCEPTION 'FAIL - the invited email joins with the invited role, and who invited is told (org_invite_accepted)';
  END IF;
  v_code := NULL;
  BEGIN PERFORM identity.accept_invite('00000000-0000-4000-8000-0000000000b3', v_token);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'INVITE_INVALID' THEN RAISE EXCEPTION 'FAIL - an accepted invite is final (got %)', v_code; END IF;

  -- Revoke and expire are final too; a repeated invite replaces the pending one.
  v_invite := identity.create_invite('00000000-0000-4000-8000-0000000000b3', v_org.id, 'beto@empresa.ao', 'member');
  PERFORM identity.create_invite('00000000-0000-4000-8000-0000000000b1', v_org.id, 'beto@empresa.ao', 'member');
  IF (SELECT count(*) FROM identity.organization_invites WHERE email = 'beto@empresa.ao' AND status = 'pending') <> 1
     OR (SELECT status FROM identity.organization_invites WHERE id = (v_invite -> 'invite' ->> 'id')::uuid) <> 'revoked' THEN
    RAISE EXCEPTION 'FAIL - one pending invite per email; the new one replaces the old';
  END IF;
  v_code := NULL;
  BEGIN PERFORM identity.accept_invite('00000000-0000-4000-8000-0000000000b2', v_invite ->> 'token');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'INVITE_INVALID' THEN RAISE EXCEPTION 'FAIL - a revoked invite cannot be accepted (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.create_invite('00000000-0000-4000-8000-0000000000b1', v_org.id, 'carla@empresa.ao', 'member');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - a member is not invited again (got %)', v_code; END IF;
  RAISE NOTICE 'ok - organisations: owner on creation, unique NIF, invites by owner/admin to the exact email, final once decided (R-ORG-01, R-ORG-02)';
END $$;

-- Expiry runs on the test clock.
DO $$
DECLARE v_token text; v_expired int;
BEGIN
  v_token := identity.create_invite('00000000-0000-4000-8000-0000000000b1', current_setting('test.org')::uuid, 'beto@empresa.ao', 'member') ->> 'token';
  INSERT INTO util.test_clock (frozen_at) VALUES (now() + interval '8 days');
  v_expired := identity.expire_org_invites();
  IF v_expired < 1
     OR (SELECT status FROM identity.organization_invites WHERE token_hash = identity.hash_token(v_token)) <> 'expired' THEN
    RAISE EXCEPTION 'FAIL - pending invites past their date expire';
  END IF;
  DELETE FROM util.test_clock;
  RAISE NOTICE 'ok - pending invites expire after org_invite_expiry_days (R-ORG-02)';
END $$;

DO $$
DECLARE v_org uuid := current_setting('test.org')::uuid; v_code text; v_token text;
BEGIN
  -- Beto joins as member.
  v_token := identity.create_invite('00000000-0000-4000-8000-0000000000b1', v_org, 'beto@empresa.ao', 'member') ->> 'token';
  PERFORM identity.accept_invite('00000000-0000-4000-8000-0000000000b2', v_token);
  -- R-ORG-03: only the owner changes roles; the owner is never demoted or removed (LAST_OWNER).
  BEGIN PERFORM identity.set_member_role('00000000-0000-4000-8000-0000000000b3', v_org, '00000000-0000-4000-8000-0000000000b2', 'admin');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - an admin does not change roles (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.remove_member('00000000-0000-4000-8000-0000000000b3', v_org, '00000000-0000-4000-8000-0000000000b1');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'LAST_OWNER' THEN RAISE EXCEPTION 'FAIL - removing the only owner gives LAST_OWNER (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.remove_member('00000000-0000-4000-8000-0000000000b1', v_org, '00000000-0000-4000-8000-0000000000b1');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'LAST_OWNER' THEN RAISE EXCEPTION 'FAIL - the owner leaves only after transferring (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.set_member_role('00000000-0000-4000-8000-0000000000b1', v_org, '00000000-0000-4000-8000-0000000000b1', 'member');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'LAST_OWNER' THEN RAISE EXCEPTION 'FAIL - the owner is never demoted directly (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.transfer_ownership('00000000-0000-4000-8000-0000000000b1', v_org, '00000000-0000-4000-8000-0000000000b6');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - ownership goes only to a member (got %)', v_code; END IF;
  PERFORM identity.transfer_ownership('00000000-0000-4000-8000-0000000000b1', v_org, '00000000-0000-4000-8000-0000000000b3');
  IF identity.member_role(v_org, '00000000-0000-4000-8000-0000000000b1') <> 'admin'
     OR identity.member_role(v_org, '00000000-0000-4000-8000-0000000000b3') <> 'owner'
     OR (SELECT count(*) FROM identity.organization_members WHERE organization_id = v_org AND role = 'owner' AND status = 'active') <> 1 THEN
    RAISE EXCEPTION 'FAIL - transferring makes the old owner admin, always one owner';
  END IF;
  -- R-ORG-04: an admin removes a member; anyone leaves.
  PERFORM identity.remove_member('00000000-0000-4000-8000-0000000000b1', v_org, '00000000-0000-4000-8000-0000000000b2');
  IF identity.member_role(v_org, '00000000-0000-4000-8000-0000000000b2') IS NOT NULL THEN RAISE EXCEPTION 'FAIL - an admin removes a member'; END IF;
  PERFORM identity.remove_member('00000000-0000-4000-8000-0000000000b1', v_org, '00000000-0000-4000-8000-0000000000b1');
  IF identity.member_role(v_org, '00000000-0000-4000-8000-0000000000b1') IS NOT NULL THEN RAISE EXCEPTION 'FAIL - an admin leaves alone'; END IF;
  IF NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'organization.ownership_transferred' AND entity_id = v_org::text) THEN
    RAISE EXCEPTION 'FAIL - organisation changes are audited';
  END IF;
  RAISE NOTICE 'ok - one owner always: LAST_OWNER, transfer, remove and leave (R-ORG-03, R-ORG-04)';
END $$;

-- Reads by RLS (R-ORG-05, data-model §1) -------------------------------------------------------------

DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b3", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_refused int := 0;
BEGIN
  IF (SELECT count(*) FROM identity.organizations) <> 1 OR NOT EXISTS (SELECT 1 FROM identity.organization_invites)
     OR NOT EXISTS (SELECT 1 FROM identity.organization_member_directory WHERE email = 'carla@empresa.ao')
     OR EXISTS (SELECT 1 FROM identity.organization_member_directory WHERE status <> 'active')
     OR EXISTS (SELECT 1 FROM identity.account_directory) OR EXISTS (SELECT 1 FROM identity.organization_directory) THEN
    RAISE EXCEPTION 'FAIL - an owner sees its organisation, its invites and active members, and no team views';
  END IF;
  BEGIN PERFORM token_hash FROM identity.organization_invites; EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN UPDATE identity.organizations SET nif = '5417000099'; EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN INSERT INTO identity.organization_members (organization_id, account_id, role)
          VALUES (current_setting('test.org')::uuid, '00000000-0000-4000-8000-0000000000b6', 'owner');
  EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  IF v_refused <> 3 THEN RAISE EXCEPTION 'FAIL - no token hash, no NIF change, no membership written directly (% of 3)', v_refused; END IF;
  UPDATE identity.organizations SET city = 'Benguela';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL - the owner edits the open columns'; END IF;
  RAISE NOTICE 'ok - an owner reads its organisation and invites (never the hash) and edits only the open columns';
END $$;
RESET ROLE;

DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b6", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM identity.organizations) OR EXISTS (SELECT 1 FROM identity.organization_members)
     OR EXISTS (SELECT 1 FROM identity.organization_invites) OR EXISTS (SELECT 1 FROM identity.organization_member_directory)
     OR EXISTS (SELECT 1 FROM identity.requester_profiles) OR (SELECT count(*) FROM identity.consents) <> 2
     OR NOT EXISTS (SELECT 1 FROM identity.interpreter_profiles WHERE slug = 'ivo-goncalves-interprete')
     OR NOT EXISTS (SELECT 1 FROM identity.public_profiles WHERE full_name = 'Olga Dona') THEN
    RAISE EXCEPTION 'FAIL - an outsider sees no organisation data, only interpreters, public names and its own consents';
  END IF;
  UPDATE identity.interpreter_profiles SET bio = 'mudado';
  IF FOUND THEN RAISE EXCEPTION 'FAIL - only the owner edits an interpreter profile'; END IF;
  RAISE NOTICE 'ok - an outsider sees interpreters and names, nothing of organisations it is not in';
END $$;
RESET ROLE;

DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b5", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM identity.account_directory WHERE email = 'ivo@exemplo.ao' AND is_interpreter)
     OR NOT EXISTS (SELECT 1 FROM identity.organization_directory WHERE owner_email = 'carla@empresa.ao' AND member_count = 1)
     OR NOT EXISTS (SELECT 1 FROM identity.organization_member_directory WHERE status = 'removed') THEN
    RAISE EXCEPTION 'FAIL - the team lists accounts with email and roles, and organisations with owner and members';
  END IF;
  RAISE NOTICE 'ok - the team lists accounts and organisations (admin /requesters, /interpreters, /organizations)';
END $$;
RESET ROLE;

-- R-ACC-03, R-ACC-05, R-ACC-06 (criteria 5 for the directory, 6) -------------------------------------

-- A forced error in the middle of the suspension changes nothing (criterion 5).
CREATE FUNCTION pg_temp.fail_notice() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'forced failure'; END $$;
CREATE TRIGGER fail_notice BEFORE INSERT ON notify.email_outbox FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_notice();
DO $$
DECLARE v_failed boolean := false;
BEGIN
  BEGIN PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000b4', 'Fraude comprovada');
  EXCEPTION WHEN raise_exception THEN v_failed := true; END;
  IF NOT v_failed OR (SELECT status FROM identity.profiles WHERE id = '00000000-0000-4000-8000-0000000000b4') <> 'active'
     OR NOT EXISTS (SELECT 1 FROM directory.listed_interpreters WHERE account_id = '00000000-0000-4000-8000-0000000000b4') THEN
    RAISE EXCEPTION 'FAIL - a suspension that fails half-way changes nothing';
  END IF;
  RAISE NOTICE 'ok - a suspension that fails half-way leaves the account active and listed (criterion 5, one transaction)';
END $$;
DROP TRIGGER fail_notice ON notify.email_outbox;

DO $$
DECLARE v_code text;
BEGIN
  BEGIN PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000b4', 'Fraude comprovada');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - only the team suspends (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000b4', ' ');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - the reason is required (got %)', v_code; END IF;
  PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000b4', 'Fraude comprovada');
  IF auth_helper.account_status('00000000-0000-4000-8000-0000000000b4') <> 'suspended'
     OR EXISTS (SELECT 1 FROM directory.listed_interpreters WHERE account_id = '00000000-0000-4000-8000-0000000000b4')
     OR NOT EXISTS (SELECT 1 FROM notify.email_outbox WHERE template = 'account_suspended' AND to_email = 'ivo@exemplo.ao')
     OR NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'account.suspended' AND entity_id = '00000000-0000-4000-8000-0000000000b4'
                      AND after ->> 'reason' = 'Fraude comprovada') THEN
    RAISE EXCEPTION 'FAIL - a suspended interpreter leaves the directory, is emailed and the suspension audited';
  END IF;
  v_code := NULL;
  BEGIN PERFORM identity.suspend_account('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000b5', 'Eu próprio');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - the team is never suspended here (got %)', v_code; END IF;
  RAISE NOTICE 'ok - a moderator suspends with a reason; the interpreter leaves the directory at once (R-ACC-05, criterion 5)';
END $$;

DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b4", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM identity.profiles) OR EXISTS (SELECT 1 FROM identity.interpreter_profiles)
     OR EXISTS (SELECT 1 FROM identity.consents) OR EXISTS (SELECT 1 FROM identity.public_profiles)
     OR EXISTS (SELECT 1 FROM notify.notifications) OR EXISTS (SELECT 1 FROM directory.listed_interpreters) THEN
    RAISE EXCEPTION 'FAIL - a suspended account reads zero rows';
  END IF;
  UPDATE identity.profiles SET full_name = 'Outro nome';
  IF FOUND THEN RAISE EXCEPTION 'FAIL - a suspended account writes nothing'; END IF;
  RAISE NOTICE 'ok - a suspended account reads zero rows by RLS and writes nothing (R-ACC-03, criterion 6)';
END $$;
RESET ROLE;

DO $$
DECLARE v_code text;
BEGIN
  PERFORM identity.reactivate_account('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000b4');
  BEGIN PERFORM identity.reactivate_account('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000b4');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF auth_helper.account_status('00000000-0000-4000-8000-0000000000b4') <> 'active' OR v_code IS DISTINCT FROM 'STATE_CHANGED'
     OR NOT EXISTS (SELECT 1 FROM directory.listed_interpreters WHERE account_id = '00000000-0000-4000-8000-0000000000b4') THEN
    RAISE EXCEPTION 'FAIL - reactivation brings the account back, once';
  END IF;
  -- An organisation: suspended, its members keep their accounts; it invites nobody meanwhile.
  PERFORM identity.suspend_organization('00000000-0000-4000-8000-0000000000b5', current_setting('test.org')::uuid, 'Pagamentos em falta');
  v_code := NULL;
  BEGIN PERFORM identity.create_invite('00000000-0000-4000-8000-0000000000b3', current_setting('test.org')::uuid, 'novo@empresa.ao', 'member');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' OR auth_helper.account_status('00000000-0000-4000-8000-0000000000b3') <> 'active'
     OR (identity.me('00000000-0000-4000-8000-0000000000b3') -> 'organizations' -> 0 ->> 'status') <> 'suspended' THEN
    RAISE EXCEPTION 'FAIL - a suspended organisation keeps its members active and invites nobody';
  END IF;
  PERFORM identity.reactivate_organization('00000000-0000-4000-8000-0000000000b5', current_setting('test.org')::uuid);
  RAISE NOTICE 'ok - reactivation of accounts and organisations; a suspended organisation keeps its members (R-ACC-03, R-ACC-06)';
END $$;

-- R-PRIV-02: a new version must be accepted again (criterion 2) -----------------------------------------

DO $$
DECLARE v_doc identity.legal_documents; v_super uuid := '00000000-0000-4000-8000-0000000000b5';
BEGIN
  UPDATE identity.staff_members SET level = 'super_admin' WHERE account_id = v_super;
  v_doc := identity.create_legal_draft(v_super, 'terms', 'Termos novos');
  PERFORM identity.publish_legal_document(v_super, v_doc.id);
  IF auth_helper.account_status('00000000-0000-4000-8000-0000000000b6') <> 'terms_required'
     OR NOT (identity.me('00000000-0000-4000-8000-0000000000b6') ->> 'terms_acceptance_required')::boolean
     OR (identity.me('00000000-0000-4000-8000-0000000000b6') -> 'pending_documents' -> 0 ->> 'id')::uuid <> v_doc.id
     OR NOT EXISTS (SELECT 1 FROM notify.email_outbox WHERE template = 'terms_updated' AND to_email = 'rui@exemplo.ao') THEN
    RAISE EXCEPTION 'FAIL - a new version is required of every account, and announced by email (terms_updated)';
  END IF;
  PERFORM set_config('test.new_terms', v_doc.id::text, true);
  UPDATE identity.staff_members SET level = 'moderator' WHERE account_id = v_super;
  RAISE NOTICE 'ok - publishing a new version makes every account accept it, announced by email (R-PRIV-02)';
END $$;

DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000b6", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF auth_helper.account_id() IS NOT NULL OR EXISTS (SELECT 1 FROM identity.profiles) THEN
    RAISE EXCEPTION 'FAIL - until the new version is accepted, RLS shows nothing';
  END IF;
  RAISE NOTICE 'ok - an account with a version to accept reads nothing directly (R-PRIV-02)';
END $$;
RESET ROLE;

DO $$
DECLARE v_left int;
BEGIN
  v_left := identity.record_consents('00000000-0000-4000-8000-0000000000b6', ARRAY[current_setting('test.new_terms')::uuid], NULL, NULL);
  IF v_left <> 0
     OR auth_helper.account_status('00000000-0000-4000-8000-0000000000b6') <> 'active' THEN
    RAISE EXCEPTION 'FAIL - accepting the new version gives the account back';
  END IF;
  RAISE NOTICE 'ok - accepting the new version gives the account back (R-PRIV-02)';
END $$;

-- identity.anonymize_account skeleton (R-PRIV-03 criterion 4, the identity part) ---------------------

DO $$
DECLARE v_code text; v_org uuid := current_setting('test.org')::uuid; v_solo identity.organizations;
BEGIN
  -- Carla owns an organisation with another member (Olga rejoins): refused.
  PERFORM identity.accept_invite('00000000-0000-4000-8000-0000000000b1',
            identity.create_invite('00000000-0000-4000-8000-0000000000b3', v_org, 'olga@empresa.ao', 'member') ->> 'token');
  BEGIN PERFORM identity.anonymize_account('00000000-0000-4000-8000-0000000000b3');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'LAST_OWNER' THEN RAISE EXCEPTION 'FAIL - an owner with members is not anonymized (got %)', v_code; END IF;

  -- Ivo: interpreter, sole owner of an organisation, with a phone and a pending invite elsewhere.
  UPDATE identity.profiles SET phone = '+244923111222' WHERE id = '00000000-0000-4000-8000-0000000000b4';
  UPDATE identity.interpreter_profiles SET contact_phone = '+244923111222', website_url = 'https://ivo.ao'
   WHERE account_id = '00000000-0000-4000-8000-0000000000b4';
  v_solo := identity.create_organization('00000000-0000-4000-8000-0000000000b4', 'Ivo Lda', '5417000077', NULL, 'Rua do Ivo', NULL, NULL, NULL);
  PERFORM identity.create_invite('00000000-0000-4000-8000-0000000000b3', v_org, 'ivo@exemplo.ao', 'member');
  -- Ivo invited someone to his own organisation: that invite survives him, unsigned.
  PERFORM identity.create_invite('00000000-0000-4000-8000-0000000000b4', v_solo.id, 'convidado@exemplo.ao', 'member');
  PERFORM identity.anonymize_account('00000000-0000-4000-8000-0000000000b4');
  IF NOT EXISTS (SELECT 1 FROM identity.organization_invites WHERE email = 'convidado@exemplo.ao' AND invited_by IS NULL)
     OR auth_helper.account_status('00000000-0000-4000-8000-0000000000b4') <> 'suspended' THEN
    RAISE EXCEPTION 'FAIL - invites sent to others survive, unsigned; an anonymized account is refused as suspended (R-ACC-03)';
  END IF;

  IF EXISTS (SELECT 1 FROM identity.profiles WHERE full_name LIKE '%Ivo%' OR phone = '+244923111222')
     OR EXISTS (SELECT 1 FROM identity.interpreter_profiles WHERE account_id = '00000000-0000-4000-8000-0000000000b4'
                  AND (slug LIKE 'ivo%' OR contact_phone IS NOT NULL OR website_url IS NOT NULL))
     OR EXISTS (SELECT 1 FROM identity.organizations WHERE name = 'Ivo Lda' OR address = 'Rua do Ivo')
     OR EXISTS (SELECT 1 FROM identity.organization_invites WHERE email = 'ivo@exemplo.ao')
     OR (SELECT status FROM identity.profiles WHERE id = '00000000-0000-4000-8000-0000000000b4') <> 'anonymized'
     OR (SELECT nif FROM identity.organizations WHERE id = v_solo.id) <> '5417000077'
     OR (SELECT count(*) FROM identity.consents WHERE account_id = '00000000-0000-4000-8000-0000000000b4') = 0
     OR EXISTS (SELECT 1 FROM directory.listed_interpreters WHERE account_id = '00000000-0000-4000-8000-0000000000b4') THEN
    RAISE EXCEPTION 'FAIL - anonymizing leaves no name, phone or contact in identity; keeps the NIF and the consents';
  END IF;
  RAISE NOTICE 'ok - anonymize_account (skeleton): no old name, phone or contact left in identity; NIF and consents kept (R-PRIV-03)';
END $$;
