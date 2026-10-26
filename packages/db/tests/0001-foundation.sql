-- Named assertions for the foundation (foundation.md §F item 4). Run by scripts/run-tests.sh
-- inside a transaction that is rolled back. Each block prints "ok - <name>" or fails naming it.
-- The project's schemas come from util.project_schemas(), the one SQL list of them.

-- Structure ---------------------------------------------------------------------------------------

DO $$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ') INTO v_missing
    FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace
   WHERE c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
     AND (n.nspname = ANY (util.project_schemas()) OR n.nspname = 'public');
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'FAIL - every table has RLS: %', v_missing; END IF;
  RAISE NOTICE 'ok - every table in the project schemas and in public has RLS enabled';
END $$;

DO $$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(p.oid::regprocedure::text, ', ') INTO v_missing
    FROM pg_proc AS p JOIN pg_namespace AS n ON n.oid = p.pronamespace
   WHERE p.prosecdef AND n.nspname = ANY (util.project_schemas())
     AND NOT coalesce('search_path=""' = ANY (p.proconfig), false);
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'FAIL - SECURITY DEFINER pins search_path: %', v_missing; END IF;
  RAISE NOTICE 'ok - every SECURITY DEFINER function has search_path = ''''';
END $$;

-- Routines: who may run them, read straight from the ACL (procedures and aggregates included).
DO $$
DECLARE v_open text;
BEGIN
  SELECT string_agg(format('%s to %s', p.oid::regprocedure,
                           CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END), ', ') INTO v_open
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) AS a
   WHERE n.nspname = ANY (util.project_schemas())
     AND a.privilege_type = 'EXECUTE'
     AND a.grantee <> p.proowner
     AND NOT (pg_get_userbyid(a.grantee) = 'service_role')
     AND NOT (pg_get_userbyid(a.grantee) = 'authenticated' AND n.nspname = 'auth_helper');
  IF v_open IS NOT NULL THEN RAISE EXCEPTION 'FAIL - routines are closed by default: %', v_open; END IF;
  RAISE NOTICE 'ok - routines run only for service_role; authenticated runs only auth_helper; never PUBLIC or anon';
END $$;

DO $$
DECLARE v_open text;
BEGIN
  SELECT string_agg(format('%I.%I %s to %s', n.nspname, c.relname, x.privilege, r.role), ', ') INTO v_open
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r (role)
    CROSS JOIN (VALUES ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE')) AS x (privilege)
   WHERE c.relkind IN ('r', 'p', 'v', 'm')
     AND n.nspname = ANY (util.project_schemas())
     AND has_table_privilege(r.role, c.oid, x.privilege);
  IF v_open IS NOT NULL THEN RAISE EXCEPTION 'FAIL - tables are born closed: %', v_open; END IF;
  RAISE NOTICE 'ok - anon and authenticated have no table-level INSERT, UPDATE, DELETE or TRUNCATE';
END $$;

-- Column grants: the complete list of what the session may write. A step that grants a column
-- adds it here, so a grant nobody meant fails this test.
DO $$
DECLARE v_unexpected text; v_expected text[] := ARRAY['authenticated UPDATE notify.notifications.read_at',
    -- H2 (data-model.md §1, "U coluna"): the owner's profile and roles, an organisation's open columns.
    'authenticated UPDATE identity.profiles.full_name', 'authenticated UPDATE identity.profiles.phone',
    'authenticated UPDATE identity.profiles.avatar_path',
    'authenticated UPDATE identity.requester_profiles.nif', 'authenticated UPDATE identity.requester_profiles.address',
    'authenticated UPDATE identity.requester_profiles.city',
    'authenticated UPDATE identity.interpreter_profiles.bio', 'authenticated UPDATE identity.interpreter_profiles.years_experience',
    'authenticated UPDATE identity.interpreter_profiles.modality', 'authenticated UPDATE identity.interpreter_profiles.minimum_hourly_rate_aoa',
    'authenticated UPDATE identity.interpreter_profiles.accepts_negotiation', 'authenticated UPDATE identity.interpreter_profiles.travel_fee_aoa',
    'authenticated UPDATE identity.interpreter_profiles.city', 'authenticated UPDATE identity.interpreter_profiles.contact_phone',
    'authenticated UPDATE identity.interpreter_profiles.contact_whatsapp', 'authenticated UPDATE identity.interpreter_profiles.website_url',
    'authenticated UPDATE identity.interpreter_profiles.linkedin_url', 'authenticated UPDATE identity.interpreter_profiles.instagram_url',
    'authenticated UPDATE identity.interpreter_profiles.facebook_url',
    'authenticated UPDATE identity.organizations.name', 'authenticated UPDATE identity.organizations.sector',
    'authenticated UPDATE identity.organizations.address', 'authenticated UPDATE identity.organizations.city',
    'authenticated UPDATE identity.organizations.website_url', 'authenticated UPDATE identity.organizations.phone'];
BEGIN
  SELECT string_agg(entry, ', ') INTO v_unexpected FROM (
    SELECT format('%s %s %s.%s.%s', pg_get_userbyid(a.grantee), a.privilege_type, n.nspname, c.relname, att.attname) AS entry
      FROM pg_attribute AS att
      JOIN pg_class AS c ON c.oid = att.attrelid
      JOIN pg_namespace AS n ON n.oid = c.relnamespace
      CROSS JOIN LATERAL aclexplode(att.attacl) AS a
     WHERE n.nspname = ANY (util.project_schemas()) AND att.attacl IS NOT NULL
       AND a.privilege_type IN ('INSERT', 'UPDATE', 'REFERENCES')
       AND a.grantee IN (0, 'anon'::regrole, 'authenticated'::regrole)
  ) AS granted
  WHERE entry <> ALL (v_expected);
  IF v_unexpected IS NOT NULL THEN RAISE EXCEPTION 'FAIL - column grants are the expected list: %', v_unexpected; END IF;
  RAISE NOTICE 'ok - the only column the session writes is notify.notifications.read_at';
END $$;

DO $$
DECLARE v_unindexed text;
BEGIN
  SELECT string_agg(format('%s (%s)', con.conrelid::regclass, con.conname), ', ') INTO v_unindexed
    FROM pg_constraint AS con
    JOIN pg_namespace AS n ON n.oid = con.connamespace
   WHERE con.contype = 'f' AND n.nspname = ANY (util.project_schemas())
     AND NOT EXISTS (
       SELECT 1 FROM pg_index AS i
        WHERE i.indrelid = con.conrelid
          AND (i.indkey::int2[])[0:cardinality(con.conkey) - 1] = con.conkey);
  IF v_unindexed IS NOT NULL THEN RAISE EXCEPTION 'FAIL - every foreign key has an index: %', v_unindexed; END IF;
  RAISE NOTICE 'ok - every foreign key has an index that starts with its columns';
END $$;

DO $$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(s, ', ') INTO v_missing FROM unnest(util.project_schemas()) AS s
   WHERE NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = s);
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'FAIL - util.project_schemas() lists schemas that exist: %', v_missing; END IF;
  IF (SELECT count(*) FROM pg_extension WHERE extname IN ('pgcrypto', 'citext', 'btree_gist', 'pg_cron')) <> 4 THEN
    RAISE EXCEPTION 'FAIL - extensions: pgcrypto, citext, btree_gist and pg_cron are installed';
  END IF;
  RAISE NOTICE 'ok - the 14 project schemas and the four extensions exist';
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM util.applied_migrations
                  WHERE name = '0001-foundation.sql' AND sha256 ~ '^[0-9a-f]{64}$' AND NOT marked_only) THEN
    RAISE EXCEPTION 'FAIL - 0001-foundation.sql is recorded in util.applied_migrations with its sha256';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM notify.kinds WHERE code = 'org_invite' AND channels = ARRAY['email'])
     OR NOT EXISTS (SELECT 1 FROM notify.kinds WHERE code = 'chat_message' AND channels = ARRAY['portal', 'email']) THEN
    RAISE EXCEPTION 'FAIL - the notification catalog is loaded from the spec';
  END IF;
  RAISE NOTICE 'ok - the migration is recorded with its sha256 and the notification catalog is loaded';
END $$;

-- util ----------------------------------------------------------------------------------------------

DO $$
BEGIN
  IF util.now() <> now() THEN RAISE EXCEPTION 'FAIL - util.now() is now() when the clock is not frozen'; END IF;
  INSERT INTO util.test_clock (frozen_at) VALUES ('2026-03-01T10:00:00Z');
  IF util.now() <> '2026-03-01T10:00:00Z'::timestamptz THEN RAISE EXCEPTION 'FAIL - util.now() follows the test clock'; END IF;
  DELETE FROM util.test_clock;
  -- The old session setting no longer moves the clock (any role can set a dotted setting).
  PERFORM set_config('util.frozen_now', '2000-01-01T00:00:00Z', true);
  IF util.now() <> now() THEN RAISE EXCEPTION 'FAIL - a session setting cannot move util.now()'; END IF;
  IF util.app_timezone() <> 'Africa/Luanda' THEN RAISE EXCEPTION 'FAIL - util.app_timezone() is Africa/Luanda'; END IF;
  RAISE NOTICE 'ok - util.now() follows only util.test_clock; util.app_timezone() is Africa/Luanda';
END $$;

DO $$
DECLARE v_first text; v_second text; v_other text; v_new_year text;
BEGIN
  INSERT INTO util.test_clock (frozen_at) VALUES ('2026-06-01T12:00:00Z');
  v_first := util.next_code('PI');
  v_other := util.next_code('SUP');
  v_second := util.next_code('PI');
  -- 23:30 UTC on 31 December is already 00:30 on 1 January in Luanda.
  UPDATE util.test_clock SET frozen_at = '2026-12-31T23:30:00Z';
  v_new_year := util.next_code('PI');
  DELETE FROM util.test_clock;
  IF v_first <> 'PI-2026-000001' OR v_second <> 'PI-2026-000002' OR v_other <> 'SUP-2026-000001'
     OR v_new_year <> 'PI-2027-000001' THEN
    RAISE EXCEPTION 'FAIL - util.next_code counts per prefix and Luanda year: %, %, %, %', v_first, v_other, v_second, v_new_year;
  END IF;
  UPDATE util.code_sequences SET last_value = 999999 WHERE prefix = 'PI' AND year = 2027;
  INSERT INTO util.test_clock (frozen_at) VALUES ('2027-02-01T12:00:00Z');
  IF util.next_code('PI') <> 'PI-2027-1000000' THEN
    RAISE EXCEPTION 'FAIL - util.next_code grows past six digits instead of cutting the number';
  END IF;
  DELETE FROM util.test_clock;
  RAISE NOTICE 'ok - util.next_code counts per prefix and Luanda year, restarts in the new year and never truncates';
END $$;

DO $$
DECLARE v_ok int := 0;
BEGIN
  BEGIN PERFORM '923000000'::util.phone_e164; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM 'AO0612'::util.iban_ao; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM 'Bad Slug'::util.slug; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM 'ana@'::util.email; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM '//evil.example/x'::util.relative_link; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM '/\evil.example'::util.relative_link; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM 'https://evil.example'::util.relative_link; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  PERFORM '+244923000000'::util.phone_e164, '5417012345'::util.nif, 'AO06000000000000000000000'::util.iban_ao,
          'ana-silva-2'::util.slug, 'Ana@Example.ao'::util.email, '/requests/1'::util.relative_link, '/'::util.relative_link;
  IF v_ok <> 7 THEN RAISE EXCEPTION 'FAIL - util domains refuse malformed values (% of 7 refused)', v_ok; END IF;
  RAISE NOTICE 'ok - util domains accept well-formed values and refuse malformed ones, links leaving the site included';
END $$;

-- audit (R-AUD-01, R-AUD-02) ----------------------------------------------------------------------

DO $$
DECLARE v_id bigint;
BEGIN
  -- Even with the test clock frozen, the trail records the real time.
  INSERT INTO util.test_clock (frozen_at) VALUES ('2000-01-01T00:00:00Z');
  v_id := audit.record(NULL, 'system', 'test.recorded', 'test', 'x-1', NULL, '{"a": 1}', 'req-1', '10.0.0.1', NULL);
  DELETE FROM util.test_clock;
  IF NOT EXISTS (SELECT 1 FROM audit.events WHERE id = v_id AND occurred_at = now()
                   AND request_id = 'req-1' AND ip = '10.0.0.1' AND after = '{"a": 1}') THEN
    RAISE EXCEPTION 'FAIL - audit.record writes one row with the real time, request id and IP';
  END IF;
  RAISE NOTICE 'ok - audit.record writes the event with the real time (never the test clock), request id and IP';
END $$;

DO $$
DECLARE v_refused int := 0;
BEGIN
  BEGIN UPDATE audit.events SET note = 'changed'; EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'FORBIDDEN' THEN v_refused := v_refused + 1; END IF; END;
  BEGIN DELETE FROM audit.events; EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'FORBIDDEN' THEN v_refused := v_refused + 1; END IF; END;
  BEGIN TRUNCATE audit.events; EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'FORBIDDEN' THEN v_refused := v_refused + 1; END IF; END;
  IF v_refused <> 3 THEN RAISE EXCEPTION 'FAIL - audit.events refuses UPDATE, DELETE and TRUNCATE for the owner (% of 3)', v_refused; END IF;
  RAISE NOTICE 'ok - audit.events refuses UPDATE, DELETE and TRUNCATE even for the table owner';
END $$;

SET LOCAL ROLE service_role;
DO $$
DECLARE v_refused int := 0;
BEGIN
  BEGIN UPDATE audit.events SET note = 'changed'; EXCEPTION WHEN OTHERS THEN v_refused := v_refused + 1; END;
  BEGIN DELETE FROM audit.events; EXCEPTION WHEN OTHERS THEN v_refused := v_refused + 1; END;
  BEGIN INSERT INTO audit.events (actor_role, action, entity_type) VALUES ('system', 'forged', 'test');
    EXCEPTION WHEN OTHERS THEN v_refused := v_refused + 1; END;
  BEGIN INSERT INTO util.test_clock (frozen_at) VALUES ('2000-01-01'); EXCEPTION WHEN OTHERS THEN v_refused := v_refused + 1; END;
  IF v_refused <> 4 THEN RAISE EXCEPTION 'FAIL - service_role cannot write audit.events or the test clock directly (% of 4)', v_refused; END IF;
  RAISE NOTICE 'ok - service_role cannot UPDATE, DELETE or INSERT audit.events (only audit.record writes) nor move the clock';
END $$;
RESET ROLE;

-- notify (R-NOT-01, R-NOT-02, R-NOT-05) -----------------------------------------------------------

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-00000000000a', 'ana@example.ao'),
  ('00000000-0000-4000-8000-00000000000b', 'bruno@example.ao');
-- They accept the legal documents in force, if any are published (R-PRIV-02, from H2).
INSERT INTO identity.consents (account_id, legal_document_id)
SELECT p.id, d.id FROM identity.profiles AS p CROSS JOIN LATERAL auth_helper.pending_legal_documents(p.id) AS d
 WHERE p.id IN ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000b');

DO $$
DECLARE v_refused int := 0;
BEGIN
  BEGIN PERFORM notify.enqueue('not_in_catalog', '00000000-0000-4000-8000-00000000000a', '{}');
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'INTERNAL_ERROR' THEN v_refused := v_refused + 1; END IF; END;
  BEGIN INSERT INTO notify.notifications (account_id, kind) VALUES ('00000000-0000-4000-8000-00000000000a', 'not_in_catalog');
  EXCEPTION WHEN foreign_key_violation THEN v_refused := v_refused + 1; END;
  IF v_refused <> 2 THEN RAISE EXCEPTION 'FAIL - a kind outside the catalog is refused by enqueue and by the foreign key (% of 2)', v_refused; END IF;
  RAISE NOTICE 'ok - a kind outside the catalog is refused by notify.enqueue and by the foreign key (R-NOT-01)';
END $$;

DO $$
DECLARE v_portal uuid; v_both uuid; v_email_only uuid;
BEGIN
  v_portal := notify.enqueue('open_request_new', '00000000-0000-4000-8000-00000000000a', '{"link": "/requests/1"}');
  v_both := notify.enqueue('request_accepted', '00000000-0000-4000-8000-00000000000a', '{}');
  v_email_only := notify.enqueue('account_suspended', '00000000-0000-4000-8000-00000000000a', '{}');
  IF v_portal IS NULL OR v_both IS NULL OR v_email_only IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL - notify.enqueue returns the portal id, or NULL for an email-only kind';
  END IF;
  IF (SELECT link FROM notify.notifications WHERE id = v_portal) <> '/requests/1' THEN
    RAISE EXCEPTION 'FAIL - notify.enqueue keeps the payload link';
  END IF;
  IF (SELECT array_agg(template ORDER BY template) FROM notify.email_outbox
       WHERE account_id = '00000000-0000-4000-8000-00000000000a') <> ARRAY['account_suspended', 'request_accepted']
     OR EXISTS (SELECT 1 FROM notify.email_outbox WHERE template = 'open_request_new')
     OR (SELECT to_email FROM notify.email_outbox WHERE template = 'request_accepted') <> 'ana@example.ao' THEN
    RAISE EXCEPTION 'FAIL - notify.enqueue writes an email only for kinds with the email channel, to the account email';
  END IF;
  RAISE NOTICE 'ok - notify.enqueue follows the channels of the kind (portal, portal + email, email only)';
END $$;

DO $$
DECLARE v_refused int := 0;
BEGIN
  BEGIN PERFORM notify.enqueue('open_request_new', '00000000-0000-4000-8000-00000000000a', '{"link": "//evil.example"}');
  EXCEPTION WHEN check_violation THEN v_refused := v_refused + 1; END;
  IF v_refused <> 1 THEN RAISE EXCEPTION 'FAIL - notify.enqueue refuses a link that leaves the site'; END IF;
  RAISE NOTICE 'ok - notify.enqueue refuses a link that leaves the site';
END $$;

DO $$
DECLARE v_refused boolean := false; v_id uuid;
BEGIN
  BEGIN PERFORM notify.enqueue_email('open_request_new', 'someone@example.ao', '{}');
  EXCEPTION WHEN raise_exception THEN v_refused := SQLERRM = 'INTERNAL_ERROR'; END;
  v_id := notify.enqueue_email('org_invite', 'convidado@example.ao', '{"organization": "Academia"}');
  IF NOT v_refused OR NOT EXISTS (SELECT 1 FROM notify.email_outbox
                                   WHERE id = v_id AND account_id IS NULL AND status = 'queued') THEN
    RAISE EXCEPTION 'FAIL - notify.enqueue_email queues only kinds with the email channel';
  END IF;
  RAISE NOTICE 'ok - notify.enqueue_email queues an email without an account and refuses portal-only kinds';
END $$;

DO $$
BEGIN
  PERFORM notify.enqueue('request_declined', '00000000-0000-4000-8000-00000000000b', '{}');
  RAISE NOTICE 'ok - a second account has its own notification';
END $$;

-- R-NOT-02: only notify.enqueue writes; not even service_role writes the tables directly.
SET LOCAL ROLE service_role;
DO $$
DECLARE v_refused int := 0;
BEGIN
  BEGIN INSERT INTO notify.notifications (account_id, kind) VALUES ('00000000-0000-4000-8000-00000000000a', 'request_declined');
    EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN INSERT INTO notify.email_outbox (to_email, template) VALUES ('x@example.ao', 'org_invite');
    EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN UPDATE notify.notifications SET read_at = now(); EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  IF v_refused <> 3 THEN RAISE EXCEPTION 'FAIL - service_role writes notifications only through notify.enqueue (% of 3)', v_refused; END IF;
  RAISE NOTICE 'ok - service_role writes notifications and emails only through notify.enqueue (R-NOT-02)';
END $$;
RESET ROLE;

SET LOCAL ROLE anon;
DO $$
DECLARE v_refused int := 0;
BEGIN
  BEGIN PERFORM 1 FROM notify.notifications; EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN PERFORM auth_helper.account_id(); EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  IF v_refused <> 2 THEN RAISE EXCEPTION 'FAIL - anon reads no notification and runs no helper (% of 2)', v_refused; END IF;
  RAISE NOTICE 'ok - anon reads no notification and runs no auth_helper function';
END $$;
RESET ROLE;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claims',
    '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_count int; v_refused int := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM notify.notifications WHERE account_id <> '00000000-0000-4000-8000-00000000000a')
     OR NOT EXISTS (SELECT 1 FROM notify.notifications) THEN
    RAISE EXCEPTION 'FAIL - an account sees only its own notifications';
  END IF;
  UPDATE notify.notifications SET read_at = now() WHERE kind = 'open_request_new';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN RAISE EXCEPTION 'FAIL - the owner marks a notification read (% rows)', v_count; END IF;
  UPDATE notify.notifications SET read_at = now() WHERE account_id = '00000000-0000-4000-8000-00000000000b';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 0 THEN RAISE EXCEPTION 'FAIL - nobody marks another account''s notification read'; END IF;
  BEGIN UPDATE notify.notifications SET kind = 'request_declined'; EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN INSERT INTO notify.notifications (account_id, kind) VALUES ('00000000-0000-4000-8000-00000000000a', 'request_declined');
    EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN PERFORM 1 FROM notify.email_outbox; EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN PERFORM notify.enqueue('request_declined', '00000000-0000-4000-8000-00000000000a', '{}');
    EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  BEGIN INSERT INTO util.test_clock (frozen_at) VALUES ('2000-01-01'); EXCEPTION WHEN insufficient_privilege THEN v_refused := v_refused + 1; END;
  IF v_refused <> 5 THEN RAISE EXCEPTION 'FAIL - the session cannot change other columns, insert, read the outbox, enqueue or move the clock (% of 5)', v_refused; END IF;
  RAISE NOTICE 'ok - an account reads its notifications and marks them read, and nothing else (R-NOT-05)';
END $$;
RESET ROLE;
