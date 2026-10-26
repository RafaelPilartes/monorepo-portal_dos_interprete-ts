-- auth_helper: what RLS policies and the API ask about a caller (data-model.md §0). STABLE,
-- SECURITY DEFINER, empty search_path.

-- The legal documents an account still has to accept (R-PRIV-02): for each kind with a published
-- version, the latest one, when the account has no consent for it.
CREATE OR REPLACE FUNCTION auth_helper.pending_legal_documents(p_account uuid)
RETURNS TABLE (id uuid, kind text, version integer)
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT d.id, d.kind, d.version
    FROM (SELECT DISTINCT ON (l.kind) l.id, l.kind, l.version
            FROM identity.legal_documents AS l
           WHERE l.published_at IS NOT NULL
           ORDER BY l.kind, l.version DESC) AS d
   WHERE NOT EXISTS (SELECT 1 FROM identity.consents AS c
                      WHERE c.account_id = p_account AND c.legal_document_id = d.id)
   ORDER BY d.kind
$$;

-- The caller's account when its profile is active and the legal documents in force are accepted,
-- else NULL: RLS then denies everything, reads and writes (R-ACC-03, R-PRIV-02).
CREATE OR REPLACE FUNCTION auth_helper.account_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT p.id FROM identity.profiles AS p
   WHERE p.id = auth.uid() AND p.status = 'active'
     AND NOT EXISTS (SELECT 1 FROM auth_helper.pending_legal_documents(p.id))
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
-- 'unknown' for an account without a profile or anonymized (the token no longer opens anything);
-- 'terms_required' for an active account with legal documents to accept (R-PRIV-02).
CREATE OR REPLACE FUNCTION auth_helper.account_status(p_account uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT coalesce(
    (SELECT CASE p.status
              WHEN 'active' THEN CASE WHEN EXISTS (SELECT 1 FROM auth_helper.pending_legal_documents(p.id))
                                      THEN 'terms_required' ELSE 'active' END
              WHEN 'suspended' THEN 'suspended'
              ELSE 'unknown' END
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

-- Roles (R-ACC-02) ----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_helper.is_interpreter() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM identity.interpreter_profiles AS i WHERE i.account_id = auth_helper.account_id())
$$;

-- A requester: an individual requester profile, or active membership of an organisation.
CREATE OR REPLACE FUNCTION auth_helper.is_requester() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM identity.requester_profiles AS r WHERE r.account_id = auth_helper.account_id())
      OR EXISTS (SELECT 1 FROM identity.organization_members AS m
                  WHERE m.account_id = auth_helper.account_id() AND m.status = 'active')
$$;

-- The caller's active role in an organisation, or NULL (R-ORG-05).
CREATE OR REPLACE FUNCTION auth_helper.org_role(p_org uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT m.role FROM identity.organization_members AS m
   WHERE m.organization_id = p_org AND m.account_id = auth_helper.account_id() AND m.status = 'active'
$$;

-- The organisations where the caller is an active member.
CREATE OR REPLACE FUNCTION auth_helper.my_org_ids() RETURNS SETOF uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT m.organization_id FROM identity.organization_members AS m
   WHERE m.account_id = auth_helper.account_id() AND m.status = 'active'
$$;
