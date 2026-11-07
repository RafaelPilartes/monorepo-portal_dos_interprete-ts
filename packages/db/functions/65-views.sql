-- Views of step H1. security_invoker: the caller's RLS applies to every table underneath.

-- R-AUD-03: the audit as the team reads it, with the actor's name and level. Rows are filtered by
-- the policy on audit.events (each level sees its areas).
CREATE OR REPLACE VIEW audit.events_for_staff WITH (security_invoker = true) AS
SELECT e.id, e.occurred_at, e.actor_account, p.full_name AS actor_name, e.actor_role, e.action,
       e.entity_type, auth_helper.audit_area(e.entity_type) AS area, e.entity_id, e.before, e.after,
       e.request_id, e.note
  FROM audit.events AS e
  LEFT JOIN identity.profiles AS p ON p.id = e.actor_account;

-- /team: members with name and email (email from auth.users, which the session cannot read, so
-- this view runs as its owner and filters to the team itself).
CREATE OR REPLACE VIEW identity.staff_directory WITH (security_invoker = false) AS
SELECT s.account_id, p.full_name, u.email::text AS email, s.level, s.active, s.created_by,
       c.full_name AS created_by_name, s.created_at
  FROM identity.staff_members AS s
  JOIN identity.profiles AS p ON p.id = s.account_id
  JOIN auth.users AS u ON u.id = s.account_id
  LEFT JOIN identity.profiles AS c ON c.id = s.created_by
 WHERE auth_helper.is_staff();
