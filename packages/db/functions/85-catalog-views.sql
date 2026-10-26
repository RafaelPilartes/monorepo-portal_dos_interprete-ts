-- The catalogs as the team manages them: every item with "Usado em N sítios" (catalogs.md). They
-- run as their owner (the usage reads tables the team cannot) and show rows to the team only.

CREATE OR REPLACE VIEW catalog.language_admin WITH (security_invoker = false) AS
SELECT l.*, coalesce(u.used, 0) AS used_in
  FROM catalog.languages AS l
  LEFT JOIN catalog.item_usage AS u ON u.kind = 'language' AND u.id = l.id
 WHERE auth_helper.is_staff();

CREATE OR REPLACE VIEW catalog.specialty_admin WITH (security_invoker = false) AS
SELECT s.*, coalesce(u.used, 0) AS used_in
  FROM catalog.specialties AS s
  LEFT JOIN catalog.item_usage AS u ON u.kind = 'specialty' AND u.id = s.id
 WHERE auth_helper.is_staff();

CREATE OR REPLACE VIEW catalog.service_admin WITH (security_invoker = false) AS
SELECT s.*, coalesce(u.used, 0) AS used_in
  FROM catalog.services AS s
  LEFT JOIN catalog.item_usage AS u ON u.kind = 'service' AND u.id = s.id
 WHERE auth_helper.is_staff();
