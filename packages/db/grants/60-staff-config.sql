-- Grants of step H1. Reads by RLS (api.md §16); every write through a function called by the API.

GRANT SELECT ON identity.profiles, identity.staff_members, identity.legal_documents,
  config.platform_versions, config.verification_document_types,
  audit.events_for_staff, identity.staff_directory TO authenticated;
-- The audit through the view's columns only: never the IP (staff-and-config.md, /audit).
GRANT SELECT (id, occurred_at, actor_account, actor_role, action, entity_type, entity_id, before, after, request_id, note)
  ON audit.events TO authenticated;
GRANT SELECT ON identity.legal_documents, config.platform_versions TO anon;
GRANT SELECT ON identity.profiles, identity.staff_members, identity.legal_documents,
  config.platform_versions, config.verification_document_types, audit.events_for_staff TO service_role;

GRANT EXECUTE ON FUNCTION auth_helper.staff_level(), auth_helper.is_staff(text[]),
  auth_helper.sees_audit_entry(text), auth_helper.audit_area(text) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  identity.set_staff_member(uuid, uuid, text, boolean), identity.add_staff_member(uuid, text, text),
  config.current_version_id(), config.get(uuid), config.require(uuid, text),
  config.create_draft(uuid, uuid), config.update_draft(uuid, uuid, jsonb, text),
  config.publish_version(uuid, uuid, uuid),
  identity.create_legal_draft(uuid, text, text), identity.update_legal_draft(uuid, uuid, text),
  identity.publish_legal_document(uuid, uuid),
  config.save_document_type(uuid, uuid, text, text, text, boolean, boolean, integer),
  config.delete_document_type(uuid, uuid)
  TO service_role;
