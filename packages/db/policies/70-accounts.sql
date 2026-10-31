-- Policies of step H2 (data-model.md §1). Reapplicable: drop, then create.

-- profiles: the owner edits name, phone and photo (column grants in grants/70-accounts.sql).
DROP POLICY IF EXISTS profiles_update_own ON identity.profiles;
CREATE POLICY profiles_update_own ON identity.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth_helper.account_id()))
  WITH CHECK (id = (SELECT auth_helper.account_id()));

-- requester_profiles: the owner and the team (H5 adds the interpreters accepted in a request).
DROP POLICY IF EXISTS requester_profiles_select ON identity.requester_profiles;
CREATE POLICY requester_profiles_select ON identity.requester_profiles
  FOR SELECT TO authenticated
  USING (account_id = (SELECT auth_helper.account_id()) OR (SELECT auth_helper.is_staff()));
DROP POLICY IF EXISTS requester_profiles_update_own ON identity.requester_profiles;
CREATE POLICY requester_profiles_update_own ON identity.requester_profiles
  FOR UPDATE TO authenticated
  USING (account_id = (SELECT auth_helper.account_id()))
  WITH CHECK (account_id = (SELECT auth_helper.account_id()));

-- interpreter_profiles: any active account reads (D-05, D-51); the owner edits.
DROP POLICY IF EXISTS interpreter_profiles_select ON identity.interpreter_profiles;
CREATE POLICY interpreter_profiles_select ON identity.interpreter_profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth_helper.is_active()));
DROP POLICY IF EXISTS interpreter_profiles_update_own ON identity.interpreter_profiles;
CREATE POLICY interpreter_profiles_update_own ON identity.interpreter_profiles
  FOR UPDATE TO authenticated
  USING (account_id = (SELECT auth_helper.account_id()))
  WITH CHECK (account_id = (SELECT auth_helper.account_id()));

-- organizations: active members and the team read; owner and admin edit the open columns.
DROP POLICY IF EXISTS organizations_select ON identity.organizations;
CREATE POLICY organizations_select ON identity.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT auth_helper.my_org_ids()) OR (SELECT auth_helper.is_staff()));
DROP POLICY IF EXISTS organizations_update_admins ON identity.organizations;
CREATE POLICY organizations_update_admins ON identity.organizations
  FOR UPDATE TO authenticated
  USING (auth_helper.org_role(id) IN ('owner', 'admin') AND status <> 'anonymized')
  WITH CHECK (auth_helper.org_role(id) IN ('owner', 'admin'));

-- organization_members: the members of the same organisation and the team.
DROP POLICY IF EXISTS organization_members_select ON identity.organization_members;
CREATE POLICY organization_members_select ON identity.organization_members
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT auth_helper.my_org_ids()) OR (SELECT auth_helper.is_staff()));

-- organization_invites: owner and admin of the organisation, and the team (never the token hash:
-- column grants).
DROP POLICY IF EXISTS organization_invites_select ON identity.organization_invites;
CREATE POLICY organization_invites_select ON identity.organization_invites
  FOR SELECT TO authenticated
  USING (auth_helper.org_role(organization_id) IN ('owner', 'admin') OR (SELECT auth_helper.is_staff()));

-- consents: the owner and the team.
DROP POLICY IF EXISTS consents_select ON identity.consents;
CREATE POLICY consents_select ON identity.consents
  FOR SELECT TO authenticated
  USING (account_id = (SELECT auth_helper.account_id()) OR (SELECT auth_helper.is_staff()));
