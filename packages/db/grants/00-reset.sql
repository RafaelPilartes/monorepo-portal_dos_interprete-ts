-- Grants start from nothing on every run (architecture.md §5, "nasce fechado"): every privilege on
-- the project's tables, columns, sequences and routines is revoked from every role that is not
-- the object's owner (PUBLIC, anon, authenticated, service_role and any other), and the next files
-- grant back only what is used, so grants/ is the complete list. The whole grants phase runs in
-- one transaction (apply.sh), so no session sees the moment in between. Reapplicable.
DO $$
DECLARE
  r record;
  v_grantee text;
  v_column text;
BEGIN
  -- Tables, views, sequences: table-level and column-level grants.
  FOR r IN
    SELECT c.oid, c.oid::regclass AS rel, c.relkind, c.relowner
      FROM pg_catalog.pg_class AS c
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
     WHERE n.nspname = ANY (util.project_schemas()) AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
  LOOP
    FOR v_grantee IN
      SELECT DISTINCT CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_catalog.pg_get_userbyid(a.grantee)) END
        FROM pg_catalog.pg_class AS c, LATERAL pg_catalog.aclexplode(c.relacl) AS a
       WHERE c.oid = r.oid AND a.grantee <> r.relowner
      UNION
      SELECT unnest(ARRAY['PUBLIC', 'anon', 'authenticated', 'service_role'])
    LOOP
      EXECUTE format('REVOKE ALL ON %s FROM %s', r.rel, v_grantee);
    END LOOP;
    FOR v_grantee, v_column IN
      SELECT DISTINCT CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_catalog.pg_get_userbyid(a.grantee)) END,
             quote_ident(att.attname)
        FROM pg_catalog.pg_attribute AS att, LATERAL pg_catalog.aclexplode(att.attacl) AS a
       WHERE att.attrelid = r.oid AND att.attnum > 0 AND NOT att.attisdropped AND att.attacl IS NOT NULL
         AND a.grantee <> r.relowner
    LOOP
      EXECUTE format('REVOKE ALL (%s) ON %s FROM %s', v_column, r.rel, v_grantee);
    END LOOP;
  END LOOP;

  -- Functions, procedures, aggregates and window functions.
  FOR r IN
    SELECT p.oid, p.oid::regprocedure AS fn, p.prokind, p.proowner
      FROM pg_catalog.pg_proc AS p
      JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
     WHERE n.nspname = ANY (util.project_schemas())
  LOOP
    FOR v_grantee IN
      SELECT DISTINCT CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_catalog.pg_get_userbyid(a.grantee)) END
        FROM pg_catalog.pg_proc AS p, LATERAL pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) AS a
       WHERE p.oid = r.oid AND a.grantee <> r.proowner
      UNION
      SELECT unnest(ARRAY['PUBLIC', 'anon', 'authenticated', 'service_role'])
    LOOP
      EXECUTE format('REVOKE ALL ON %s %s FROM %s',
        CASE r.prokind WHEN 'p' THEN 'PROCEDURE' ELSE 'FUNCTION' END, r.fn, v_grantee);
    END LOOP;
  END LOOP;
END;
$$;
