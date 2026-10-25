-- auth_helper: what RLS policies and the API ask about a caller (data-model.md §0). STABLE,
-- SECURITY DEFINER, empty search_path. H2 adds the accepted-terms condition to account_id()
-- (R-PRIV-02) and the role helpers.

-- The caller's account when its profile is active, else NULL: RLS then denies everything
-- (R-ACC-03).
CREATE OR REPLACE FUNCTION auth_helper.account_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT p.id FROM identity.profiles AS p WHERE p.id = auth.uid() AND p.status = 'active'
$$;

CREATE OR REPLACE FUNCTION auth_helper.is_active() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$ SELECT auth_helper.account_id() IS NOT NULL $$;

-- The caller's active staff level, or NULL (R-STF-01).
CREATE OR REPLACE FUNCTION auth_helper.staff_level() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT s.level FROM identity.staff_members AS s
   WHERE s.account_id = auth_helper.account_id() AND s.active
$$;

-- The R-STF-01 matrix in policies: super_admin passes always; an empty list means any level.
CREATE OR REPLACE FUNCTION auth_helper.is_staff(levels text[] DEFAULT '{}') RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT caller.level = 'super_admin' OR cardinality(levels) = 0 OR caller.level = ANY (levels)
       FROM (SELECT auth_helper.staff_level() AS level) AS caller
      WHERE caller.level IS NOT NULL),
    false)
$$;

-- What the API's auth plugin asks about a caller (api.md §1). EXECUTE for service_role only.
-- 'unknown' for an account without a profile or anonymized (the token no longer opens anything).
CREATE OR REPLACE FUNCTION auth_helper.account_status(p_account uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT CASE p.status WHEN 'active' THEN 'active' WHEN 'suspended' THEN 'suspended' ELSE 'unknown' END
       FROM identity.profiles AS p WHERE p.id = p_account),
    'unknown')
$$;

-- The active staff level of an account, or NULL (R-STF-01).
CREATE OR REPLACE FUNCTION auth_helper.staff_level_of(p_account uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT s.level FROM identity.staff_members AS s
    JOIN identity.profiles AS p ON p.id = s.account_id AND p.status = 'active'
   WHERE s.account_id = p_account AND s.active
$$;
