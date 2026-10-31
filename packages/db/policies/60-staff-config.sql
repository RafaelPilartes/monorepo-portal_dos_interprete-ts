-- Policies of step H1 (data-model.md §1, §4, §11). Reapplicable: drop, then create.

-- profiles: the owner and the team read (H2 adds the public view of names and avatars).
DROP POLICY IF EXISTS profiles_select_own_or_staff ON identity.profiles;
CREATE POLICY profiles_select_own_or_staff ON identity.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth_helper.account_id()) OR (SELECT auth_helper.is_staff()));

-- staff_members: the team reads the team.
DROP POLICY IF EXISTS staff_members_select_staff ON identity.staff_members;
CREATE POLICY staff_members_select_staff ON identity.staff_members
  FOR SELECT TO authenticated
  USING ((SELECT auth_helper.is_staff()));

-- legal_documents: published versions for everyone (sign-up shows them); drafts for super_admin.
DROP POLICY IF EXISTS legal_documents_select_published ON identity.legal_documents;
CREATE POLICY legal_documents_select_published ON identity.legal_documents
  FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL);
DROP POLICY IF EXISTS legal_documents_select_drafts ON identity.legal_documents;
CREATE POLICY legal_documents_select_drafts ON identity.legal_documents
  FOR SELECT TO authenticated
  USING ((SELECT auth_helper.is_staff(ARRAY['super_admin'])));

-- platform_versions: the version in force for everyone (the site shows deadlines); drafts and the
-- history for super_admin, who alone manages the configuration (R-STF-01).
DROP POLICY IF EXISTS platform_versions_select_published ON config.platform_versions;
CREATE POLICY platform_versions_select_published ON config.platform_versions
  FOR SELECT TO anon, authenticated
  USING (status = 'published');
DROP POLICY IF EXISTS platform_versions_select_staff ON config.platform_versions;
CREATE POLICY platform_versions_select_staff ON config.platform_versions
  FOR SELECT TO authenticated
  USING ((SELECT auth_helper.is_staff(ARRAY['super_admin'])));

-- verification_document_types: active types for any active account (interpreters see what to
-- send); all of them for the team.
DROP POLICY IF EXISTS document_types_select ON config.verification_document_types;
CREATE POLICY document_types_select ON config.verification_document_types
  FOR SELECT TO authenticated
  USING ((active AND (SELECT auth_helper.is_active())) OR (SELECT auth_helper.is_staff()));

-- audit.events: each level sees its areas (R-AUD-03).
DROP POLICY IF EXISTS events_select_by_area ON audit.events;
CREATE POLICY events_select_by_area ON audit.events
  FOR SELECT TO authenticated
  USING (auth_helper.sees_audit_entry(entity_type));
