-- The catalogs as the team manages them: every item with "Usado em N sítios" (catalogs.md). They
-- run as their owner (the usage reads tables the team cannot) and show rows to the team only.
-- The columns are listed, not "*": CREATE OR REPLACE VIEW refuses a view whose columns move, and a
-- later migration adding a column must not break this phase; a new column is added here by hand.

CREATE OR REPLACE VIEW catalog.language_admin WITH (security_invoker = false) AS
SELECT l.id, l.code, l.name, l.is_sign_language, l.active, l.sort, l.created_at, l.updated_at,
       coalesce(u.used, 0) AS used_in
  FROM catalog.languages AS l
  LEFT JOIN catalog.item_usage AS u ON u.kind = 'language' AND u.id = l.id
 WHERE auth_helper.is_staff();

CREATE OR REPLACE VIEW catalog.specialty_admin WITH (security_invoker = false) AS
SELECT s.id, s.slug, s.name, s.description, s.active, s.sort, s.created_at, s.updated_at,
       coalesce(u.used, 0) AS used_in
  FROM catalog.specialties AS s
  LEFT JOIN catalog.item_usage AS u ON u.kind = 'specialty' AND u.id = s.id
 WHERE auth_helper.is_staff();

CREATE OR REPLACE VIEW catalog.service_admin WITH (security_invoker = false) AS
SELECT s.id, s.slug, s.title, s.description, s.pricing_mode, s.platform_price_aoa, s.icon, s.active, s.sort,
       s.created_at, s.updated_at,
       coalesce(u.used, 0) AS used_in
  FROM catalog.services AS s
  LEFT JOIN catalog.item_usage AS u ON u.kind = 'service' AND u.id = s.id
 WHERE auth_helper.is_staff();
