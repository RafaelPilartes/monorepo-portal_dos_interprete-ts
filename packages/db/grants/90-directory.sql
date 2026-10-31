-- Grants of step H4 (api.md §16): reads by RLS, the owner's writes directly (column grants, no
-- status or removal columns), the removal by the API.
GRANT SELECT ON directory.interpreter_languages, directory.interpreter_specialties, directory.interpreter_services,
  directory.availability_rules, directory.availability_exceptions, directory.education, directory.experiences,
  directory.certifications, directory.media_items, directory.articles, directory.favorites TO authenticated;
GRANT SELECT ON directory.public_listing TO anon, authenticated;
GRANT SELECT ON directory.public_listing, directory.media_items, directory.articles,
  directory.favorites TO service_role;

GRANT INSERT (interpreter_id, language_id, level), UPDATE (level), DELETE ON directory.interpreter_languages TO authenticated;
GRANT INSERT (interpreter_id, specialty_id), DELETE ON directory.interpreter_specialties TO authenticated;
GRANT INSERT (interpreter_id, service_id, price_aoa, description, active), UPDATE (price_aoa, description, active), DELETE
  ON directory.interpreter_services TO authenticated;
GRANT INSERT (interpreter_id, weekday, start_time, end_time), UPDATE (weekday, start_time, end_time), DELETE
  ON directory.availability_rules TO authenticated;
GRANT INSERT (interpreter_id, day, note), UPDATE (note), DELETE ON directory.availability_exceptions TO authenticated;
GRANT INSERT (interpreter_id, institution, degree, field, start_year, end_year, is_current, certificate_url),
  UPDATE (institution, degree, field, start_year, end_year, is_current, certificate_url), DELETE
  ON directory.education TO authenticated;
GRANT INSERT (interpreter_id, role, organization, start_date, end_date, is_current, description),
  UPDATE (role, organization, start_date, end_date, is_current, description), DELETE
  ON directory.experiences TO authenticated;
GRANT INSERT (interpreter_id, name, issuer, issued_on, expires_on, credential_url),
  UPDATE (name, issuer, issued_on, expires_on, credential_url), DELETE
  ON directory.certifications TO authenticated;
GRANT INSERT (interpreter_id, kind, title, url, thumbnail_path, description, tags),
  UPDATE (kind, title, url, thumbnail_path, description, tags), DELETE ON directory.media_items TO authenticated;
GRANT INSERT (interpreter_id, slug, title, summary, body, cover_path, tags),
  UPDATE (title, summary, body, cover_path, tags), DELETE ON directory.articles TO authenticated;
GRANT INSERT (requester_account_id, interpreter_id), DELETE ON directory.favorites TO authenticated;

GRANT SELECT ON directory.my_profile_status TO authenticated;
GRANT SELECT ON directory.profile_status TO service_role;

-- The rule functions run for the API; the policies' helper is in auth_helper (authenticated).
GRANT EXECUTE ON FUNCTION directory.is_profile_complete(uuid), directory.profile_missing(uuid),
  directory.remove_content(uuid, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION auth_helper.can_read_interpreter(uuid) TO authenticated, service_role;
