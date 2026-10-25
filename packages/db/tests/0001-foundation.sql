-- Named assertions for the foundation (foundation.md §F item 4). Run by scripts/run-tests.sh
-- inside a transaction that is rolled back. Each block prints "ok - <name>" or fails naming it.

-- Structure ---------------------------------------------------------------------------------------

DO $$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ') INTO v_missing
    FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace
   WHERE c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
     AND n.nspname IN ('identity', 'catalog', 'directory', 'config', 'booking', 'billing', 'verification',
                       'community', 'support', 'notify', 'audit', 'analytics', 'util', 'auth_helper');
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'FAIL - every table has RLS: %', v_missing; END IF;
  RAISE NOTICE 'ok - every table in the project schemas has RLS enabled';
END $$;

DO $$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(p.oid::regprocedure::text, ', ') INTO v_missing
    FROM pg_proc AS p JOIN pg_namespace AS n ON n.oid = p.pronamespace
   WHERE p.prosecdef
     AND n.nspname IN ('identity', 'catalog', 'directory', 'config', 'booking', 'billing', 'verification',
                       'community', 'support', 'notify', 'audit', 'analytics', 'util', 'auth_helper')
     AND NOT coalesce('search_path=""' = ANY (p.proconfig), false);
  IF v_missing IS NOT NULL THEN RAISE EXCEPTION 'FAIL - SECURITY DEFINER pins search_path: %', v_missing; END IF;
  RAISE NOTICE 'ok - every SECURITY DEFINER function has search_path = ''''';
END $$;

DO $$
DECLARE v_open text;
BEGIN
  SELECT string_agg(format('%s to %s', p.oid::regprocedure, r.role), ', ') INTO v_open
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    CROSS JOIN (VALUES ('public'), ('anon'), ('authenticated')) AS r (role)
   WHERE n.nspname IN ('identity', 'catalog', 'directory', 'config', 'booking', 'billing', 'verification',
                       'community', 'support', 'notify', 'audit', 'analytics', 'util', 'auth_helper')
     AND p.prokind = 'f'
     AND CASE r.role
           WHEN 'public' THEN coalesce(aclcontains(p.proacl, makeaclitem(0, p.proowner, 'EXECUTE', false)), true)
           ELSE has_function_privilege(r.role, p.oid, 'EXECUTE')
         END
     AND NOT (r.role = 'authenticated' AND n.nspname = 'auth_helper');
  IF v_open IS NOT NULL THEN RAISE EXCEPTION 'FAIL - functions are closed by default: %', v_open; END IF;
  RAISE NOTICE 'ok - no function runs for PUBLIC or anon; authenticated runs only auth_helper';
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
     AND n.nspname IN ('identity', 'catalog', 'directory', 'config', 'booking', 'billing', 'verification',
                       'community', 'support', 'notify', 'audit', 'analytics', 'util', 'auth_helper')
     AND has_table_privilege(r.role, c.oid, x.privilege);
  IF v_open IS NOT NULL THEN RAISE EXCEPTION 'FAIL - tables are born closed: %', v_open; END IF;
  RAISE NOTICE 'ok - anon and authenticated have no table-level INSERT, UPDATE, DELETE or TRUNCATE';
END $$;

DO $$
DECLARE v_unindexed text;
BEGIN
  SELECT string_agg(format('%s (%s)', con.conrelid::regclass, con.conname), ', ') INTO v_unindexed
    FROM pg_constraint AS con
    JOIN pg_namespace AS n ON n.oid = con.connamespace
   WHERE con.contype = 'f'
     AND n.nspname IN ('identity', 'catalog', 'directory', 'config', 'booking', 'billing', 'verification',
                       'community', 'support', 'notify', 'audit', 'analytics', 'util', 'auth_helper')
     AND NOT EXISTS (
       SELECT 1 FROM pg_index AS i
        WHERE i.indrelid = con.conrelid
          AND (i.indkey::int2[])[0:cardinality(con.conkey) - 1] = con.conkey);
  IF v_unindexed IS NOT NULL THEN RAISE EXCEPTION 'FAIL - every foreign key has an index: %', v_unindexed; END IF;
  RAISE NOTICE 'ok - every foreign key has an index that starts with its columns';
END $$;

DO $$
BEGIN
  IF (SELECT count(*) FROM pg_extension WHERE extname IN ('pgcrypto', 'citext', 'btree_gist', 'pg_cron')) <> 4 THEN
    RAISE EXCEPTION 'FAIL - extensions: pgcrypto, citext, btree_gist and pg_cron are installed';
  END IF;
  RAISE NOTICE 'ok - pgcrypto, citext, btree_gist and pg_cron are installed';
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM util.applied_migrations
                  WHERE name = '0001-foundation.sql' AND sha256 ~ '^[0-9a-f]{64}$' AND NOT marked_only) THEN
    RAISE EXCEPTION 'FAIL - 0001-foundation.sql is recorded in util.applied_migrations with its sha256';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM util.applied_migrations WHERE name = 'seed/0001-notify-kinds.sql')
     OR NOT EXISTS (SELECT 1 FROM notify.kinds WHERE code = 'org_invite' AND channels = ARRAY['email']) THEN
    RAISE EXCEPTION 'FAIL - the notification catalog seed is applied and recorded';
  END IF;
  RAISE NOTICE 'ok - migration and seed are recorded with their sha256';
END $$;

-- util ----------------------------------------------------------------------------------------------

DO $$
BEGIN
  PERFORM set_config('util.frozen_now', '2026-03-01T10:00:00Z', true);
  IF util.now() <> '2026-03-01T10:00:00Z'::timestamptz THEN RAISE EXCEPTION 'FAIL - util.now() follows a frozen clock'; END IF;
  PERFORM set_config('util.frozen_now', '', true);
  IF util.now() <> now() THEN RAISE EXCEPTION 'FAIL - util.now() is now() when the clock is not frozen'; END IF;
  IF util.app_timezone() <> 'Africa/Luanda' THEN RAISE EXCEPTION 'FAIL - util.app_timezone() is Africa/Luanda'; END IF;
  RAISE NOTICE 'ok - util.now() can be frozen by tests and util.app_timezone() is Africa/Luanda';
END $$;

DO $$
DECLARE v_first text; v_second text; v_new_year text;
BEGIN
  PERFORM set_config('util.frozen_now', '2026-06-01T12:00:00Z', true);
  v_first := util.next_code('PI');
  v_second := util.next_code('PI');
  -- 23:30 UTC on 31 December is already 00:30 on 1 January in Luanda.
  PERFORM set_config('util.frozen_now', '2026-12-31T23:30:00Z', true);
  v_new_year := util.next_code('PI');
  IF v_first <> 'PI-2026-000001' OR v_second <> 'PI-2026-000002' OR v_new_year <> 'PI-2027-000001' THEN
    RAISE EXCEPTION 'FAIL - util.next_code counts per prefix and Luanda year: %, %, %', v_first, v_second, v_new_year;
  END IF;
  UPDATE util.code_sequences SET last_value = 999999 WHERE prefix = 'PI' AND year = 2027;
  IF util.next_code('PI') <> 'PI-2027-1000000' THEN
    RAISE EXCEPTION 'FAIL - util.next_code grows past six digits instead of cutting the number';
  END IF;
  RAISE NOTICE 'ok - util.next_code gives PI-2026-000001, PI-2026-000002, restarts in the Luanda new year and never truncates';
END $$;

DO $$
DECLARE v_ok int := 0;
BEGIN
  BEGIN PERFORM '923000000'::util.phone_e164; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM 'AO0612'::util.iban_ao; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  BEGIN PERFORM 'Bad Slug'::util.slug; EXCEPTION WHEN check_violation THEN v_ok := v_ok + 1; END;
  PERFORM '+244923000000'::util.phone_e164, '5417012345'::util.nif,
          'AO06000000000000000000000'::util.iban_ao, 'ana-silva-2'::util.slug;
  IF v_ok <> 3 THEN RAISE EXCEPTION 'FAIL - util domains refuse malformed values (% of 3 refused)', v_ok; END IF;
  RAISE NOTICE 'ok - util domains accept well-formed values and refuse malformed ones';
END $$;

-- audit (R-AUD-01, R-AUD-02) ----------------------------------------------------------------------

DO $$
DECLARE v_id bigint;
BEGIN
  PERFORM set_config('util.frozen_now', '2026-05-05T08:00:00Z', true);
  v_id := audit.record(NULL, 'system', 'test.recorded', 'test', 'x-1', NULL, '{"a": 1}', 'req-1', '10.0.0.1', NULL);
  IF NOT EXISTS (SELECT 1 FROM audit.events WHERE id = v_id AND occurred_at = '2026-05-05T08:00:00Z'
                   AND request_id = 'req-1' AND ip = '10.0.0.1' AND after = '{"a": 1}') THEN
    RAISE EXCEPTION 'FAIL - audit.record writes one row with util.now(), request id and IP';
  END IF;
  PERFORM set_config('util.frozen_now', '', true);
  RAISE NOTICE 'ok - audit.record writes the event with the frozen clock, request id and IP';
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
  IF v_refused <> 3 THEN RAISE EXCEPTION 'FAIL - service_role cannot UPDATE, DELETE or INSERT audit.events directly (% of 3)', v_refused; END IF;
  RAISE NOTICE 'ok - service_role cannot UPDATE, DELETE or INSERT audit.events (only audit.record writes)';
END $$;
RESET ROLE;

-- notify (R-NOT-01, R-NOT-02, R-NOT-05) -----------------------------------------------------------

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-00000000000a', 'ana@example.ao'),
  ('00000000-0000-4000-8000-00000000000b', 'bruno@example.ao');

DO $$
DECLARE v_refused boolean := false;
BEGIN
  BEGIN PERFORM notify.enqueue('not_in_catalog', '00000000-0000-4000-8000-00000000000a', '{}');
  EXCEPTION WHEN raise_exception THEN v_refused := SQLERRM = 'INTERNAL_ERROR'; END;
  IF NOT v_refused THEN RAISE EXCEPTION 'FAIL - notify.enqueue refuses a kind outside the catalog'; END IF;
  RAISE NOTICE 'ok - notify.enqueue refuses a kind outside the catalog';
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
  IF v_refused <> 4 THEN RAISE EXCEPTION 'FAIL - the session cannot change other columns, insert, read the outbox or enqueue (% of 4)', v_refused; END IF;
  RAISE NOTICE 'ok - an account reads its notifications and marks them read, and nothing else (R-NOT-05)';
END $$;
RESET ROLE;
