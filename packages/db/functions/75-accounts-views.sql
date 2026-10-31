-- Views of step H2. A view that needs auth.users (the email) runs as its owner and filters the rows
-- itself; the others are security_invoker, so the caller's RLS applies underneath.

-- R-PRIV-04: name and photo of any account, for any active account (never phone or status).
CREATE OR REPLACE VIEW identity.public_profiles WITH (security_invoker = false) AS
SELECT p.id, p.full_name, p.avatar_path
  FROM identity.profiles AS p
 WHERE auth_helper.is_active() AND p.status <> 'anonymized';

-- The interpreters the directory shows to an active account (R-DIR-03): complete profile and an
-- active account; a suspended or anonymized account leaves it at once (R-ACC-05).
CREATE OR REPLACE VIEW directory.listed_interpreters WITH (security_invoker = false) AS
SELECT i.account_id, i.slug, p.full_name, p.avatar_path, i.city, i.modality
  FROM identity.interpreter_profiles AS i
  JOIN identity.profiles AS p ON p.id = i.account_id
 JOIN directory.profile_status AS ps ON ps.account_id = i.account_id
 WHERE p.status = 'active' AND cardinality(ps.missing) = 0 AND (SELECT auth_helper.is_active());

-- /requesters and /interpreters of admin-web (accounts-and-organizations.md): accounts with their
-- email and roles, for the team only.
CREATE OR REPLACE VIEW identity.account_directory WITH (security_invoker = false) AS
SELECT p.id, p.full_name, u.email::text AS email, p.phone, p.status, p.suspended_at, p.suspended_reason,
       p.anonymized_at, p.created_at,
       (r.account_id IS NOT NULL) AS is_individual_requester,
       EXISTS (SELECT 1 FROM identity.organization_members AS m
                WHERE m.account_id = p.id AND m.status = 'active') AS is_org_member,
       (i.account_id IS NOT NULL) AS is_interpreter,
       i.slug AS interpreter_slug, coalesce(i.city, r.city) AS city,
       s.level AS staff_level
  FROM identity.profiles AS p
  JOIN auth.users AS u ON u.id = p.id
  LEFT JOIN identity.requester_profiles AS r ON r.account_id = p.id
  LEFT JOIN identity.interpreter_profiles AS i ON i.account_id = p.id
  LEFT JOIN identity.staff_members AS s ON s.account_id = p.id AND s.active
 WHERE auth_helper.is_staff();

-- /organizations of admin-web: with the owner and the number of active members, for the team.
CREATE OR REPLACE VIEW identity.organization_directory WITH (security_invoker = false) AS
SELECT o.id, o.name, o.nif, o.sector, o.city, o.phone, o.website_url, o.address, o.status,
       o.suspended_at, o.suspended_reason, o.created_at,
       (SELECT count(*) FROM identity.organization_members AS m
         WHERE m.organization_id = o.id AND m.status = 'active')::integer AS member_count,
       owner.account_id AS owner_id, op.full_name AS owner_name, ou.email::text AS owner_email
  FROM identity.organizations AS o
  LEFT JOIN identity.organization_members AS owner
         ON owner.organization_id = o.id AND owner.role = 'owner' AND owner.status = 'active'
  LEFT JOIN identity.profiles AS op ON op.id = owner.account_id
  LEFT JOIN auth.users AS ou ON ou.id = owner.account_id
 WHERE auth_helper.is_staff();

-- /organization/members of requester-web: members with name and email, for the members of the same
-- organisation and the team. Removed members only for the team.
CREATE OR REPLACE VIEW identity.organization_member_directory WITH (security_invoker = false) AS
SELECT m.organization_id, m.account_id, p.full_name, u.email::text AS email, m.role, m.status,
       m.joined_at, m.removed_at, o.name AS organization_name
  FROM identity.organization_members AS m
  JOIN identity.organizations AS o ON o.id = m.organization_id
  JOIN identity.profiles AS p ON p.id = m.account_id
  JOIN auth.users AS u ON u.id = m.account_id
 WHERE auth_helper.is_staff()
    OR (m.status = 'active' AND m.organization_id IN (SELECT auth_helper.my_org_ids()));

-- "Os meus consentimentos" and the team's account sheet: each acceptance with its document.
CREATE OR REPLACE VIEW identity.consent_history WITH (security_invoker = true) AS
SELECT c.id, c.account_id, c.accepted_at, d.kind, d.version
  FROM identity.consents AS c
  JOIN identity.legal_documents AS d ON d.id = c.legal_document_id;
