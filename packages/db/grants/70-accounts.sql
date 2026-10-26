-- Grants of step H2. Reads by RLS; writes by functions called by the API, except the columns the
-- owner edits directly (data-model.md §1, "U coluna").

GRANT SELECT ON identity.requester_profiles, identity.interpreter_profiles, identity.organizations,
  identity.organization_members, identity.consents,
  identity.public_profiles, identity.account_directory, identity.organization_directory,
  identity.organization_member_directory, identity.consent_history, directory.listed_interpreters TO authenticated;
GRANT SELECT (id, organization_id, email, role, invited_by, expires_at, status, accepted_by, decided_at, created_at)
  ON identity.organization_invites TO authenticated;

GRANT UPDATE (full_name, phone, avatar_path) ON identity.profiles TO authenticated;
GRANT UPDATE (nif, address, city) ON identity.requester_profiles TO authenticated;
GRANT UPDATE (bio, years_experience, modality, minimum_hourly_rate_aoa, accepts_negotiation, travel_fee_aoa,
  city, contact_phone, contact_whatsapp, website_url, linkedin_url, instagram_url, facebook_url)
  ON identity.interpreter_profiles TO authenticated;
GRANT UPDATE (name, sector, address, city, website_url, phone) ON identity.organizations TO authenticated;

GRANT SELECT ON identity.requester_profiles, identity.interpreter_profiles, identity.organizations,
  identity.organization_members, identity.organization_invites, identity.consents,
  directory.listed_interpreters TO service_role;

GRANT EXECUTE ON FUNCTION auth_helper.is_interpreter(), auth_helper.is_requester(), auth_helper.org_role(uuid),
  auth_helper.my_org_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_helper.pending_legal_documents(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION
  identity.roles_of(uuid), identity.me(uuid),
  identity.record_consents(uuid, uuid[], text, text), identity.assert_acceptable_documents(uuid[]),
  identity.email_in_use(text),
  identity.become_requester(uuid, text, text, text), identity.become_interpreter(uuid, text, text),
  identity.set_active_role(uuid, text),
  identity.create_organization(uuid, text, text, text, text, text, text, text),
  identity.create_invite(uuid, uuid, text, text), identity.invite_preview(text),
  identity.accept_invite(uuid, text), identity.revoke_invite(uuid, uuid, uuid),
  identity.set_member_role(uuid, uuid, uuid, text), identity.transfer_ownership(uuid, uuid, uuid),
  identity.remove_member(uuid, uuid, uuid),
  identity.suspend_account(uuid, uuid, text), identity.reactivate_account(uuid, uuid),
  identity.suspend_organization(uuid, uuid, text), identity.reactivate_organization(uuid, uuid)
  TO service_role;
