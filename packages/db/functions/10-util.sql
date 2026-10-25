-- util functions (data-model.md §0, §12). Reapplicable: CREATE OR REPLACE only.

-- The one place the presentation and day-boundary time zone is written (data-model.md §0).
CREATE OR REPLACE FUNCTION util.app_timezone() RETURNS text
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$ SELECT 'Africa/Luanda'::text $$;

-- The only source of "now" in rule functions, so tests can freeze the clock
-- (claude-code-rules.md §5) by inserting a row into util.test_clock inside their transaction.
-- SECURITY DEFINER because nobody but the owner may read or write that table.
CREATE OR REPLACE FUNCTION util.now() RETURNS timestamptz
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT coalesce((SELECT c.frozen_at FROM util.test_clock AS c), pg_catalog.now())
$$;

-- The schemas the project owns (architecture.md §5), for the grants reset and the assertions.
-- scripts/verify.py (schema-lists) checks this list against the migrations, lib.sh and config.toml.
CREATE OR REPLACE FUNCTION util.project_schemas() RETURNS text[]
  LANGUAGE sql IMMUTABLE
  SET search_path = ''
AS $$
  SELECT ARRAY['identity', 'catalog', 'directory', 'config', 'booking', 'billing', 'verification',
               'community', 'support', 'notify', 'audit', 'analytics', 'util', 'auth_helper']
$$;

-- Readable codes such as PI-2026-000123: one counter per prefix and Luanda year (data-model.md §0).
-- Six digits at least; the number grows past six digits instead of being cut.
CREATE OR REPLACE FUNCTION util.next_code(p_prefix text) RETURNS text
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_year integer := extract(year FROM util.now() AT TIME ZONE util.app_timezone())::integer;
  v_value bigint;
BEGIN
  INSERT INTO util.code_sequences AS s (prefix, year, last_value)
  VALUES (p_prefix, v_year, 1)
  ON CONFLICT (prefix, year) DO UPDATE SET last_value = s.last_value + 1
  RETURNING s.last_value INTO v_value;
  RETURN format('%s-%s-%s', p_prefix, v_year, lpad(v_value::text, greatest(6, length(v_value::text)), '0'));
END;
$$;
