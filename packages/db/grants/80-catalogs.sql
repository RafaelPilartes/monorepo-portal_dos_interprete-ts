-- Grants of step H3.
GRANT SELECT ON catalog.languages, catalog.specialties, catalog.services TO anon, authenticated, service_role;
GRANT SELECT ON catalog.language_admin, catalog.specialty_admin, catalog.service_admin TO authenticated;
GRANT EXECUTE ON FUNCTION
  catalog.save_language(uuid, uuid, text, text, boolean, boolean, integer),
  catalog.save_specialty(uuid, uuid, text, text, text, boolean, integer),
  catalog.save_service(uuid, uuid, text, text, text, text, bigint, text, boolean, integer),
  catalog.delete_item(uuid, text, uuid),
  catalog.usage_count(text, uuid)
  TO service_role;
