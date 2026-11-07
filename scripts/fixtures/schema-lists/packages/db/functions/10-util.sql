CREATE OR REPLACE FUNCTION util.project_schemas() RETURNS text[]
  LANGUAGE sql IMMUTABLE
AS $$
  SELECT ARRAY['notify']
$$;
