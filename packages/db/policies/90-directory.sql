-- Policies of step H4 (data-model.md §3, R-DIR-04). The profile and its parts: the owner and the
-- team always; any active account when the interpreter is listed (auth_helper.can_read_interpreter).
-- The owner writes its own rows; content status changes only through directory.remove_content.

-- interpreter_profiles: replaces the H2 policy (any active account read every profile).
DROP POLICY IF EXISTS interpreter_profiles_select ON identity.interpreter_profiles;
CREATE POLICY interpreter_profiles_select ON identity.interpreter_profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(account_id)));


DROP POLICY IF EXISTS interpreter_languages_select ON directory.interpreter_languages;
CREATE POLICY interpreter_languages_select ON directory.interpreter_languages FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS interpreter_languages_write_own ON directory.interpreter_languages;
CREATE POLICY interpreter_languages_write_own ON directory.interpreter_languages FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS interpreter_specialties_select ON directory.interpreter_specialties;
CREATE POLICY interpreter_specialties_select ON directory.interpreter_specialties FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS interpreter_specialties_write_own ON directory.interpreter_specialties;
CREATE POLICY interpreter_specialties_write_own ON directory.interpreter_specialties FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS interpreter_services_select ON directory.interpreter_services;
CREATE POLICY interpreter_services_select ON directory.interpreter_services FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS interpreter_services_write_own ON directory.interpreter_services;
CREATE POLICY interpreter_services_write_own ON directory.interpreter_services FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS availability_rules_select ON directory.availability_rules;
CREATE POLICY availability_rules_select ON directory.availability_rules FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS availability_rules_write_own ON directory.availability_rules;
CREATE POLICY availability_rules_write_own ON directory.availability_rules FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS availability_exceptions_select ON directory.availability_exceptions;
CREATE POLICY availability_exceptions_select ON directory.availability_exceptions FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS availability_exceptions_write_own ON directory.availability_exceptions;
CREATE POLICY availability_exceptions_write_own ON directory.availability_exceptions FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS education_select ON directory.education;
CREATE POLICY education_select ON directory.education FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS education_write_own ON directory.education;
CREATE POLICY education_write_own ON directory.education FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS experiences_select ON directory.experiences;
CREATE POLICY experiences_select ON directory.experiences FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS experiences_write_own ON directory.experiences;
CREATE POLICY experiences_write_own ON directory.experiences FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

DROP POLICY IF EXISTS certifications_select ON directory.certifications;
CREATE POLICY certifications_select ON directory.certifications FOR SELECT TO authenticated
  USING ((SELECT auth_helper.can_read_interpreter(interpreter_id)));
DROP POLICY IF EXISTS certifications_write_own ON directory.certifications;
CREATE POLICY certifications_write_own ON directory.certifications FOR ALL TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()))
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()));

-- media_items: a removed item only for its author and the team (R-DIR-07); the author edits only what is
-- published and never brings a removed item back.
DROP POLICY IF EXISTS media_items_select ON directory.media_items;
CREATE POLICY media_items_select ON directory.media_items FOR SELECT TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()) OR (SELECT auth_helper.is_staff())
         OR (status = 'published' AND (SELECT auth_helper.can_read_interpreter(interpreter_id))));
DROP POLICY IF EXISTS media_items_insert_own ON directory.media_items;
CREATE POLICY media_items_insert_own ON directory.media_items FOR INSERT TO authenticated
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published');
DROP POLICY IF EXISTS media_items_update_own ON directory.media_items;
CREATE POLICY media_items_update_own ON directory.media_items FOR UPDATE TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published')
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published');
DROP POLICY IF EXISTS media_items_delete_own ON directory.media_items;
CREATE POLICY media_items_delete_own ON directory.media_items FOR DELETE TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published');

-- articles: a removed item only for its author and the team (R-DIR-07); the author edits only what is
-- published and never brings a removed item back.
DROP POLICY IF EXISTS articles_select ON directory.articles;
CREATE POLICY articles_select ON directory.articles FOR SELECT TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()) OR (SELECT auth_helper.is_staff())
         OR (status = 'published' AND (SELECT auth_helper.can_read_interpreter(interpreter_id))));
DROP POLICY IF EXISTS articles_insert_own ON directory.articles;
CREATE POLICY articles_insert_own ON directory.articles FOR INSERT TO authenticated
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published');
DROP POLICY IF EXISTS articles_update_own ON directory.articles;
CREATE POLICY articles_update_own ON directory.articles FOR UPDATE TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published')
  WITH CHECK (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published');
DROP POLICY IF EXISTS articles_delete_own ON directory.articles;
CREATE POLICY articles_delete_own ON directory.articles FOR DELETE TO authenticated
  USING (interpreter_id = (SELECT auth_helper.account_id()) AND status = 'published');

-- favorites (R-DIR-10): only the requester who marks them.
DROP POLICY IF EXISTS favorites_own ON directory.favorites;
CREATE POLICY favorites_own ON directory.favorites FOR ALL TO authenticated
  USING (requester_account_id = (SELECT auth_helper.account_id()))
  WITH CHECK (requester_account_id = (SELECT auth_helper.account_id()) AND (SELECT auth_helper.is_requester()));

-- Storage: the photo (avatars) and the article covers (interpreter-media) under a folder named by
-- the account; anyone reads (public buckets), only the owner writes.
DROP POLICY IF EXISTS avatars_write_own ON storage.objects;
CREATE POLICY avatars_write_own ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('avatars', 'interpreter-media') AND (storage.foldername(name))[1] = (SELECT auth_helper.account_id())::text)
  WITH CHECK (bucket_id IN ('avatars', 'interpreter-media') AND (storage.foldername(name))[1] = (SELECT auth_helper.account_id())::text);
