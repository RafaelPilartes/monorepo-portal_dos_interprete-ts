-- SECURITY DEFINER in a comment does not count
CREATE OR REPLACE FUNCTION util.ok() RETURNS int
  LANGUAGE sql SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT 1 $$;

CREATE FUNCTION util.invoker() RETURNS int LANGUAGE sql AS $$ SELECT 'SECURITY DEFINER'::text $$;

CREATE FUNCTION util.after() RETURNS int AS $$ SELECT 1 $$ LANGUAGE sql SECURITY DEFINER SET search_path TO '';
