-- auth_helper: what RLS policies ask about the caller (data-model.md §0). STABLE, SECURITY
-- DEFINER, empty search_path. Only the helpers that make sense before the identity tables exist;
-- step H1 rewrites account_id() to also require an active profile and accepted legal documents
-- (R-ACC-03, R-PRIV-02) and adds the role and staff helpers.

CREATE OR REPLACE FUNCTION auth_helper.account_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT auth.uid() $$;

CREATE OR REPLACE FUNCTION auth_helper.is_active() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT auth_helper.account_id() IS NOT NULL $$;
