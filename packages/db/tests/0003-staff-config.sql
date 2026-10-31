-- Named assertions for step H1 (staff-and-config.md criteria 1–5, 7; R-STF, R-CFG, R-AUD).
-- Rolled back by scripts/run-tests.sh. Accounts: s1/s2 super_admin, mo moderator, fi finance,
-- pl a plain account.

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 's1@example.ao', '{"full_name": "Sara Um"}'),
  ('00000000-0000-4000-8000-0000000000a2', 's2@example.ao', '{}'),
  ('00000000-0000-4000-8000-0000000000a3', 'mo@example.ao', '{"full_name": "Mo Moderador"}'),
  ('00000000-0000-4000-8000-0000000000a4', 'fi@example.ao', '{}'),
  ('00000000-0000-4000-8000-0000000000a5', 'Pl@Example.ao', '{"full_name": "  "}');
-- Only this file's team counts (a development database may hold others; all of this is rolled back).
UPDATE identity.staff_members SET active = false WHERE active;
INSERT INTO identity.staff_members (account_id, level) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'super_admin'),
  ('00000000-0000-4000-8000-0000000000a3', 'moderator'),
  ('00000000-0000-4000-8000-0000000000a4', 'finance');

DO $$
BEGIN
  IF (SELECT full_name FROM identity.profiles WHERE id = '00000000-0000-4000-8000-0000000000a1') <> 'Sara Um'
     OR (SELECT full_name FROM identity.profiles WHERE id = '00000000-0000-4000-8000-0000000000a5') <> 'Pl'
     OR (SELECT status FROM identity.profiles WHERE id = '00000000-0000-4000-8000-0000000000a2') <> 'active' THEN
    RAISE EXCEPTION 'FAIL - a new auth account gets one active profile, named from the sign-up or the email';
  END IF;
  RAISE NOTICE 'ok - a new auth account gets exactly one active profile (R-ACC-01)';
END $$;

-- R-STF-01, R-STF-02 --------------------------------------------------------------------------------

DO $$
DECLARE v_code text;
BEGIN
  BEGIN PERFORM identity.add_staff_member('00000000-0000-4000-8000-0000000000a3', 's2@example.ao', 'finance');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - only super_admin changes the team (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.add_staff_member('00000000-0000-4000-8000-0000000000a1', 'nobody@example.ao', 'finance');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'ACCOUNT_NOT_FOUND' THEN RAISE EXCEPTION 'FAIL - adding an email without an account gives ACCOUNT_NOT_FOUND (got %)', v_code; END IF;
  PERFORM identity.add_staff_member('00000000-0000-4000-8000-0000000000a1', '  PL@example.AO ', 'request_operator');
  IF (SELECT level FROM identity.staff_members WHERE account_id = '00000000-0000-4000-8000-0000000000a5') <> 'request_operator' THEN
    RAISE EXCEPTION 'FAIL - a super_admin adds an existing account by exact email, any case';
  END IF;
  RAISE NOTICE 'ok - only super_admin adds staff, by the exact email of an existing account (R-STF-01)';
END $$;

DO $$
DECLARE v_code text; v_count int;
BEGIN
  BEGIN PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'super_admin', false);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'LAST_SUPER_ADMIN' THEN RAISE EXCEPTION 'FAIL - the last super_admin cannot be deactivated (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'moderator', true);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'LAST_SUPER_ADMIN' THEN RAISE EXCEPTION 'FAIL - the last super_admin cannot be demoted (got %)', v_code; END IF;
  -- With a second super_admin, the first may step down; then the second is the last one.
  PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2', 'super_admin', true);
  PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a1', 'moderator', true);
  SELECT count(*) INTO v_count FROM identity.staff_members WHERE active AND level = 'super_admin';
  v_code := NULL;
  BEGIN PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a2', 'super_admin', false);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_count <> 1 OR v_code IS DISTINCT FROM 'LAST_SUPER_ADMIN' THEN
    RAISE EXCEPTION 'FAIL - there is always one active super_admin (count %, got %)', v_count, v_code;
  END IF;
  -- Put the team back as it was for the next assertions.
  PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a1', 'super_admin', true);
  IF NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'staff.changed' AND entity_id = '00000000-0000-4000-8000-0000000000a1'
                   AND before ->> 'level' = 'super_admin' AND after ->> 'level' = 'moderator') THEN
    RAISE EXCEPTION 'FAIL - a staff change is audited with the value before and after';
  END IF;
  RAISE NOTICE 'ok - the last active super_admin can be neither deactivated nor demoted (R-STF-02), and changes are audited';
END $$;

-- R-CFG-01..04 ---------------------------------------------------------------------------------------

DO $$
DECLARE v_v1 uuid; v_v2 config.platform_versions; v_code text;
BEGIN
  SELECT id INTO v_v1 FROM config.platform_versions WHERE version_number = 1;
  -- The local database may already have version 1 published by bootstrap-admin; start from a known state.
  IF config.current_version_id() IS NULL THEN
    PERFORM config.publish_version('00000000-0000-4000-8000-0000000000a1', v_v1, NULL);
  END IF;
  v_v1 := config.current_version_id();
  v_v2 := config.create_draft('00000000-0000-4000-8000-0000000000a1');
  PERFORM config.update_draft('00000000-0000-4000-8000-0000000000a1', v_v2.id, '{"invite_expiry_hours": 1234, "verification_fee_aoa": null}');
  PERFORM config.publish_version('00000000-0000-4000-8000-0000000000a1', v_v2.id, v_v1);
  IF (SELECT count(*) FROM config.platform_versions WHERE status = 'published') <> 1
     OR config.current_version_id() <> v_v2.id
     OR (SELECT status FROM config.platform_versions WHERE id = v_v1) <> 'retired' THEN
    RAISE EXCEPTION 'FAIL - publishing leaves exactly one published version and retires the previous';
  END IF;
  -- A second publish that still expects the old version in force is refused.
  v_v2 := config.create_draft('00000000-0000-4000-8000-0000000000a1');
  BEGIN PERFORM config.publish_version('00000000-0000-4000-8000-0000000000a1', v_v2.id, v_v1);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - a publish over a version no longer in force gives STATE_CHANGED (got %)', v_code; END IF;
  IF NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'config.published' AND entity_id = config.current_version_id()::text
                   AND before ? 'invite_expiry_hours' AND after ->> 'invite_expiry_hours' = '1234') THEN
    RAISE EXCEPTION 'FAIL - publishing audits every changed field, before and after';
  END IF;
  RAISE NOTICE 'ok - one version in force, the previous retired, stale publishes refused, changes audited (R-CFG-01, R-CFG-02)';
END $$;

DO $$
DECLARE v_refused int := 0; v_code text;
BEGIN
  BEGIN UPDATE config.platform_versions SET invite_expiry_hours = 1 WHERE status = 'published';
  EXCEPTION WHEN raise_exception THEN v_refused := v_refused + 1; END;
  BEGIN UPDATE config.platform_versions SET invite_expiry_hours = 1 WHERE status = 'retired';
  EXCEPTION WHEN raise_exception THEN v_refused := v_refused + 1; END;
  BEGIN DELETE FROM config.platform_versions WHERE status = 'published';
  EXCEPTION WHEN raise_exception THEN v_refused := v_refused + 1; END;
  BEGIN UPDATE config.platform_versions SET status = 'retired', invite_expiry_hours = 2 WHERE status = 'published';
  EXCEPTION WHEN raise_exception THEN v_refused := v_refused + 1; END;
  BEGIN PERFORM config.update_draft('00000000-0000-4000-8000-0000000000a1', config.current_version_id(), '{"invite_expiry_hours": 2}');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_refused <> 4 OR v_code IS DISTINCT FROM 'STATE_CHANGED' THEN
    RAISE EXCEPTION 'FAIL - published and retired versions never change, not even for the owner (% of 4, %)', v_refused, v_code;
  END IF;
  v_code := NULL;
  BEGIN PERFORM config.update_draft('00000000-0000-4000-8000-0000000000a1',
    (SELECT id FROM config.platform_versions WHERE status = 'draft' LIMIT 1), '{"status": "published"}');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'VALIDATION_FAILED' THEN RAISE EXCEPTION 'FAIL - a draft edit cannot touch bookkeeping fields (got %)', v_code; END IF;
  RAISE NOTICE 'ok - publishing is not editing: published and retired versions are immutable (R-CFG-02)';
END $$;

DO $$
DECLARE v_code text;
BEGIN
  IF config.require(config.current_version_id(), 'invite_expiry_hours') <> '1234' THEN
    RAISE EXCEPTION 'FAIL - config.require returns a value that is set';
  END IF;
  BEGIN PERFORM config.require(config.current_version_id(), 'verification_fee_aoa');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'CONFIG_VALUE_MISSING' THEN RAISE EXCEPTION 'FAIL - an empty value refuses with CONFIG_VALUE_MISSING (got %)', v_code; END IF;
  RAISE NOTICE 'ok - an empty configuration value blocks with CONFIG_VALUE_MISSING, never a default (R-CFG-04)';
END $$;

-- A super_admin may step down when another one exists; a suspended member can be deactivated.
DO $$
DECLARE v_row identity.staff_members;
BEGIN
  PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2', 'super_admin', true);
  v_row := identity.set_staff_member('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'moderator', true);
  IF v_row.level <> 'moderator' OR NOT EXISTS (SELECT 1 FROM audit.events WHERE action = 'staff.changed'
       AND entity_id = '00000000-0000-4000-8000-0000000000a1' AND actor_role = 'super_admin' AND after ->> 'level' = 'moderator') THEN
    RAISE EXCEPTION 'FAIL - a super_admin steps down, audited as the super_admin who acted';
  END IF;
  PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a1', 'super_admin', true);
  UPDATE identity.profiles SET status = 'suspended', suspended_at = now() WHERE id = '00000000-0000-4000-8000-0000000000a4';
  v_row := identity.set_staff_member('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a4', 'finance', false);
  IF v_row.active THEN RAISE EXCEPTION 'FAIL - a suspended member can be deactivated'; END IF;
  UPDATE identity.profiles SET status = 'active', suspended_at = NULL WHERE id = '00000000-0000-4000-8000-0000000000a4';
  PERFORM identity.set_staff_member('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a4', 'finance', true);
  RAISE NOTICE 'ok - a super_admin may step down when another exists; a suspended member can be deactivated';
END $$;

-- Verification document types: moderator and super_admin only (PC-07).
DO $$
DECLARE v_type config.verification_document_types; v_code text;
BEGIN
  v_type := config.save_document_type('00000000-0000-4000-8000-0000000000a3', NULL, 'driving_licence', 'Carta de condução', '', false, true, 9);
  PERFORM config.save_document_type('00000000-0000-4000-8000-0000000000a3', v_type.id, 'driving_licence', 'Carta de condução', 'nova', true, true, 9);
  BEGIN PERFORM config.delete_document_type('00000000-0000-4000-8000-0000000000a4', v_type.id);
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'FAIL - finance cannot change document types (got %)', v_code; END IF;
  PERFORM config.delete_document_type('00000000-0000-4000-8000-0000000000a3', v_type.id);
  IF EXISTS (SELECT 1 FROM config.verification_document_types WHERE code = 'driving_licence')
     OR (SELECT count(*) FROM audit.events WHERE entity_type = 'document_type' AND entity_id = v_type.id::text) <> 3 THEN
    RAISE EXCEPTION 'FAIL - a moderator creates, edits and removes a type, each audited';
  END IF;
  RAISE NOTICE 'ok - moderators manage verification document types, audited; finance cannot';
END $$;

-- Legal documents ------------------------------------------------------------------------------------

DO $$
DECLARE v_doc identity.legal_documents; v_code text;
BEGIN
  v_doc := identity.create_legal_draft('00000000-0000-4000-8000-0000000000a1', 'terms', 'Texto novo');
  PERFORM identity.publish_legal_document('00000000-0000-4000-8000-0000000000a1', v_doc.id);
  BEGIN PERFORM identity.update_legal_draft('00000000-0000-4000-8000-0000000000a1', v_doc.id, 'mudado');
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - a published legal document is never edited (got %)', v_code; END IF;
  v_code := NULL;
  BEGIN UPDATE identity.legal_documents SET body = 'x' WHERE id = v_doc.id;
  EXCEPTION WHEN raise_exception THEN v_code := SQLERRM; END;
  IF v_code IS DISTINCT FROM 'STATE_CHANGED' THEN RAISE EXCEPTION 'FAIL - not even directly'; END IF;
  RAISE NOTICE 'ok - a published legal document is immutable';
END $$;

-- From H2 the published legal documents must be accepted before anything is read (R-PRIV-02).
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id::text LIKE '00000000-0000-4000-8000-0000000000a_';

-- Reads by RLS: what each caller sees (R-AUD-03, data-model §1, §4) ------------------------------------

INSERT INTO audit.events (actor_role, action, entity_type, entity_id) VALUES ('system', 'test.catalog', 'document_type', 't1');

DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000a3", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM audit.events_for_staff WHERE entity_type = 'document_type')
     OR EXISTS (SELECT 1 FROM audit.events_for_staff WHERE area IN ('configuration', 'team')) THEN
    RAISE EXCEPTION 'FAIL - a moderator sees catalog entries and no configuration or team entries';
  END IF;
  IF EXISTS (SELECT 1 FROM config.platform_versions WHERE status = 'draft')
     OR NOT EXISTS (SELECT 1 FROM identity.staff_directory WHERE email = 's1@example.ao') THEN
    RAISE EXCEPTION 'FAIL - a moderator reads the team list but not configuration drafts';
  END IF;
  BEGIN PERFORM ip FROM audit.events; RAISE EXCEPTION 'FAIL - the team never reads the IP of the audit';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE 'ok - a moderator sees only the audit of its areas (R-AUD-03), the team list, no drafts, no IPs';
END $$;
RESET ROLE;

DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM audit.events_for_staff WHERE area = 'configuration' AND actor_name = 'Sara Um') THEN
    RAISE EXCEPTION 'FAIL - super_admin sees everything, with the actor name';
  END IF;
  RAISE NOTICE 'ok - super_admin sees every audit entry, with the actor name';
END $$;
RESET ROLE;

-- finance and request_operator see their areas only (R-AUD-03).
INSERT INTO audit.events (actor_role, action, entity_type, entity_id) VALUES
  ('system', 'test.payment', 'payment_proof', 'p1'),
  ('system', 'test.conversation', 'thread', 'c1');
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000a4", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM audit.events_for_staff WHERE entity_type = 'payment_proof')
     OR EXISTS (SELECT 1 FROM audit.events_for_staff WHERE area IN ('conversations', 'catalogs', 'configuration', 'team')) THEN
    RAISE EXCEPTION 'FAIL - finance sees payments and never conversations, catalogs, configuration or team';
  END IF;
  RAISE NOTICE 'ok - finance sees the payments audit and no conversation reads (D-58)';
END $$;
RESET ROLE;

-- A plain account: only its own profile, the published configuration and published legal texts.
INSERT INTO identity.legal_documents (kind, version, body) VALUES ('privacy', 99, 'rascunho');
DELETE FROM identity.staff_members WHERE account_id = '00000000-0000-4000-8000-0000000000a5';
DO $$ BEGIN PERFORM set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000a5", "role": "authenticated"}', true); END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_refused int := 0;
BEGIN
  IF (SELECT count(*) FROM identity.profiles) <> 1 OR EXISTS (SELECT 1 FROM identity.staff_members)
     OR EXISTS (SELECT 1 FROM identity.staff_directory) OR EXISTS (SELECT 1 FROM audit.events_for_staff)
     OR EXISTS (SELECT 1 FROM config.platform_versions WHERE status <> 'published')
     OR EXISTS (SELECT 1 FROM identity.legal_documents WHERE published_at IS NULL) THEN
    RAISE EXCEPTION 'FAIL - a plain account sees only its profile and what is published';
  END IF;
  BEGIN PERFORM config.publish_version('00000000-0000-4000-8000-0000000000a5', gen_random_uuid(), NULL);
  EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN UPDATE identity.profiles SET status = 'active'; EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  IF v_refused <> 2 THEN RAISE EXCEPTION 'FAIL - the session writes nothing of step H1 directly (% of 2)', v_refused; END IF;
  RAISE NOTICE 'ok - a plain account sees only its profile and what is published, and writes nothing directly';
END $$;
RESET ROLE;

SET LOCAL ROLE anon;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM config.platform_versions) OR EXISTS (SELECT 1 FROM config.platform_versions WHERE status <> 'published') THEN
    RAISE EXCEPTION 'FAIL - a visitor reads only the version in force';
  END IF;
  RAISE NOTICE 'ok - a visitor reads the configuration in force (the site shows deadlines) and nothing else of it';
END $$;
RESET ROLE;

-- A suspended account is nobody (R-ACC-03).
UPDATE identity.profiles SET status = 'suspended', suspended_at = now() WHERE id = '00000000-0000-4000-8000-0000000000a3';
DO $$
BEGIN
  IF auth_helper.account_status('00000000-0000-4000-8000-0000000000a3') <> 'suspended'
     OR auth_helper.staff_level_of('00000000-0000-4000-8000-0000000000a3') IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL - a suspended account loses its staff level';
  END IF;
  RAISE NOTICE 'ok - a suspended account is reported suspended and has no staff level';
END $$;
