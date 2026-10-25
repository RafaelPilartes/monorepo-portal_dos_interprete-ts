-- Grants start from nothing on every run (architecture.md §5, "nasce fechado"): every privilege of
-- PUBLIC, anon, authenticated and service_role on the project's tables, columns, sequences and
-- functions is revoked, and the next files grant back only what is used. Reapplicable.
DO $$
DECLARE
  v_schemas text[] := ARRAY['identity', 'catalog', 'directory', 'config', 'booking', 'billing',
    'verification', 'community', 'support', 'notify', 'audit', 'analytics', 'util', 'auth_helper'];
  r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS rel, c.relkind,
           (SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum)
              FROM pg_catalog.pg_attribute AS a
             WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) AS columns
      FROM pg_catalog.pg_class AS c
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
     WHERE n.nspname = ANY (v_schemas) AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
  LOOP
    EXECUTE format('REVOKE ALL ON %s FROM PUBLIC, anon, authenticated, service_role', r.rel);
    IF r.relkind <> 'S' AND r.columns IS NOT NULL THEN
      EXECUTE format('REVOKE ALL (%s) ON %s FROM PUBLIC, anon, authenticated, service_role', r.columns, r.rel);
    END IF;
  END LOOP;

  FOR r IN
    SELECT p.oid::regprocedure AS fn
      FROM pg_catalog.pg_proc AS p
      JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
     WHERE n.nspname = ANY (v_schemas) AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', r.fn);
  END LOOP;
END;
$$;
