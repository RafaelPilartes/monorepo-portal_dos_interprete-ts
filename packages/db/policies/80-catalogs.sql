-- Policies of step H3 (data-model.md §2): active items for everyone, visitors included; all for
-- the team. Writes only through catalog.save_* (API). Visitors get their own policy: anon cannot
-- run auth_helper.
DROP POLICY IF EXISTS languages_select ON catalog.languages;
DROP POLICY IF EXISTS languages_select_active ON catalog.languages;
CREATE POLICY languages_select_active ON catalog.languages FOR SELECT TO anon, authenticated USING (active);
DROP POLICY IF EXISTS languages_select_staff ON catalog.languages;
CREATE POLICY languages_select_staff ON catalog.languages FOR SELECT TO authenticated USING ((SELECT auth_helper.is_staff()));

DROP POLICY IF EXISTS specialties_select ON catalog.specialties;
DROP POLICY IF EXISTS specialties_select_active ON catalog.specialties;
CREATE POLICY specialties_select_active ON catalog.specialties FOR SELECT TO anon, authenticated USING (active);
DROP POLICY IF EXISTS specialties_select_staff ON catalog.specialties;
CREATE POLICY specialties_select_staff ON catalog.specialties FOR SELECT TO authenticated USING ((SELECT auth_helper.is_staff()));

DROP POLICY IF EXISTS services_select ON catalog.services;
DROP POLICY IF EXISTS services_select_active ON catalog.services;
CREATE POLICY services_select_active ON catalog.services FOR SELECT TO anon, authenticated USING (active);
DROP POLICY IF EXISTS services_select_staff ON catalog.services;
CREATE POLICY services_select_staff ON catalog.services FOR SELECT TO authenticated USING ((SELECT auth_helper.is_staff()));
