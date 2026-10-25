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

-- What the API's auth plugin asks about a caller (api.md §1). EXECUTE for service_role only.
-- Until the identity tables exist (H1) an account is 'active' when it exists in auth.users;
-- H1 adds 'suspended' (R-ACC-02) and 'terms_required' (R-PRIV-02).
CREATE OR REPLACE FUNCTION auth_helper.account_status(p_account uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT CASE WHEN EXISTS (SELECT 1 FROM auth.users AS u WHERE u.id = p_account) THEN 'active' ELSE 'unknown' END
$$;

-- The active staff level of an account, or NULL (R-STF-01). NULL for everyone until H1 creates
-- identity.staff_members.
CREATE OR REPLACE FUNCTION auth_helper.staff_level_of(p_account uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT NULL::text WHERE p_account IS NOT NULL $$;
